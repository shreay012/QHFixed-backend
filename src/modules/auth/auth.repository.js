import { getDb } from '../../config/db.js';
import { ObjectId } from 'mongodb';
import { logger } from '../../config/logger.js';

// ─── In-memory fallback store (dev, resets on restart) ───────────────────────
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
    logger.warn({ mobile, role }, '[MEM-DB] MongoDB unavailable — user stored in memory');
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
  const doc = { _id, userId: new ObjectId(userId), refreshTokenHash, ip, ua, revoked: false, createdAt: new Date(), expiresAt };
  memSessions.set(String(_id), doc);
  return doc;
}

function memFindSession(sessionId) { return memSessions.get(String(sessionId)) || null; }
function memRevokeSession(sessionId) { const s = memSessions.get(String(sessionId)); if (s) s.revoked = true; }

// ─── helpers ─────────────────────────────────────────────────────────────────
function col(name) {
  try { return getDb().collection(name); }
  catch { return null; }
}

// ─── exports ─────────────────────────────────────────────────────────────────

export const findUserByMobile = async (mobile, role) => {
  const c = col('users');
  if (!c) return memUsers.get(`${mobile}:${role}`) || null;
  try { return await c.findOne({ mobile, role }); }
  catch { return memUsers.get(`${mobile}:${role}`) || null; }
};

export const upsertUser = async ({ mobile, role, fcmToken }) => {
  const c = col('users');
  if (!c) return memUpsertUser({ mobile, role, fcmToken });

  const now = new Date();
  const update = {
    $setOnInsert: { mobile, role, 'meta.isProfileComplete': false, 'meta.status': 'active', createdAt: now },
    $set: { 'meta.lastLoginAt': now, updatedAt: now },
  };
  if (fcmToken) update.$addToSet = { fcmTokens: { token: fcmToken, platform: 'unknown', createdAt: now } };

  try {
    const r = await c.findOneAndUpdate({ mobile, role }, update, { upsert: true, returnDocument: 'after' });
    return r.value || r;
  } catch (e) {
    logger.warn({ err: e.message }, '[MEM-DB] MongoDB upsertUser failed — falling back to memory');
    return memUpsertUser({ mobile, role, fcmToken });
  }
};

export const findUserById = async (id) => {
  const c = col('users');
  if (!c) return memFindUserById(id);
  try { return await c.findOne({ _id: new ObjectId(id) }); }
  catch { return memFindUserById(id); }
};

export const createSession = async ({ userId, refreshTokenHash, ip, ua, expiresAt }) => {
  const c = col('sessions');
  if (!c) return memCreateSession({ userId, refreshTokenHash, ip, ua, expiresAt });

  const doc = { userId: new ObjectId(userId), refreshTokenHash, ip, ua, revoked: false, createdAt: new Date(), expiresAt };
  try {
    const r = await c.insertOne(doc);
    return { _id: r.insertedId, ...doc };
  } catch (e) {
    logger.warn({ err: e.message }, '[MEM-DB] MongoDB createSession failed — falling back to memory');
    return memCreateSession({ userId, refreshTokenHash, ip, ua, expiresAt });
  }
};

export const revokeSession = async (sessionId) => {
  const c = col('sessions');
  if (!c) { memRevokeSession(sessionId); return; }
  try { await c.updateOne({ _id: new ObjectId(sessionId) }, { $set: { revoked: true } }); }
  catch { memRevokeSession(sessionId); }
};

export const findSession = async (sessionId) => {
  const c = col('sessions');
  if (!c) return memFindSession(sessionId);
  try { return await c.findOne({ _id: new ObjectId(sessionId) }); }
  catch { return memFindSession(sessionId); }
};
