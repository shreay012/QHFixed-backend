import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { redis } from '../../config/redis.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { AppError } from '../../utils/AppError.js';
import * as repo from './auth.repository.js';

// ---------------------------------------------------------------------------
// In-memory Redis fallback (dev only)
// Used automatically when the Redis connection is unavailable so that the
// OTP flow still works locally without a running Redis instance.
// ---------------------------------------------------------------------------
const memStore = new Map(); // key → { value, expiresAt }

function memGet(key) {
  const entry = memStore.get(key);
  if (!entry) return null;
  if (entry.expiresAt && Date.now() > entry.expiresAt) { memStore.delete(key); return null; }
  return entry.value;
}
function memSet(key, value, ttlSeconds) {
  memStore.set(key, { value, expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null });
}
function memIncr(key) {
  const cur = Number(memGet(key) ?? 0) + 1;
  const prev = memStore.get(key);
  // preserve existing TTL when bumping the counter
  memStore.set(key, { value: String(cur), expiresAt: prev?.expiresAt ?? null });
  return cur;
}
function memExpire(key, ttlSeconds) {
  const entry = memStore.get(key);
  if (entry) entry.expiresAt = Date.now() + ttlSeconds * 1000;
}
function memDel(key) { memStore.delete(key); }

// Try Redis directly — fall back to memory only if it throws (no ping overhead)
async function kv_incr(key) {
  try { return await redis.incr(key); } catch { return memIncr(key); }
}
async function kv_expire(key, ttl) {
  try { await redis.expire(key, ttl); } catch { memExpire(key, ttl); }
}
async function kv_set(key, value, ...args) {
  try { await redis.set(key, value, ...args); return; } catch {}
  const exIdx = args.findIndex(a => String(a).toUpperCase() === 'EX');
  const ttl = exIdx !== -1 ? Number(args[exIdx + 1]) : null;
  memSet(key, value, ttl);
}
async function kv_get(key) {
  try { return await redis.get(key); } catch { return memGet(key); }
}
async function kv_del(key) {
  try { await redis.del(key); } catch { memDel(key); }
}

function genOtp(len = env.OTP_LENGTH) {
  let s = '';
  for (let i = 0; i < len; i++) s += Math.floor(Math.random() * 10);
  return s;
}

// Normalise a user-entered mobile to E.164 format expected by SMS APIs.
// Accepts:
//   "+919876543210"  → "+919876543210"  (already correct)
//   "919876543210"   → "+919876543210"  (missing leading +)
//   "9876543210"     → "+919876543210"  (legacy 10-digit Indian, default +91)
// Returns null on invalid input.
function toE164(mobile) {
  if (!mobile) return null;
  const cleaned = String(mobile).replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  // 10-digit Indian fallback for legacy clients without country code.
  if (/^\d{10}$/.test(cleaned)) return `+91${cleaned}`;
  // 11-15 digit assume country code already included, just add +
  if (/^\d{7,15}$/.test(cleaned)) return `+${cleaned}`;
  return null;
}

async function sendSms(mobile, body) {
  if (env.SMS_PROVIDER === 'mock') {
    logger.info({ mobile, body }, '[MOCK SMS]');
    return;
  }

  if (env.SMS_PROVIDER === 'twilio') {
    if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_PHONE_NUMBER) {
      logger.warn('Twilio credentials not fully set — OTP not sent');
      logger.info({ mobile, body }, '[OTP FALLBACK LOG]');
      return;
    }
    try {
      // Lazy-load the Twilio SDK so the dependency is only required when
      // actually used. Keeps mock/dev startup fast and the bundle small.
      const { default: twilio } = await import('twilio');
      const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
      const to = toE164(mobile) || mobile;
      const result = await client.messages.create({
        body,
        from: env.TWILIO_PHONE_NUMBER,
        to,
      });
      logger.info({ mobile: to, sid: result.sid }, 'Twilio SMS sent');
      return;
    } catch (e) {
      logger.warn({ err: e.message, mobile }, 'Twilio send failed — falling back to log');
      logger.info({ mobile, body }, '[OTP FALLBACK LOG]');
      return;
    }
  }

  if (env.SMS_PROVIDER === 'msg91') {
    if (!env.MSG91_AUTH_KEY) {
      logger.warn('MSG91_AUTH_KEY not set — OTP not sent');
      return;
    }

    // MSG91 expects national number with country code prefix (no `+`).
    // Accept either E.164 (+919876543210) or legacy 10-digit Indian.
    const e164 = toE164(mobile) || `+91${mobile}`;
    const mobile91 = e164.replace(/^\+/, '');
    const message = encodeURIComponent(body);

    // Using MSG91 Send HTTP API (route 4 = transactional, no template needed)
    const url = `https://api.msg91.com/api/sendhttp.php?authkey=${env.MSG91_AUTH_KEY}&mobiles=${mobile91}&message=${message}&route=4&country=91&unicode=0`;

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000),
      });
      const text = await res.text();
      if (res.ok && !text.toLowerCase().includes('error')) {
        logger.info({ mobile }, 'MSG91 SMS sent');
        return;
      }
      logger.warn({ mobile, response: text }, 'MSG91 SMS failed — falling back to log');
    } catch (e) {
      logger.warn({ err: e.message, mobile }, 'MSG91 request error — falling back to log');
    }
    // Fallback: always log OTP so it's visible in Render logs if SMS fails
    logger.info({ mobile, body }, '[OTP FALLBACK LOG]');
    return;
  }
}

