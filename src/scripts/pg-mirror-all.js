/**
 * pg-mirror-all.js — Generic Mongo → Postgres mirror for ALL collections.
 *
 * Schema strategy: each Mongo collection becomes a Postgres table with:
 *   - _id           CHAR(24) PRIMARY KEY  (24-hex Mongo ObjectId as string)
 *   - data          JSONB NOT NULL        (entire Mongo doc)
 *   - country       VARCHAR(2)            (extracted for fast country-scoped reads)
 *   - status        VARCHAR(64)           (extracted for status filters)
 *   - user_id       CHAR(24)              (extracted for ownership scopes)
 *   - pm_id         CHAR(24)              (extracted for PM dashboards)
 *   - resource_id   CHAR(24)              (extracted for Resource panels)
 *   - created_at    TIMESTAMPTZ           (extracted for sort/range)
 *   - updated_at    TIMESTAMPTZ
 *
 * Why this shape: it gives us a Postgres mirror that is:
 *   1. Exact 1:1 with Mongo (data column has the full doc)
 *   2. Performance-equivalent for hot query patterns (countryScopeMiddleware
 *      filters on country/pmId/resourceId/userId — those are extracted to
 *      first-class indexed columns)
 *   3. Schema-stable — Mongo can add new fields without DDL changes
 *
 * Idempotent. Re-running upserts by _id.
 *
 * Run:
 *   PG_URL=postgresql://... node src/scripts/pg-mirror-all.js
 *   PG_URL=... node src/scripts/pg-mirror-all.js --dry-run
 *   PG_URL=... node src/scripts/pg-mirror-all.js --table=bookings
 *   PG_URL=... node src/scripts/pg-mirror-all.js --truncate    # wipe before backfill
 */

import 'dotenv/config';
import { connectDb, getDb, closeDb } from '../config/db.js';
import { getPgPool, closePg } from '../db/postgres.js';
import { logger } from '../config/logger.js';

const ARGS = process.argv.slice(2).reduce((acc, a) => {
  const [k, v] = a.replace(/^--/, '').split('=');
  acc[k] = v ?? true;
  return acc;
}, {});

const DRY = !!ARGS['dry-run'];
const TRUNCATE = !!ARGS.truncate;
const ONLY = ARGS.table ? new Set([ARGS.table]) : null;

// Collections that have hand-rolled DDL in pg-migrate.js (Phase 1 — strict
// columnar shape). Skip these here so we don't clobber.
const PHASE1_TABLES = new Set(['countries', 'currencies', 'services', 'users', 'sessions']);

function ddlFor(table) {
  return `
    CREATE TABLE IF NOT EXISTS ${table} (
      _id          CHAR(24) PRIMARY KEY,
      data         JSONB NOT NULL,
      country      VARCHAR(2),
      status       VARCHAR(64),
      user_id      CHAR(24),
      pm_id        CHAR(24),
      resource_id  CHAR(24),
      created_at   TIMESTAMPTZ,
      updated_at   TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS ${table}_country_idx     ON ${table}(country)     WHERE country IS NOT NULL;
    CREATE INDEX IF NOT EXISTS ${table}_status_idx      ON ${table}(status)      WHERE status IS NOT NULL;
    CREATE INDEX IF NOT EXISTS ${table}_user_idx        ON ${table}(user_id)     WHERE user_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS ${table}_pm_idx          ON ${table}(pm_id)       WHERE pm_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS ${table}_resource_idx    ON ${table}(resource_id) WHERE resource_id IS NOT NULL;
    CREATE INDEX IF NOT EXISTS ${table}_created_at_idx  ON ${table}(created_at DESC);
    CREATE INDEX IF NOT EXISTS ${table}_data_gin        ON ${table} USING GIN (data jsonb_path_ops);
  `;
}

