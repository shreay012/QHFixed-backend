/**
 * Currencies repository — dual-driver gateway during the Mongo→Postgres
 * strangler-fig migration.
 *
 * Reads:  routed by env.PG_DRIVER_CURRENCIES (default 'mongo')
 * Writes: hit Mongo always; ALSO hit Postgres async when PG_DUAL_WRITE
 *         contains 'currencies'. PG failures during dual-write are logged
 *         but never break the Mongo path — migration must not harm a live
 *         request.
 */

import { eq, asc } from 'drizzle-orm';
import { getDb as getMongo } from '../../config/db.js';
import { getPg } from '../../db/postgres.js';
import { currencies as currenciesTable } from '../../db/schema.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

const TABLE = 'currencies';
const mongoCol = () => getMongo().collection(TABLE);
const readsFromPg = () => env.PG_DRIVER_CURRENCIES === 'postgres' && !!getPg();
const dualWritesEnabled = () => String(env.PG_DUAL_WRITE || '').split(',').map((s) => s.trim()).includes(TABLE) && !!getPg();

// Translate a Postgres row back to the Mongo-shaped doc the rest of the
// application expects. Keeps the API contract stable while the store
// underneath changes.
function fromPgRow(row) {
  if (!row) return null;
  return {
    _id:       row._id,
    code:      row.code,
    name:      row.name,
    symbol:    row.symbol,
    decimals:  row.decimals,
    active:    row.active,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function findAll() {
  if (readsFromPg()) {
    const rows = await getPg().select().from(currenciesTable).orderBy(asc(currenciesTable.code));
    return rows.map(fromPgRow);
  }
  return await mongoCol().find({}).toArray();
}

export async function findByCode(code) {
  if (readsFromPg()) {
    const rows = await getPg().select().from(currenciesTable).where(eq(currenciesTable.code, code)).limit(1);
    return fromPgRow(rows[0]);
  }
  return await mongoCol().findOne({ code });
}

export async function upsertByCode(doc) {
  if (readsFromPg()) {
    const merged = {
      ...doc,
      createdAt: doc.createdAt || new Date(),
      updatedAt: new Date(),
    };
    await getPg()
      .insert(currenciesTable)
      .values(toPgRow(merged))
      .onConflictDoUpdate({ target: currenciesTable.code, set: toPgUpdateSet(merged) });
    const rows = await getPg().select().from(currenciesTable).where(eq(currenciesTable.code, doc.code)).limit(1);
    return fromPgRow(rows[0]) || merged;
  }

  const r = await mongoCol().findOneAndUpdate(
    { code: doc.code },
    { $set: { ...doc, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
    { upsert: true, returnDocument: 'after' },
  );
  const result = r.value || r;

  if (dualWritesEnabled()) {
    getPg()
      .insert(currenciesTable)
      .values({ ...toPgRow(result) })
      .onConflictDoUpdate({ target: currenciesTable.code, set: toPgUpdateSet(result) })
      .catch((err) => logger.error({ err: err.message, table: TABLE }, 'pg dual-write failed'));
  }

  return result;
}

function toPgRow(doc) {
  return {
    _id:        String(doc._id),
    code:       doc.code,
    name:       doc.name || null,
    symbol:     doc.symbol || null,
    decimals:   typeof doc.decimals === 'number' ? doc.decimals : 2,
    active:     doc.active !== false,
    createdAt:  doc.createdAt || new Date(),
    updatedAt:  doc.updatedAt || new Date(),
  };
}
function toPgUpdateSet(doc) {
  const row = toPgRow(doc);
  delete row._id;
  delete row.createdAt;
  return row;
}
