/**
 * dualCollection — drop-in replacement for `getDb().collection(name)` that
 * routes to Postgres when env.PG_DRIVER_<TABLE>=postgres, else to Mongo.
 *
 * The Postgres backend assumes the generic doc-mirror schema produced by
 * pg-mirror-all.js:
 *   _id CHAR(24) PK, data JSONB,
 *   country VARCHAR(2), status VARCHAR(64),
 *   user_id CHAR(24), pm_id CHAR(24), resource_id CHAR(24),
 *   created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ
 *
 * The 5 strict-schema tables (countries/currencies/services/users/sessions)
 * have richer column shapes; for those, callers should use the typed repos
 * in src/data/repos/*.js. dualCollection works for all 35 generic-doc tables.
 *
 * Supported subset of the Mongo collection API:
 *   .find(filter, options)       → .toArray() / .sort() / .skip() / .limit() / .project()
 *   .findOne(filter, options)
 *   .findOneAndUpdate(filter, update, options)
 *   .insertOne(doc)
 *   .insertMany(docs)
 *   .updateOne(filter, update, options)
 *   .updateMany(filter, update, options)
 *   .deleteOne(filter)
 *   .deleteMany(filter)
 *   .countDocuments(filter)
 *   .aggregate(pipeline)         → falls through to Mongo (always)
 *   .createIndex(...)            → no-op (DDL is managed elsewhere)
 *
 * Filter operator coverage (sufficient for current call-sites):
 *   {field: value}               → field = value (or data->>'field' = value)
 *   {field: {$in: [...]}}        → field IN (...)
 *   {field: {$nin: [...]}}       → field NOT IN (...)
 *   {field: {$ne: value}}        → field <> value
 *   {field: {$gt|$gte|$lt|$lte}} → numeric/temporal compare
 *   {field: {$exists: true}}     → field IS NOT NULL
 *   {field: {$exists: false}}    → field IS NULL
 *   {field: {$regex: '...'}}     → ILIKE / regex match
 *   {$or: [...]}                 → OR clauses
 *   {$and: [...]}                → AND clauses
 *
 * Anything more exotic (pipelines, $expr, $where) silently routes to Mongo
 * even when PG driver is on — caller can detect via .__driver if needed.
 */

import { ObjectId } from 'mongodb';
import { getDb as getMongo } from '../config/db.js';
import { getPgPool } from '../db/postgres.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

// Indexed extracted columns. When a filter targets one of these names, we
// match against the column directly (fast, indexed). Anything else lives
// in the JSONB `data` column.
const INDEXED_COLS = new Set([
  '_id', 'country', 'status', 'created_at', 'updated_at',
]);
// Map Mongo camelCase → Postgres snake_case for indexed cols.
const COL_MAP = {
  _id: '_id',
  country: 'country',
  status: 'status',
  userId: 'user_id',
  pmId: 'pm_id',
  resourceId: 'resource_id',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
};

// Strict-schema tables have explicit columns (no generic `data` JSONB).
// dualCol's translator assumes the generic mirror schema, so for these
// tables we keep reads on Mongo and let the typed repos in
// src/data/repos/*.js handle Postgres routing where it actually applies.
const STRICT_SCHEMA_TABLES = new Set([
  'countries', 'currencies', 'services', 'users', 'sessions',
]);

function pgDriverEnabled(table) {
  if (STRICT_SCHEMA_TABLES.has(table)) return false;
  // env keys are uppercase: PG_DRIVER_BOOKINGS, PG_DRIVER_JOBS etc.
  // Tables we don't have explicit env entries for default to mongo.
  const key = `PG_DRIVER_${table.toUpperCase()}`;
  return env[key] === 'postgres' && !!getPgPool();
}

function isInsertable(table) {
  // Same gate — for writes, dual-write logic decides what to do per-call.
  return !!getPgPool();
}

function dualWriteEnabled(table) {
  return String(env.PG_DUAL_WRITE || '').split(',').map((s) => s.trim()).includes(table);
}

// ── Filter translation ─────────────────────────────────────────────

let paramIdx = 0;
function nextPlaceholder(values, value) {
  values.push(value);
  return `$${++paramIdx}`;
}

function toPgValue(v) {
  if (v == null) return null;
  if (v instanceof ObjectId) return v.toString();
  if (v instanceof Date) return v;
  if (typeof v === 'object') return JSON.stringify(v);
  return v;
}

