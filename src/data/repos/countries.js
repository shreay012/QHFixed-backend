/**
 * Countries repository — dual-driver gateway during the Mongo→Postgres
 * strangler-fig migration.
 *
 * Reads:  routed by env.PG_DRIVER_COUNTRIES (default 'mongo')
 * Writes: hit Mongo always; ALSO hit Postgres when env.PG_DUAL_WRITE
 *         contains 'countries'. Pg failures during dual-write are
 *         logged but don't break the Mongo path — we never let migration
 *         work harm a live request.
 *
 * This file is the only place that needs to know both DB shapes. Route
 * handlers just import and call repo functions.
 */

import { eq } from 'drizzle-orm';
import { getDb as getMongo } from '../../config/db.js';
import { getPg } from '../../db/postgres.js';
import { countries as countriesTable } from '../../db/schema.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

const TABLE_NAME = 'countries';
const mongoCol = () => getMongo().collection(TABLE_NAME);

function readsFromPg() {
  return env.PG_DRIVER_COUNTRIES === 'postgres' && !!getPg();
}
function dualWritesEnabled() {
  const list = String(env.PG_DUAL_WRITE || '').split(',').map((s) => s.trim());
  return list.includes(TABLE_NAME) && !!getPg();
}

// ── Reads ──────────────────────────────────────────────────────────

export async function findAll() {
  if (readsFromPg()) {
    return await getPg().select().from(countriesTable);
  }
  return await mongoCol().find({}).toArray();
}

export async function findByCode(code) {
  if (readsFromPg()) {
    const rows = await getPg().select().from(countriesTable).where(eq(countriesTable.code, code)).limit(1);
    return rows[0] || null;
  }
  return await mongoCol().findOne({ code });
}

// ── Writes (dual-write aware) ──────────────────────────────────────

export async function upsertByCode(doc) {
  // Mongo first — always the source of truth during migration.
  const r = await mongoCol().findOneAndUpdate(
    { code: doc.code },
    { $set: { ...doc, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true, returnDocument: 'after' },
  );
  const result = r.value || r;

  // Async dual-write to Postgres — fire and forget; failures logged.
  if (dualWritesEnabled()) {
    getPg()
      .insert(countriesTable)
      .values(toPgRow(result))
      .onConflictDoUpdate({
        target: countriesTable.code,
        set: toPgUpdateSet(result),
      })
      .catch((err) => logger.error({ err: err.message, table: TABLE_NAME }, 'pg dual-write failed'));
  }

  return result;
}

// ── Mongo doc → Postgres row mapper ────────────────────────────────
function toPgRow(doc) {
  return {
    _id:            String(doc._id),
    code:           doc.code,
    name:           doc.name,
    currency:       doc.currency,
    supportedLangs: doc.supportedLangs,
    config:         doc.config,
    active:         doc.active !== false,
    createdAt:      doc.createdAt || new Date(),
    updatedAt:      doc.updatedAt || new Date(),
  };
}
function toPgUpdateSet(doc) {
  const row = toPgRow(doc);
  delete row._id;
  delete row.createdAt;
  return row;
}
