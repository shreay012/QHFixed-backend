/**
 * pg-migrate.js — Provision Postgres tables + backfill from Mongo.
 *
 * Idempotent. Safe to re-run any number of times.
 *
 * Run:
 *   PG_URL=postgresql://... node src/scripts/pg-migrate.js
 *   PG_URL=... node src/scripts/pg-migrate.js --table=countries
 *   PG_URL=... node src/scripts/pg-migrate.js --table=countries --dry-run
 *
 * What it does:
 *   1. Verifies Postgres connectivity.
 *   2. Creates each table (CREATE TABLE IF NOT EXISTS via Drizzle Kit push,
 *      or hand-rolled DDL — see below).
 *   3. Reads docs from each Mongo collection.
 *   4. Bulk-inserts into Postgres with ON CONFLICT DO UPDATE so re-runs
 *      converge to the latest Mongo state without duplicates.
 *
 * Phase 0 covers: countries, currencies, services, users, sessions.
 */

import 'dotenv/config';
import { connectDb, getDb, closeDb } from '../config/db.js';
import { getPgPool, getPg, closePg } from '../db/postgres.js';
import { logger } from '../config/logger.js';

const ARGS = process.argv.slice(2).reduce((acc, a) => {
  const [k, v] = a.replace(/^--/, '').split('=');
  acc[k] = v ?? true;
  return acc;
}, {});

const DRY = !!ARGS['dry-run'];
const ONLY = ARGS.table ? new Set([ARGS.table]) : null;

// Hand-rolled DDL — mirrors src/db/schema.js. Keep these in sync. We use
// hand-rolled CREATE TABLE rather than `drizzle-kit push:pg` so that this
// single script is self-contained and works against any Postgres host.
const DDL = {
  countries: `
    CREATE TABLE IF NOT EXISTS countries (
      _id              CHAR(24) PRIMARY KEY,
      code             VARCHAR(2) NOT NULL,
      name             JSONB NOT NULL,
      currency         VARCHAR(3),
      supported_langs  JSONB,
      config           JSONB,
      active           BOOLEAN DEFAULT true,
      created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS countries_code_unique ON countries(code);
    CREATE INDEX        IF NOT EXISTS countries_active_idx  ON countries(active);
  `,
  currencies: `
    CREATE TABLE IF NOT EXISTS currencies (
      _id        CHAR(24) PRIMARY KEY,
      code       VARCHAR(3) NOT NULL,
      name       VARCHAR(50),
      symbol     VARCHAR(4),
      decimals   INTEGER DEFAULT 2,
      active     BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS currencies_code_unique ON currencies(code);
  `,
  services: `
    CREATE TABLE IF NOT EXISTS services (
      _id            CHAR(24) PRIMARY KEY,
      slug           VARCHAR(100) NOT NULL,
      name           JSONB NOT NULL,
      tagline        JSONB,
      description    JSONB,
      category       VARCHAR(64),
      category_name  JSONB,
      technologies   JSONB,
      pricing        JSONB,
      highlights     JSONB,
      inclusions     JSONB,
      not_included   JSONB,
      faq            JSONB,
      hourly_rate    INTEGER,
      currency       VARCHAR(3),
      min_hours      INTEGER,
      max_hours      INTEGER,
      image          TEXT,
      icon_url       TEXT,
      sort_order     INTEGER DEFAULT 999,
      active         BOOLEAN DEFAULT true,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS services_slug_unique           ON services(slug);
    CREATE INDEX        IF NOT EXISTS services_active_category_idx   ON services(active, category);
  `,
  users: `
    CREATE TABLE IF NOT EXISTS users (
      _id                       CHAR(24) PRIMARY KEY,
      mobile                    VARCHAR(20),
      email                     VARCHAR(200),
      name                      VARCHAR(200),
      role                      VARCHAR(32) NOT NULL DEFAULT 'user',
      country                   VARCHAR(2),
      parent_country_admin_id   CHAR(24),
      managed_countries         JSONB,
      fcm_tokens                JSONB,
      specialization            JSONB,
      skills                    JSONB,
      meta                      JSONB,
      history                   JSONB,
      deleted_at                TIMESTAMPTZ,
      created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS users_mobile_unique         ON users(mobile)         WHERE mobile IS NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique          ON users(email)          WHERE email IS NOT NULL;
    CREATE INDEX        IF NOT EXISTS users_role_country_idx      ON users(role, country);
    CREATE INDEX        IF NOT EXISTS users_country_status_idx    ON users(country);
  `,
  sessions: `
    CREATE TABLE IF NOT EXISTS sessions (
      _id                  CHAR(24) PRIMARY KEY,
      user_id              CHAR(24) NOT NULL,
      refresh_token_hash   VARCHAR(200) NOT NULL,
      ip                   VARCHAR(64),
      ua                   TEXT,
      revoked              BOOLEAN DEFAULT false,
      expires_at           TIMESTAMPTZ NOT NULL,
      created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS sessions_user_revoked_idx ON sessions(user_id, revoked);
    CREATE INDEX IF NOT EXISTS sessions_expires_idx       ON sessions(expires_at);
  `,
};

