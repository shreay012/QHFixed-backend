/**
 * Auth repository — thin wrapper over the typed users + sessions repos.
 *
 * Both repos transparently route to Postgres or Mongo based on
 * PG_DRIVER_USERS / PG_DRIVER_SESSIONS env flags, so this module is
 * storage-agnostic. The in-memory fallback path remains for the dev
 * case where neither database is reachable (e.g. fresh laptop with
 * MONGO_URI=disabled and Postgres not yet provisioned).
 */
import { ObjectId } from 'mongodb';
import { logger } from '../../config/logger.js';
import * as usersRepo from '../../data/repos/users.js';
import * as sessionsRepo from '../../data/repos/sessions.js';

// In-memory fallback (dev, resets on restart)
const memUsers    = new Map(); // `${mobile}:${role}` → user doc
const memSessions = new Map(); // sessionId string    → session doc

function memUpsertUser({ mobile, role }) {
  const key = `${mobile}:${role}`;
  const now = new Date();
  if (!memUsers.has(key)) {
    memUsers.set(key, {
      _id: new ObjectId(),
      mobile, role,
      meta: { isProfileComplete: false, status: 'active', lastLoginAt: now },
      createdAt: now, updatedAt: now,
    });
    logger.warn({ mobile, role }, '[MEM-DB] no DB available — user stored in memory');
  } else {
    const u = memUsers.get(key);
    u.meta.lastLoginAt = now;
    u.updatedAt = now;
  }
  return memUsers.get(key);
}

function memFindUserById(id) {
  const s = String(id);
  for (const u of memUsers.values()) if (String(u._id) === s) return u;
  return null;
}

function memCreateSession({ userId, refreshTokenHash, ip, ua, expiresAt }) {
  const _id = new ObjectId();
  const doc = { _id, userId: new ObjectId(String(userId)), refreshTokenHash, ip, ua, revoked: false, createdAt: new Date(), expiresAt };
  memSessions.set(String(_id), doc);
  return doc;
}

function memFindSession(sessionId) { return memSessions.get(String(sessionId)) || null; }
function memRevokeSession(sessionId) { const s = memSessions.get(String(sessionId)); if (s) s.revoked = true; }

// ─── exports ─────────────────────────────────────────────────────────────────

export const findUserByMobile = async (mobile, role) => {
  try {
    const u = await usersRepo.findByMobile(mobile, role);
    if (u) return u;
  } catch (e) {
    logger.warn({ err: e.message }, '[AUTH-REPO] findByMobile failed — falling back to memory');
  }
  return memUsers.get(`${mobile}:${role}`) || null;
};

export const upsertUser = async ({ mobile, role, fcmToken }) => {
  try {
    const extras = {};
    if (fcmToken) {
      // fcmTokens is a JSONB array in PG / Mongo array. Append-only
      // semantics handled inside the repo's update path.
      extras.fcmTokens = [{ token: fcmToken, platform: 'unknown', createdAt: new Date() }];
    }
    return await usersRepo.upsertByMobile({ mobile, role, ...extras });
  } catch (e) {
    logger.warn({ err: e.message }, '[AUTH-REPO] upsertUser failed — falling back to memory');
    return memUpsertUser({ mobile, role, fcmToken });
  }
};

export const findUserById = async (id) => {
  try {
    const u = await usersRepo.findById(id);
    if (u) return u;
  } catch (e) {
    logger.warn({ err: e.message }, '[AUTH-REPO] findUserById failed — falling back to memory');
  }
  return memFindUserById(id);
};

export const createSession = async ({ userId, refreshTokenHash, ip, ua, expiresAt }) => {
  try {
    return await sessionsRepo.createOne({ userId, refreshTokenHash, ip, ua, expiresAt });
  } catch (e) {
    logger.warn({ err: e.message }, '[AUTH-REPO] createSession failed — falling back to memory');
    return memCreateSession({ userId, refreshTokenHash, ip, ua, expiresAt });
  }
};

export const revokeSession = async (sessionId) => {
  try {
    await sessionsRepo.revokeById(sessionId);
    return;
  } catch (e) {
    logger.warn({ err: e.message }, '[AUTH-REPO] revokeSession failed — falling back to memory');
    memRevokeSession(sessionId);
  }
};

export const findSession = async (sessionId) => {
  try {
    const s = await sessionsRepo.findById(sessionId);
    if (s) return s;
  } catch (e) {
    logger.warn({ err: e.message }, '[AUTH-REPO] findSession failed — falling back to memory');
  }
  return memFindSession(sessionId);
};
