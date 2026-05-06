/**
 * seed-country-admins.js
 *
 * Phase 4 of multi-country-rbac-plan.md. Idempotent. Safe to re-run.
 *
 * 1. Promotes the existing main admin (9000000000) to super_admin.
 * 2. Upserts a country_admin for each supported country (IN/AE/DE/AU/US).
 * 3. Reports the credentials at the end (mobile + dev OTP 1234).
 *
 * Run:
 *   node src/scripts/seed-country-admins.js
 *   node src/scripts/seed-country-admins.js --dry-run
 */

import 'dotenv/config';
import { connectDb, getDb, closeDb } from '../config/db.js';
import { logger } from '../config/logger.js';

const ARGS = process.argv.slice(2).reduce((acc, a) => {
  const [k, v] = a.replace(/^--/, '').split('=');
  acc[k] = v ?? true;
  return acc;
}, {});
const DRY = !!ARGS['dry-run'];

const COUNTRY_ADMINS = [
  { mobile: '9000000010', country: 'IN', name: 'India Operations Lead'     },
  { mobile: '9000000020', country: 'AE', name: 'UAE Operations Lead'        },
  { mobile: '9000000030', country: 'DE', name: 'Germany Operations Lead'    },
  { mobile: '9000000040', country: 'AU', name: 'Australia Operations Lead'  },
  { mobile: '9000000050', country: 'US', name: 'USA Operations Lead'        },
];

async function main() {
  await connectDb();
  const usersCol = getDb().collection('users');
  const now = new Date();

  // ── 1. Promote 9000000000 → super_admin ──────────────────────────
  const main = await usersCol.findOne({ mobile: '9000000000' });
  if (!main) {
    logger.warn('main admin (9000000000) not found — skipping promotion');
  } else if (main.role === 'super_admin') {
    logger.info('main admin already super_admin — no change');
  } else {
    if (DRY) {
      logger.info({ from: main.role, to: 'super_admin' }, '[DRY] would promote 9000000000');
    } else {
      await usersCol.updateOne(
        { _id: main._id },
        { $set: { role: 'super_admin', country: null, updatedAt: now } },
      );
      logger.info({ from: main.role }, '✅ promoted 9000000000 → super_admin');
    }
  }

  // ── 2. Upsert country admins ─────────────────────────────────────
  const created = [];
  for (const ca of COUNTRY_ADMINS) {
    const existing = await usersCol.findOne({ mobile: ca.mobile });
    const doc = {
      role: 'country_admin',
      country: ca.country,
      name: ca.name,
      mobile: ca.mobile,
      email: `${ca.country.toLowerCase()}-admin@quickhire.services`,
      meta: { isProfileComplete: true, status: 'active' },
      managedCountries: [ca.country],
      updatedAt: now,
    };

    if (existing) {
      if (DRY) {
        logger.info({ mobile: ca.mobile, country: ca.country }, '[DRY] would update existing user');
      } else {
        await usersCol.updateOne({ _id: existing._id }, { $set: doc });
        logger.info({ mobile: ca.mobile, country: ca.country }, '↻ updated country admin');
      }
    } else {
      if (DRY) {
        logger.info({ mobile: ca.mobile, country: ca.country }, '[DRY] would create country admin');
      } else {
        await usersCol.insertOne({ ...doc, createdAt: now });
        created.push(ca);
        logger.info({ mobile: ca.mobile, country: ca.country }, '➕ created country admin');
      }
    }
  }

  // ── 3. Report ────────────────────────────────────────────────────
  console.log('');
  console.log('═════════════════════════════════════════════════════════');
  console.log('  Country Admin Seed Complete');
  console.log('═════════════════════════════════════════════════════════');
  console.log('');
  console.log('  Test logins (DEV_MASTER_OTP must be set in env, currently 1234):');
  console.log('');
  console.log('  Super Admin    → 9000000000 (sees all countries)');
  for (const ca of COUNTRY_ADMINS) {
    console.log(`  ${ca.country} Country Admin → ${ca.mobile} (sees only ${ca.country})`);
  }
  console.log('  PM             → 9000000001 (assigned bookings, country=IN)');
  console.log('  Resource       → 9000000002 (assigned jobs, country=DE)');
  console.log('');
  console.log(`  Mode: ${DRY ? 'DRY-RUN (no changes)' : 'APPLIED'}`);
  console.log('');

  await closeDb();
}

main().catch((e) => {
  logger.error({ err: e.message, stack: e.stack }, 'seed-country-admins failed');
  process.exit(1);
});