// Mongo → PG row mappers. Only fields defined in DDL go through.
const MAPPERS = {
  countries: (d) => ({
    _id:             String(d._id),
    code:            d.code,
    name:            d.name || { en: d.code },
    currency:        d.currency || null,
    supported_langs: d.supportedLangs || null,
    config:          d.config || null,
    active:          d.active !== false,
    created_at:      d.createdAt || new Date(),
    updated_at:      d.updatedAt || new Date(),
  }),
  currencies: (d) => ({
    _id:        String(d._id),
    code:       d.code,
    name:       d.name || null,
    symbol:     d.symbol || null,
    decimals:   typeof d.decimals === 'number' ? d.decimals : 2,
    active:     d.active !== false,
    created_at: d.createdAt || new Date(),
    updated_at: d.updatedAt || new Date(),
  }),
  services: (d) => ({
    _id:           String(d._id),
    slug:          d.slug,
    name:          d.name,
    tagline:       d.tagline || null,
    description:   d.description || null,
    category:      d.category || null,
    category_name: d.categoryName || null,
    technologies:  d.technologies || null,
    pricing:       d.pricing || null,
    highlights:    d.highlights || null,
    inclusions:    d.inclusions || null,
    not_included:  d.notIncluded || null,
    faq:           d.faq || null,
    hourly_rate:   d.hourlyRate || null,
    currency:      d.currency || null,
    min_hours:     d.minHours || null,
    max_hours:     d.maxHours || null,
    image:         d.image || null,
    icon_url:      d.iconUrl || null,
    sort_order:    d.sortOrder ?? 999,
    active:        d.active !== false,
    created_at:    d.createdAt || new Date(),
    updated_at:    d.updatedAt || new Date(),
  }),
  users: (d) => ({
    _id:                     String(d._id),
    mobile:                  d.mobile || null,
    email:                   d.email || null,
    name:                    d.name || null,
    role:                    d.role || 'user',
    country:                 d.country || null,
    parent_country_admin_id: d.parentCountryAdminId ? String(d.parentCountryAdminId) : null,
    managed_countries:       d.managedCountries || null,
    fcm_tokens:              d.fcmTokens || null,
    specialization:          d.specialization || null,
    skills:                  d.skills || null,
    meta:                    d.meta || null,
    history:                 d.history || null,
    deleted_at:              d.deletedAt || null,
    created_at:              d.createdAt || new Date(),
    updated_at:              d.updatedAt || new Date(),
  }),
  sessions: (d) => ({
    _id:                String(d._id),
    user_id:            String(d.userId),
    refresh_token_hash: d.refreshTokenHash || '',
    ip:                 d.ip || null,
    ua:                 d.ua || null,
    revoked:            !!d.revoked,
    expires_at:         d.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    created_at:         d.createdAt || new Date(),
    updated_at:         d.updatedAt || new Date(),
  }),
};

const TABLE_ORDER = ['countries', 'currencies', 'services', 'users', 'sessions'];

async function ensureSchema(pgPool) {
  for (const t of TABLE_ORDER) {
    if (ONLY && !ONLY.has(t)) continue;
    if (DRY) {
      logger.info({ table: t }, '[DRY] would CREATE TABLE');
      continue;
    }
    await pgPool.query(DDL[t]);
    logger.info({ table: t }, '✅ DDL applied');
  }
}

function buildUpsertSql(table, row) {
  const cols = Object.keys(row);
  const placeholders = cols.map((_, i) => `$${i + 1}`);
  const updates = cols.filter((c) => c !== '_id' && c !== 'created_at')
    .map((c) => `${c}=EXCLUDED.${c}`).join(', ');
  return {
    sql: `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders.join(', ')})
          ON CONFLICT (_id) DO UPDATE SET ${updates};`,
    values: cols.map((c) => {
      const v = row[c];
      if (v && typeof v === 'object' && !(v instanceof Date)) return JSON.stringify(v);
      return v;
    }),
  };
}

async function backfillTable(pgPool, table) {
  const mongo = getDb().collection(table);
  const docs = await mongo.find({}).toArray();
  logger.info({ table, count: docs.length }, 'backfilling from Mongo');

  let inserted = 0;
  let errors = 0;
  for (const doc of docs) {
    const row = MAPPERS[table](doc);
    if (DRY) {
      if (inserted < 3) logger.info({ table, row }, '[DRY] would upsert');
      inserted++;
      continue;
    }
    try {
      const { sql, values } = buildUpsertSql(table, row);
      await pgPool.query(sql, values);
      inserted++;
    } catch (e) {
      errors++;
      logger.error({ err: e.message, table, _id: row._id }, 'upsert failed');
    }
  }
  logger.info({ table, inserted, errors, dry: DRY }, '✅ backfill complete');
}

async function main() {
  if (!process.env.PG_URL) {
    logger.error('PG_URL is not set. Provision Render Postgres and pass PG_URL=postgresql://... to this script.');
    process.exit(1);
  }
  await connectDb();
  const pgPool = getPgPool();
  if (!pgPool) {
    logger.error('Postgres pool not available — check PG_URL');
    process.exit(1);
  }
  // Quick connectivity check
  await pgPool.query('SELECT 1');
  logger.info({ pg: 'connected' }, 'pg connectivity OK');

  await ensureSchema(pgPool);

  for (const t of TABLE_ORDER) {
    if (ONLY && !ONLY.has(t)) continue;
    await backfillTable(pgPool, t);
  }

  await closePg();
  await closeDb();
  logger.info('🎉 pg-migrate finished');
}

main().catch((e) => {
  logger.error({ err: e.message, stack: e.stack }, 'pg-migrate failed');
  process.exit(1);
});
