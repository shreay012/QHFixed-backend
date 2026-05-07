/**
 * Users repository — Mongo↔Postgres dual-driver gateway.
 *
 * When PG_DRIVER_USERS=postgres (or env.MONGO_URI is disabled), every
 * read and write goes directly to Postgres. Otherwise the legacy Mongo
 * path is used with optional async dual-write to PG.
 *
 * Returns Mongo-shaped docs (camelCase, _id as ObjectId-or-string) so
 * existing callers (auth.repository.js, user.routes.js, etc.) work
 * unchanged.
 */

import { eq, and } from 'drizzle-orm';
import { ObjectId } from 'mongodb';
import { getDb as getMongo } from '../../config/db.js';
import { getPg } from '../../db/postgres.js';
import { users as usersTable } from '../../db/schema.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

const TABLE = 'users';
const mongoCol = () => getMongo().collection(TABLE);

function readsFromPg() {
  return env.PG_DRIVER_USERS === 'postgres' && !!getPg();
}
function dualWritesEnabled() {
  return String(env.PG_DUAL_WRITE || '').split(',').map((s) => s.trim()).includes(TABLE) && !!getPg();
}

// ── Row mappers ────────────────────────────────────────────────────

function fromPgRow(row) {
  if (!row) return null;
  return {
    _id:                  row._id,
    mobile:               row.mobile || undefined,
    email:                row.email || undefined,
    name:                 row.name || undefined,
    role:                 row.role,
    country:              row.country || undefined,
    parentCountryAdminId: row.parentCountryAdminId || undefined,
    managedCountries:     row.managedCountries || undefined,
    fcmTokens:            row.fcmTokens || undefined,
    specialization:       row.specialization || undefined,
    skills:               row.skills || undefined,
    meta:                 row.meta || {},
    history:              row.history || undefined,
    deletedAt:            row.deletedAt || undefined,
    createdAt:            row.createdAt,
    updatedAt:            row.updatedAt,
  };
}

function toPgRow(doc) {
  return {
    _id:                  String(doc._id),
    mobile:               doc.mobile || null,
    email:                doc.email || null,
    name:                 doc.name || null,
    role:                 doc.role || 'user',
    country:              doc.country || null,
    parentCountryAdminId: doc.parentCountryAdminId ? String(doc.parentCountryAdminId) : null,
    managedCountries:     doc.managedCountries || null,
    fcmTokens:            doc.fcmTokens || null,
    specialization:       doc.specialization || null,
    skills:               doc.skills || null,
    meta:                 doc.meta || null,
    history:              doc.history || null,
    deletedAt:            doc.deletedAt || null,
    createdAt:            doc.createdAt || new Date(),
    updatedAt:            doc.updatedAt || new Date(),
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
    const rows = await getPg().select().from(usersTable);
    return rows.map(fromPgRow);
  }
  return await mongoCol().find({}).toArray();
}

export async function findById(idLike) {
  if (!idLike) return null;
  const idStr = String(idLike);
  if (readsFromPg()) {
    const rows = await getPg().select().from(usersTable).where(eq(usersTable._id, idStr)).limit(1);
    return fromPgRow(rows[0]);
  }
  if (!/^[0-9a-fA-F]{24}$/.test(idStr)) return null;
  return await mongoCol().findOne({ _id: new ObjectId(idStr) });
}

export async function findByMobile(mobile, role) {
  if (readsFromPg()) {
    const rows = await getPg().select().from(usersTable)
      .where(role ? and(eq(usersTable.mobile, mobile), eq(usersTable.role, role)) : eq(usersTable.mobile, mobile))
      .limit(1);
    return fromPgRow(rows[0]);
  }
  return await mongoCol().findOne(role ? { mobile, role } : { mobile });
}

export async function findByEmail(email) {
  if (readsFromPg()) {
    const rows = await getPg().select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    return fromPgRow(rows[0]);
  }
  return await mongoCol().findOne({ email });
}

// ── Writes ─────────────────────────────────────────────────────────

export async function insertOne(doc) {
  const now = new Date();
  const id = doc._id ? String(doc._id) : new ObjectId().toString();
  const withTs = { ...doc, _id: id, createdAt: doc.createdAt || now, updatedAt: now };

  if (readsFromPg()) {
    await getPg()
      .insert(usersTable)
      .values(toPgRow(withTs))
      .onConflictDoUpdate({ target: usersTable._id, set: toPgUpdateSet(withTs) });
    return withTs;
  }

  const r = await mongoCol().insertOne({ ...withTs, _id: new ObjectId(id) });
  const inserted = { ...withTs, _id: r.insertedId };
  if (dualWritesEnabled()) {
    getPg()
      .insert(usersTable)
      .values(toPgRow(inserted))
      .onConflictDoUpdate({ target: usersTable._id, set: toPgUpdateSet(inserted) })
      .catch((err) => logger.error({ err: err.message, table: TABLE }, 'pg dual-write failed'));
  }
  return inserted;
}

export async function updateById(idLike, $set) {
  const idStr = String(idLike);
  if (readsFromPg()) {
    const merged = { ...$set, _id: idStr, updatedAt: new Date() };
    await getPg()
      .insert(usersTable)
      .values(toPgRow(merged))
      .onConflictDoUpdate({ target: usersTable._id, set: toPgUpdateSet(merged) });
    return await findById(idStr);
  }

  const id = typeof idLike === 'string' ? new ObjectId(idLike) : idLike;
  const result = await mongoCol().findOneAndUpdate(
    { _id: id },
    { $set: { ...$set, updatedAt: new Date() } },
    { returnDocument: 'after' },
  );
  const doc = result.value || result;
  if (dualWritesEnabled() && doc) {
    getPg()
      .insert(usersTable)
      .values(toPgRow(doc))
      .onConflictDoUpdate({ target: usersTable._id, set: toPgUpdateSet(doc) })
      .catch((err) => logger.error({ err: err.message, table: TABLE }, 'pg dual-write failed'));
  }
  return doc;
}

export async function upsertByMobile({ mobile, role, ...rest }) {
  if (readsFromPg()) {
    const existing = await findByMobile(mobile, role);
    if (existing) {
      return await updateById(existing._id, { ...rest, 'meta.lastLoginAt': new Date() });
    }
    return await insertOne({
      mobile, role,
      meta: { isProfileComplete: false, status: 'active', lastLoginAt: new Date() },
      ...rest,
    });
  }

  const now = new Date();
  const result = await mongoCol().findOneAndUpdate(
    { mobile, role },
    {
      $setOnInsert: {
        mobile, role,
        meta: { isProfileComplete: false, status: 'active', lastLoginAt: now },
        createdAt: now,
      },
      $set: { 'meta.lastLoginAt': now, updatedAt: now, ...rest },
    },
    { upsert: true, returnDocument: 'after' },
  );
  const doc = result.value || result;
  if (dualWritesEnabled() && doc) {
    getPg()
      .insert(usersTable)
      .values(toPgRow(doc))
      .onConflictDoUpdate({ target: usersTable._id, set: toPgUpdateSet(doc) })
      .catch((err) => logger.error({ err: err.message, table: TABLE }, 'pg dual-write failed'));
  }
  return doc;
}