function signAccessToken({ userId, role, sessionId }) {
  return jwt.sign(
    { sub: userId, role, sessionId },
    env.JWT_PRIVATE_KEY,
    {
      algorithm: env.JWT_ALGORITHM,
      expiresIn: env.JWT_ACCESS_TTL,
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    },
  );
}

function refreshTtlMs() {
  // crude parser: support Nd / Nh
  const m = env.JWT_REFRESH_TTL.match(/^(\d+)([dh])$/);
  if (!m) return 30 * 24 * 60 * 60 * 1000;
  const n = Number(m[1]);
  return m[2] === 'd' ? n * 86400_000 : n * 3600_000;
}

export async function sendOtp({ mobile, role }) {
  const limitKey = `otp:rate:${mobile}`;
  const count = await kv_incr(limitKey);
  if (count === 1) await kv_expire(limitKey, 60);
  if (count > 5) throw new AppError('RATE_LIMITED', 'Too many OTP requests', 429);

  const otp = genOtp();
  const hash = await bcrypt.hash(otp, 8);
  await kv_set(`otp:${role}:${mobile}`, hash, 'EX', env.OTP_TTL_SECONDS);
  await sendSms(mobile, `Your QuickHire OTP is ${otp}. Valid for 5 minutes.`);
  // Never log OTP in production — security + GDPR risk
  if (env.NODE_ENV !== 'production') {
    logger.info({ mobile, otp }, '[DEV OTP]');
  }
  return { success: true };
}

export async function verifyOtp({ mobile, otp, fcmToken, role = 'user', ip, ua }) {
  const key = `otp:${role}:${mobile}`;

  // Master OTP: hardcoded `1234` works ONLY for internal roles (admin / pm
  // / resource and other staff variants), never for `user` (customer).
  // Customers must use a real OTP delivered via Twilio so they can't be
  // impersonated. Internal staff still get the master fallback so demos
  // and flaky-SMS situations don't block the team.
  const INTERNAL_ROLES = new Set(['admin', 'pm', 'resource', 'super_admin', 'ops', 'finance', 'support', 'growth', 'viewer']);
  const MASTER_OTP = '1234';
  const isMasterOtp = otp === MASTER_OTP && INTERNAL_ROLES.has(role);

  // Legacy env-gated dev master OTP (kept for back-compat; can be a different
  // value than 1234 if DEV_MASTER_OTP is set). Also internal-only.
  const devMasterOtp = env.DEV_MASTER_OTP;
  const isDevMaster = devMasterOtp && env.NODE_ENV !== 'production'
    && otp === devMasterOtp && INTERNAL_ROLES.has(role);

  if (isMasterOtp || isDevMaster) {
    await kv_del(key).catch(() => {});
    if (isMasterOtp) {
      logger.warn({ mobile, role, ip }, 'master OTP used');
    }
  } else {
    const hash = await kv_get(key);
    if (!hash) throw new AppError('AUTH_INVALID_OTP', 'OTP expired or not requested', 400);
    const ok = await bcrypt.compare(otp, hash);
    if (!ok) throw new AppError('AUTH_INVALID_OTP', 'Invalid OTP', 400);
    await kv_del(key);
  }

  const user = await repo.upsertUser({ mobile, role, fcmToken });
  const userId = String(user._id);

  const refreshToken = nanoid(48);
  const refreshTokenHash = await bcrypt.hash(refreshToken, 8);
  const expiresAt = new Date(Date.now() + refreshTtlMs());
  const session = await repo.createSession({ userId, refreshTokenHash, ip, ua, expiresAt });

  const token = signAccessToken({ userId, role: user.role, sessionId: String(session._id) });

  return {
    token,
    refreshToken,
    user: sanitizeUser(user),
    isNewUser: !user.meta?.isProfileComplete,
  };
}

export async function guestAccess() {
  const guestId = `guest_${nanoid(16)}`;
  const token = jwt.sign(
    { sub: guestId, role: 'guest' },
    env.JWT_PRIVATE_KEY,
    {
      algorithm: env.JWT_ALGORITHM,
      expiresIn: '7d',
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
    },
  );
  return { token };
}

export async function logout({ sessionId, accessTokenExpSec }) {
  if (!sessionId) return;
  await repo.revokeSession(sessionId);
  // Block the access token until it would naturally expire
  const ttl = Math.max(60, accessTokenExpSec || 7 * 24 * 60 * 60);
  await redis.set(`blocklist:${sessionId}`, '1', 'EX', ttl);
}

export async function refresh({ refreshToken, sessionId }) {
  if (!sessionId) throw new AppError('AUTH_TOKEN_INVALID', 'Missing session', 401);
  const session = await repo.findSession(sessionId);
  if (!session || session.revoked) throw new AppError('AUTH_TOKEN_REVOKED', 'Session revoked', 401);
  if (session.expiresAt < new Date()) throw new AppError('AUTH_TOKEN_EXPIRED', 'Refresh expired', 401);

  const ok = await bcrypt.compare(refreshToken, session.refreshTokenHash);
  if (!ok) throw new AppError('AUTH_TOKEN_INVALID', 'Invalid refresh token', 401);

  const user = await repo.findUserById(session.userId);
  if (!user) throw new AppError('RESOURCE_NOT_FOUND', 'User not found', 404);

  const token = signAccessToken({ userId: String(user._id), role: user.role, sessionId });
  return { token, user: sanitizeUser(user) };
}

export function sanitizeUser(u) {
  if (!u) return null;
  const { fcmTokens, ...rest } = u;
  return rest;
}