function buildColumnRef(field) {
  const mapped = COL_MAP[field];
  if (mapped) return mapped;
  // Nested path like 'pricing.total' → data->'pricing'->>'total'
  if (field.includes('.')) {
    const parts = field.split('.');
    const last = parts.pop();
    const path = parts.map((p) => `'${p.replace(/'/g, "''")}'`).join('->');
    return `data->${path}->>'${last.replace(/'/g, "''")}'`;
  }
  // Top-level key inside JSONB
  return `data->>'${field.replace(/'/g, "''")}'`;
}

function buildWhere(filter, values, depth = 0) {
  if (!filter || Object.keys(filter).length === 0) return '';
  const parts = [];
  for (const [k, v] of Object.entries(filter)) {
    if (k === '$or' || k === '$and') {
      const op = k === '$or' ? ' OR ' : ' AND ';
      const inner = (v || []).map((sub) => `(${buildWhere(sub, values, depth + 1)})`).filter(Boolean);
      if (inner.length) parts.push(`(${inner.join(op)})`);
      continue;
    }

    const col = buildColumnRef(k);

    // Operators
    if (v && typeof v === 'object' && !(v instanceof ObjectId) && !(v instanceof Date) && !Array.isArray(v)) {
      const ops = Object.keys(v);
      // {field: {$in: [...]}} etc.
      for (const op of ops) {
        const opv = v[op];
        switch (op) {
          case '$in': {
            if (!Array.isArray(opv) || opv.length === 0) { parts.push('FALSE'); break; }
            const ph = opv.map((x) => nextPlaceholder(values, toPgValue(x))).join(',');
            parts.push(`${col} IN (${ph})`);
            break;
          }
          case '$nin': {
            if (!Array.isArray(opv) || opv.length === 0) break;
            const ph = opv.map((x) => nextPlaceholder(values, toPgValue(x))).join(',');
            parts.push(`(${col} NOT IN (${ph}) OR ${col} IS NULL)`);
            break;
          }
          case '$ne':
            parts.push(`(${col} <> ${nextPlaceholder(values, toPgValue(opv))} OR ${col} IS NULL)`);
            break;
          case '$gt':
            parts.push(`${col} > ${nextPlaceholder(values, toPgValue(opv))}`);
            break;
          case '$gte':
            parts.push(`${col} >= ${nextPlaceholder(values, toPgValue(opv))}`);
            break;
          case '$lt':
            parts.push(`${col} < ${nextPlaceholder(values, toPgValue(opv))}`);
            break;
          case '$lte':
            parts.push(`${col} <= ${nextPlaceholder(values, toPgValue(opv))}`);
            break;
          case '$exists':
            parts.push(opv ? `${col} IS NOT NULL` : `${col} IS NULL`);
            break;
          case '$regex': {
            const pattern = String(opv);
            const isCaseInsensitive = (v.$options || '').includes('i');
            parts.push(`${col} ${isCaseInsensitive ? '~*' : '~'} ${nextPlaceholder(values, pattern)}`);
            break;
          }
          case '$options':
            // Handled together with $regex above
            break;
          default:
            // Unknown operator — fall back to JSON containment
            parts.push(`${col} = ${nextPlaceholder(values, toPgValue(opv))}`);
        }
      }
    } else {
      // Equality
      const val = toPgValue(v);
      if (val === null) {
        parts.push(`${col} IS NULL`);
      } else {
        parts.push(`${col} = ${nextPlaceholder(values, val)}`);
      }
    }
  }
  return parts.join(' AND ');
}

// Convert a Postgres row { _id, data, country, status, ... } back to the
// Mongo-shaped doc the caller expects: just the `data` JSONB content,
// with _id coerced into a string (matching what Mongo returned).
function rowToDoc(row, projection) {
  if (!row) return null;
  const doc = row.data || {};
  // Always carry _id from the column (data may or may not have it).
  doc._id = row._id;
  if (!projection) return doc;
  // Mongo-style projection: { name: 1 } → only keep those keys
  const includes = Object.entries(projection).filter(([_, v]) => v === 1 || v === true).map(([k]) => k);
  const excludes = Object.entries(projection).filter(([_, v]) => v === 0 || v === false).map(([k]) => k);
  if (includes.length) {
    const out = { _id: doc._id };
    for (const k of includes) out[k] = doc[k];
    return out;
  }
  if (excludes.length) {
    const out = { ...doc };
    for (const k of excludes) delete out[k];
    return out;
  }
  return doc;
}

