/**
 * Sessions repository — Mongo↔Postgres dual-driver.
 *
 * Auth refresh + JWT-blocklist flow uses these. When PG_DRIVER_SESSIONS=
 * postgres (or Mongo is disabled), reads + writes go straight to PG.
 */

import { eq } from 'drizzle-orm';
import { ObjectId } from 'mongodb';
import { getDb as getMongo } from '../../config/db.js';
import { getPg } from '../../db/postgres.js';
import { sessions as sessionsTable } from '../../db/schema.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

const TABLE = 'sessions';
const mongoCol = () => getMongo().collection(TABLE);

function readsFromPg() {
  return env.PG_DRIVER_SESSIONS === 'postgres' && !!getPg();
}
function dualWritesEnabled() {
  return String(env.PG_DUAL_WRITE || '').split(',').map((s) => s.trim()).includes(TABLE) && !!getPg();
}

function fromPgRow(row) {
  if (!row) return null;
  return {
    _id:              row._id,
    userId:           row.userId,
    refreshTokenHash: row.refreshTokenHash,
    ip:               row.ip || undefined,
    ua:               row.ua || undefined,
    revoked:          row.revoked,
    expiresAt:        row.expiresAt,
    createdAt:        row.createdAt,
    updatedAt:        row.updatedAt,
  };
}

function toPgRow(doc) {
  return {
    _id:              String(doc._id),
    userId:           String(doc.userId),
    refreshTokenHash: doc.refreshTokenHash,
    ip:               doc.ip || null,
    ua:               doc.ua || null,
    revoked:          doc.revoked === true,
    expiresAt:        doc.expiresAt instanceof Date ? doc.expiresAt : new Date(doc.expiresAt),
    createdAt:        doc.createdAt || new Date(),
    updatedAt:        doc.updatedAt || new Date(),
  };
}
function toPgUpdateSet(doc) {
  const row = toPgRow(doc);
  delete row._id;
  delete row.createdAt;
  return row;
}

// ── Reads ──────────────────────────────────────────────────────────

export async function findAll() {
  if (readsFromPg()) {
    const rows = await getPg().select().from(sessionsTable);
    return rows.map(fromPgRow);
  }
  return await mongoCol().find({}).toArray();
}

export async function findById(idLike) {
  if (!idLike) return null;
  const idStr = String(idLike);
  if (readsFromPg()) {
    const rows = await getPg().select().from(sessionsTable).where(eq(sessionsTable._id, idStr)).limit(1);
    return fromPgRow(rows[0]);
  }
  if (!/^[0-9a-fA-F]{24}$/.test(idStr)) return null;
  return await mongoCol().findOne({ _id: new ObjectId(idStr) });
}

// ── Writes ─────────────────────────────────────────────────────────

export async function createOne({ userId, refreshTokenHash, ip, ua, expiresAt }) {
  const id = new ObjectId().toString();
  const now = new Date();
  const doc = {
    _id: id,
    userId: String(userId),
    refreshTokenHash,
    ip: ip || null,
    ua: ua || null,
    revoked: false,
    expiresAt,
    createdAt: now,
    updatedAt: now,
  };

  if (readsFromPg()) {
    await getPg()
      .insert(sessionsTable)
      .values(toPgRow(doc))
      .onConflictDoUpdate({ target: sessionsTable._id, set: toPgUpdateSet(doc) });
    return doc;
  }

  const mongoDoc = { ...doc, _id: new ObjectId(id), userId: new ObjectId(String(userId)) };
  await mongoCol().insertOne(mongoDoc);
  if (dualWritesEnabled()) {
    getPg()
      .insert(sessionsTable)
      .values(toPgRow(doc))
      .onConflictDoUpdate({ target: sessionsTable._id, set: toPgUpdateSet(doc) })
      .catch((err) => logger.error({ err: err.message, table: TABLE }, 'pg dual-write failed'));
  }
  return mongoDoc;
}

export async function revokeById(idLike) {
  const idStr = String(idLike);
  if (readsFromPg()) {
    await getPg()
      .update(sessionsTable)
      .set({ revoked: true, updatedAt: new Date() })
      .where(eq(sessionsTable._id, idStr));
    return;
  }
  const id = typeof idLike === 'string' ? new ObjectId(idLike) : idLike;
  await mongoCol().updateOne({ _id: id }, { $set: { revoked: true, updatedAt: new Date() } });
  if (dualWritesEnabled()) {
    getPg()
      .update(sessionsTable)
      .set({ revoked: true, updatedAt: new Date() })
      .where(eq(sessionsTable._id, idStr))
      .catch((err) => logger.error({ err: err.message, table: TABLE }, 'pg dual-write failed'));
  }
}
