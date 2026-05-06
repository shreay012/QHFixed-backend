/**
 * backfill-country-001.js
 *
 * Phase 0 backfill for the multi-country RBAC rollout. Idempotent — safe to
 * re-run any number of times. Fills missing `country` fields on collections
 * that downstream country-scoped queries expect.
 *
 * Strategy (per collection):
 *   bookings  → use bookingDoc.country if set; else lookup user.country;
 *               else lookup service's pricing[0].country; else 'IN' (legacy default)
 *   jobs      → same as bookings
 *   payments  → use payment.country if set; else lookup booking.country
 *   users     → leave existing nulls alone EXCEPT for pm/resource users with
 *               assigned bookings — infer from those bookings' countries
 *
 * Run:
 *   node src/scripts/backfill-country-001.js
 *   node src/scripts/backfill-country-001.js --dry-run
 *   node src/scripts/backfill-country-001.js --collection=bookings
 */

import 'dotenv/config';
import { connectDb, getDb, closeDb } from '../config/db.js';
import { logger } from '../config/logger.js';

const DEFAULT_COUNTRY = 'IN';
const ARGS = process.argv.slice(2).reduce((acc, a) => {
  const [k, v] = a.replace(/^--/, '').split('=');
  acc[k] = v ?? true;
  return acc;
}, {});

const DRY = !!ARGS['dry-run'];
const ONLY = ARGS.collection ? new Set([ARGS.collection]) : null;

function shouldRun(collection) {
  return !ONLY || ONLY.has(collection);
}

async function backfillCollection({ name, lookupCountry }) {
  if (!shouldRun(name)) return;
  const col = getDb().collection(name);
  const cursor = col.find(
    { $or: [{ country: { $exists: false } }, { country: null }, { country: '' }] },
    { projection: { _id: 1, userId: 1, serviceId: 1, bookingId: 1 } },
  );

  let count = 0;
  let updated = 0;
  for await (const doc of cursor) {
    count++;
    const country = (await lookupCountry(doc)) || DEFAULT_COUNTRY;
    if (DRY) {
      if (count <= 5) logger.info({ collection: name, _id: doc._id, country }, '[DRY] would set country');
      continue;
    }
    await col.updateOne({ _id: doc._id }, { $set: { country, updatedAt: new Date() } });
    updated++;
  }
  logger.info({ collection: name, scanned: count, updated, dry: DRY }, 'backfill summary');
}

async function main() {
  await connectDb();
  const db = getDb();
  const usersCol = db.collection('users');
  const servicesCol = db.collection('services');

  // Helper: country from user
  const userCountry = async (userId) => {
    if (!userId) return null;
    const u = await usersCol.findOne({ _id: userId }, { projection: { country: 1 } });
    return u?.country ?? null;
  };
  // Helper: country from service (first pricing block, fallback)
  const serviceCountry = async (serviceId) => {
    if (!serviceId) return null;
    const s = await servicesCol.findOne(
      { _id: serviceId },
      { projection: { country: 1, pricing: 1 } },
    );
    if (s?.country) return s.country;
    if (Array.isArray(s?.pricing) && s.pricing[0]?.country) return s.pricing[0].country;
    return null;
  };

  // ── bookings + jobs (parallel logic) ───────────────────────────────
  for (const name of ['bookings', 'jobs']) {
    await backfillCollection({
      name,
      lookupCountry: async (doc) => {
        return (
          (await userCountry(doc.userId)) ||
          (await serviceCountry(doc.serviceId)) ||
          null
        );
      },
    });
  }

  // ── payments (lookup via booking) ──────────────────────────────────
  await backfillCollection({
    name: 'payments',
    lookupCountry: async (doc) => {
      if (!doc.bookingId) return null;
      const b = await db.collection('bookings').findOne(
        { _id: doc.bookingId },
        { projection: { country: 1 } },
      );
      return b?.country ?? null;
    },
  });

  // ── users (only pm/resource with no country) ──────────────────────
  if (shouldRun('users')) {
    const usersToFix = await usersCol.find(
      {
        role: { $in: ['pm', 'resource'] },
        $or: [{ country: { $exists: false } }, { country: null }, { country: '' }],
      },
      { projection: { _id: 1, role: 1 } },
    ).toArray();

    let userUpdates = 0;
    for (const u of usersToFix) {
      const sample = await db.collection('jobs').findOne(
        { [u.role === 'pm' ? 'pmId' : 'resourceId']: u._id, country: { $exists: true } },
        { projection: { country: 1 } },
      );
      const country = sample?.country || DEFAULT_COUNTRY;
      if (DRY) {
        logger.info({ userId: u._id, role: u.role, country }, '[DRY] would set user country');
      } else {
        await usersCol.updateOne({ _id: u._id }, { $set: { country, updatedAt: new Date() } });
        userUpdates++;
      }
    }
    logger.info({ scanned: usersToFix.length, updated: userUpdates, dry: DRY }, 'users backfill summary');
  }

  await closeDb();
  logger.info({ dry: DRY }, '✅ backfill complete');
}

main().catch((e) => {
  logger.error({ err: e.message, stack: e.stack }, 'backfill failed');
  process.exit(1);
});