// ── Cursor wrapper for .find() ─────────────────────────────────────

class PgCursor {
  constructor(table, filter, options = {}) {
    this.table = table;
    this.filter = filter || {};
    this._sort = null;
    this._skip = 0;
    this._limit = null;
    this._project = options.projection || null;
  }
  sort(spec) { this._sort = spec; return this; }
  skip(n)    { this._skip = Number(n) || 0; return this; }
  limit(n)   { this._limit = Number(n) || null; return this; }
  project(p) { this._project = p; return this; }

  async toArray() {
    paramIdx = 0;
    const values = [];
    const where = buildWhere(this.filter, values);
    const order = this._buildOrder();
    const limit = this._limit ? `LIMIT ${this._limit}` : '';
    const offset = this._skip ? `OFFSET ${this._skip}` : '';
    const sql = `SELECT * FROM ${this.table}${where ? ' WHERE ' + where : ''} ${order} ${limit} ${offset};`;
    const rows = (await getPgPool().query(sql, values)).rows;
    return rows.map((r) => rowToDoc(r, this._project));
  }

  _buildOrder() {
    if (!this._sort) return '';
    const parts = Object.entries(this._sort).map(([k, dir]) => {
      const col = buildColumnRef(k);
      return `${col} ${dir === -1 || dir === 'desc' ? 'DESC' : 'ASC'}`;
    });
    return parts.length ? `ORDER BY ${parts.join(', ')}` : '';
  }

  // For-await-of support
  async *[Symbol.asyncIterator]() {
    const arr = await this.toArray();
    for (const x of arr) yield x;
  }
}

// ── Public dualCollection() ────────────────────────────────────────

import { ObjectId as _ObjectId } from 'mongodb';

// Generic UPSERT into the shared `_id, data JSONB, ...indexed cols`
// schema. Used by every PG-backed write below.
async function pgUpsert(pool, table, doc) {
  const row = extractRow(doc);
  await pool.query(
    `INSERT INTO ${table} (_id, data, country, status, user_id, pm_id, resource_id, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (_id) DO UPDATE SET data=EXCLUDED.data, country=EXCLUDED.country,
       status=EXCLUDED.status, user_id=EXCLUDED.user_id, pm_id=EXCLUDED.pm_id,
       resource_id=EXCLUDED.resource_id, updated_at=EXCLUDED.updated_at;`,
    [row._id, JSON.stringify(row.data), row.country, row.status, row.user_id, row.pm_id, row.resource_id, row.created_at, row.updated_at],
  );
}

// Apply a Mongo-style $set / $inc / $push update to a doc in-place
// for the PG-direct path. Covers the operators we actually use; falls
// back to replacing fields for unknown operators.
function applyMongoUpdate(doc, update) {
  const next = { ...doc };
  if (!update || typeof update !== 'object') return next;
  if (update.$set) Object.assign(next, update.$set);
  if (update.$unset) for (const k of Object.keys(update.$unset)) delete next[k];
  if (update.$inc) {
    for (const [k, v] of Object.entries(update.$inc)) {
      next[k] = (Number(next[k]) || 0) + Number(v);
    }
  }
  if (update.$push) {
    for (const [k, v] of Object.entries(update.$push)) {
      const arr = Array.isArray(next[k]) ? next[k] : [];
      next[k] = arr.concat(v);
    }
  }
  if (update.$addToSet) {
    for (const [k, v] of Object.entries(update.$addToSet)) {
      const arr = Array.isArray(next[k]) ? next[k] : [];
      if (!arr.includes(v)) next[k] = arr.concat(v);
      else next[k] = arr;
    }
  }
  // No-op operator: $currentDate — set to now().
  if (update.$currentDate) {
    for (const k of Object.keys(update.$currentDate)) next[k] = new Date();
  }
  // If neither set nor any op given, treat the whole object as a doc replacement.
  const noOp = !Object.keys(update).some((k) => k.startsWith('$'));
  if (noOp) return { ...doc, ...update };
  return next;
}