function extractRow(doc) {
  return {
    _id:         String(doc._id),
    data:        doc,
    country:     doc.country || null,
    status:      doc.status || null,
    user_id:     doc.userId ? String(doc.userId) : null,
    pm_id:       doc.pmId ? String(doc.pmId) : null,
    resource_id: doc.resourceId ? String(doc.resourceId) : null,
    created_at:  doc.createdAt instanceof Date ? doc.createdAt : (doc.createdAt ? new Date(doc.createdAt) : null),
    updated_at:  doc.updatedAt instanceof Date ? doc.updatedAt : (doc.updatedAt ? new Date(doc.updatedAt) : null),
  };
}

const UPSERT_SQL = (table) => `
  INSERT INTO ${table} (_id, data, country, status, user_id, pm_id, resource_id, created_at, updated_at)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  ON CONFLICT (_id) DO UPDATE SET
    data = EXCLUDED.data,
    country = EXCLUDED.country,
    status = EXCLUDED.status,
    user_id = EXCLUDED.user_id,
    pm_id = EXCLUDED.pm_id,
    resource_id = EXCLUDED.resource_id,
    updated_at = EXCLUDED.updated_at;
`;

async function migrateTable(pgPool, name, mongoCol) {
  if (!DRY) await pgPool.query(ddlFor(name));
  if (TRUNCATE && !DRY) await pgPool.query(`TRUNCATE ${name};`);

  const docs = await mongoCol.find({}).toArray();
  if (docs.length === 0) {
    logger.info({ table: name }, 'empty collection — table created, no rows');
    return { name, scanned: 0, inserted: 0, errors: 0 };
  }

  const sql = UPSERT_SQL(name);
  let inserted = 0;
  let errors = 0;

  for (const doc of docs) {
    const row = extractRow(doc);
    if (DRY) {
      if (inserted < 2) logger.info({ table: name, _id: row._id }, '[DRY] would upsert');
      inserted++;
      continue;
    }
    try {
      await pgPool.query(sql, [
        row._id,
        JSON.stringify(row.data),
        row.country,
        row.status,
        row.user_id,
        row.pm_id,
        row.resource_id,
        row.created_at,
        row.updated_at,
      ]);
      inserted++;
    } catch (e) {
      errors++;
      if (errors <= 3) {
        logger.error({ err: e.message, table: name, _id: row._id }, 'upsert failed');
      }
    }
  }
  return { name, scanned: docs.length, inserted, errors };
}

async function main() {
  if (!process.env.PG_URL) {
    logger.error('PG_URL not set');
    process.exit(1);
  }
  await connectDb();
  const pgPool = getPgPool();
  await pgPool.query('SELECT 1'); // connectivity check

  const cols = await getDb().listCollections().toArray();
  const targets = cols
    .filter((c) => !c.name.startsWith('system.'))
    .filter((c) => !PHASE1_TABLES.has(c.name))
    .map((c) => c.name)
    .sort();

  const filtered = ONLY ? targets.filter((n) => ONLY.has(n)) : targets;
  logger.info({ count: filtered.length, dry: DRY }, 'starting mirror');

  const results = [];
  for (const name of filtered) {
    const r = await migrateTable(pgPool, name, getDb().collection(name));
    results.push(r);
  }

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Mirror Summary');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  Table                            Scanned   Inserted   Errors');
  for (const r of results) {
    console.log(`  ${r.name.padEnd(32)} ${String(r.scanned).padStart(7)}   ${String(r.inserted).padStart(8)}   ${String(r.errors).padStart(6)}`);
  }
  const totalIns = results.reduce((s, r) => s + r.inserted, 0);
  const totalErr = results.reduce((s, r) => s + r.errors, 0);
  console.log('  ' + '-'.repeat(60));
  console.log(`  TOTAL ${' '.repeat(26)} ${' '.repeat(7)}   ${String(totalIns).padStart(8)}   ${String(totalErr).padStart(6)}`);

  await closePg();
  await closeDb();
}

main().catch((e) => {
  logger.error({ err: e.message, stack: e.stack }, 'mirror failed');
  process.exit(1);
});
