/**
 * Postgres connection — used by the new data-repo layer (src/data/repos/*)
 * during the Mongo→Postgres strangler-fig migration.
 *
 * When env.PG_URL is unset:
 *   - getPg() returns null
 *   - Every repo function transparently falls back to its Mongo path
 *   - Zero behaviour change vs pre-migration
 *
 * When env.PG_URL is set:
 *   - Lazy connection on first call (process boot stays fast)
 *   - drizzle() wraps node-postgres for a typed query builder
 *   - Pool sizing tuned for the strangler-fig phase: small (20 max) so we
 *     never exhaust both DBs simultaneously
 *
 * See docs/postgres-migration-plan.md §2.2.
 */

import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

let pool = null;
let db = null;

export function getPgPool() {
  if (!env.PG_URL) return null;
  if (pool) return pool;

  pool = new pg.Pool({
    connectionString: env.PG_URL,
    max: 20,                       // small during dual-write phase
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    allowExitOnIdle: false,
  });

  pool.on('error', (err) => {
    logger.error({ err: err.message }, 'pg pool error');
  });

  return pool;
}

/**
 * Drizzle handle. Returns null when PG_URL not configured — callers must
 * handle this and route to Mongo.
 */
export function getPg() {
  if (!env.PG_URL) return null;
  if (db) return db;
  const p = getPgPool();
  if (!p) return null;
  db = drizzle(p);
  logger.info('drizzle / pg connected');
  return db;
}

/**
 * Health check used by /readyz when migration is in progress.
 */
export async function pgHealthCheck() {
  if (!env.PG_URL) return { ok: true, skipped: 'PG_URL not set' };
  try {
    const p = getPgPool();
    const r = await p.query('SELECT 1 as ok');
    return { ok: r.rows[0]?.ok === 1 };
  } catch (e) {
    return { ok: false, err: e.message };
  }
}

export async function closePg() {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
  }
}