export function dualCol(table) {
  // Mongo handle is lazy — we only deref it on the Mongo branches, so
  // a Postgres-only deployment with `MONGO_URI=disabled` never throws
  // from dualCol() when the route turns out to be a PG branch.
  const mongoColLazy = () => getMongo().collection(table);
  const pgPool = () => getPgPool();
  const useP = () => pgDriverEnabled(table);
  const dual = () => dualWriteEnabled(table);

  return {
    __driver: useP() ? 'postgres' : 'mongo',
    __table: table,

    find(filter = {}, options = {}) {
      if (useP()) return new PgCursor(table, filter, options);
      return mongoColLazy().find(filter, options);
    },

    async findOne(filter = {}, options = {}) {
      if (useP()) {
        const cursor = new PgCursor(table, filter, options);
        cursor.limit(1);
        const arr = await cursor.toArray();
        return arr[0] || null;
      }
      return mongoColLazy().findOne(filter, options);
    },

    async countDocuments(filter = {}) {
      if (useP()) {
        paramIdx = 0;
        const values = [];
        const where = buildWhere(filter, values);
        const sql = `SELECT count(*)::int AS c FROM ${table}${where ? ' WHERE ' + where : ''};`;
        const r = await pgPool().query(sql, values);
        return r.rows[0].c;
      }
      return mongoColLazy().countDocuments(filter);
    },

    async insertOne(doc) {
      // PG-direct branch — Mongo never written.
      if (useP() && pgPool()) {
        const id = doc._id || new _ObjectId();
        const inserted = { ...doc, _id: id };
        await pgUpsert(pgPool(), table, inserted);
        return { acknowledged: true, insertedId: id };
      }
      // Mongo branch (default for tables without PG driver). Optionally
      // dual-write to PG when PG_DUAL_WRITE lists this table.
      const m = await mongoColLazy().insertOne(doc);
      const inserted = { ...doc, _id: m.insertedId };
      if (dual() && pgPool()) {
        pgUpsert(pgPool(), table, inserted)
          .catch((err) => logger.error({ err: err.message, table }, 'pg dual-write insertOne failed'));
      }
      return m;
    },

    async insertMany(docs) {
      if (useP() && pgPool()) {
        const out = [];
        for (const d of docs) {
          const id = d._id || new _ObjectId();
          out.push(id);
          await pgUpsert(pgPool(), table, { ...d, _id: id });
        }
        return { acknowledged: true, insertedCount: out.length, insertedIds: out };
      }
      const m = await mongoColLazy().insertMany(docs);
      if (dual() && pgPool()) {
        for (const d of docs) {
          await pgUpsert(pgPool(), table, d)
            .catch((err) => logger.error({ err: err.message, table }, 'pg dual-write insertMany failed'));
        }
      }
      return m;
    },

    async updateOne(filter, update, options = {}) {
      if (useP() && pgPool()) {
        // Read-modify-write so we can apply Mongo-style operators
        // ($set / $inc / $push) without translating each to SQL.
        const cursor = new PgCursor(table, filter);
        cursor.limit(1);
        const arr = await cursor.toArray();
        let target = arr[0];
        if (!target) {
          // Upsert path
          if (options.upsert) {
            target = applyMongoUpdate({ ...filter }, update);
            if (!target._id) target._id = new _ObjectId();
            await pgUpsert(pgPool(), table, target);
            return { acknowledged: true, matchedCount: 0, modifiedCount: 0, upsertedId: target._id };
          }
          return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
        }
        const updated = applyMongoUpdate(target, update);
        await pgUpsert(pgPool(), table, updated);
        return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
      }
      const m = await mongoColLazy().updateOne(filter, update, options);
      if (dual() && pgPool()) {
        const updated = await mongoColLazy().findOne(filter);
        if (updated) {
          pgUpsert(pgPool(), table, updated)
            .catch((err) => logger.error({ err: err.message, table }, 'pg dual-write updateOne failed'));
        }
      }
      return m;
    },

    async updateMany(filter, update, options = {}) {
      if (useP() && pgPool()) {
        const cursor = new PgCursor(table, filter);
        const arr = await cursor.toArray();
        for (const target of arr) {
          await pgUpsert(pgPool(), table, applyMongoUpdate(target, update));
        }
        return { acknowledged: true, matchedCount: arr.length, modifiedCount: arr.length };
      }
      const m = await mongoColLazy().updateMany(filter, update, options);
      // No PG dual-write for bulk updates — too expensive. Mirror script
      // periodically reconciles instead.
      return m;
    },

    async findOneAndUpdate(filter, update, options = {}) {
      if (useP() && pgPool()) {
        const cursor = new PgCursor(table, filter);
        cursor.limit(1);
        const arr = await cursor.toArray();
        let target = arr[0];
        if (!target) {
          if (options.upsert) {
            target = applyMongoUpdate({ ...filter }, update);
            if (!target._id) target._id = new _ObjectId();
            await pgUpsert(pgPool(), table, target);
            return { value: target, ...target };
          }
          return { value: null };
        }
        const updated = applyMongoUpdate(target, update);
        await pgUpsert(pgPool(), table, updated);
        const returnAfter = options.returnDocument === 'after' || options.returnNewDocument === true;
        const out = returnAfter ? updated : target;
        return { value: out, ...out };
      }
      const m = await mongoColLazy().findOneAndUpdate(filter, update, options);
      const result = m.value || m;
      if (dual() && pgPool() && result) {
        pgUpsert(pgPool(), table, result)
          .catch((err) => logger.error({ err: err.message, table }, 'pg dual-write findOneAndUpdate failed'));
      }
      return m;
    },

    async deleteOne(filter) {
      if (useP() && pgPool()) {
        paramIdx = 0;
        const values = [];
        const where = buildWhere(filter, values);
        if (!where) return { acknowledged: true, deletedCount: 0 };
        const r = await pgPool().query(`DELETE FROM ${table} WHERE ${where};`, values);
        return { acknowledged: true, deletedCount: r.rowCount };
      }
      const m = await mongoColLazy().deleteOne(filter);
      if (dual() && pgPool()) {
        paramIdx = 0;
        const values = [];
        const where = buildWhere(filter, values);
        if (where) {
          pgPool().query(`DELETE FROM ${table} WHERE ${where};`, values).catch((err) =>
            logger.error({ err: err.message, table }, 'pg dual-write deleteOne failed'));
        }
      }
      return m;
    },

    async deleteMany(filter) {
      if (useP() && pgPool()) {
        paramIdx = 0;
        const values = [];
        const where = buildWhere(filter, values);
        if (!where) return { acknowledged: true, deletedCount: 0 };
        const r = await pgPool().query(`DELETE FROM ${table} WHERE ${where};`, values);
        return { acknowledged: true, deletedCount: r.rowCount };
      }
      const m = await mongoColLazy().deleteMany(filter);
      if (dual() && pgPool()) {
        paramIdx = 0;
        const values = [];
        const where = buildWhere(filter, values);
        if (where) {
          pgPool().query(`DELETE FROM ${table} WHERE ${where};`, values).catch((err) =>
            logger.error({ err: err.message, table }, 'pg dual-write deleteMany failed'));
        }
      }
      return m;
    },

    // Aggregate stays on Mongo. PG-only deploys can't use aggregate()
    // until each pipeline is hand-translated to SQL — none of the hot
    // paths use it on tables that flip to PG, so this is fine for the
    // first cutover.
    aggregate(pipeline, options) { return mongoColLazy().aggregate(pipeline, options); },

    // No-op — DDL is managed by pg-mirror-all.js / pg-migrate.js.
    createIndex() { return Promise.resolve(); },

    // Escape hatch back to native if needed
    _mongo: mongoCol,
  };
}

// Mongo doc → PG row mapping for the generic JSONB schema.
function extractRow(doc) {
  return {
    _id:         String(doc._id),
    data:        doc,
    country:     doc.country || null,
    status:      doc.status || null,
    user_id:     doc.userId ? String(doc.userId) : null,
    pm_id:       doc.pmId ? String(doc.pmId) : null,
    resource_id: doc.resourceId ? String(doc.resourceId) : null,
    created_at:  doc.createdAt instanceof Date ? doc.createdAt : (doc.createdAt ? new Date(doc.createdAt) : new Date()),
    updated_at:  doc.updatedAt instanceof Date ? doc.updatedAt : (doc.updatedAt ? new Date(doc.updatedAt) : new Date()),
  };
}
