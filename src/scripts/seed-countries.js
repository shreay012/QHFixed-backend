/**
 * Seed / upsert the `countries` collection from the canonical COUNTRY_CONFIG.
 *
 * Run:
 *   node src/scripts/seed-countries.js
 *
 * Safe to run repeatedly — uses replaceOne with upsert so existing records
 * are updated without losing any extra fields added via the admin panel.
 */
import 'dotenv/config';
import { connectDb, getDb, closeDb } from '../config/db.js';
import { buildCountrySeedDocuments } from '../config/country.config.js';
import { logger } from '../config/logger.js';

async function run() {
  await connectDb();
  const db = getDb();
  const col = db.collection('countries');

  // Ensure unique index on code before upserting
  await col.createIndex({ code: 1 }, { unique: true, background: true });

  const docs = buildCountrySeedDocuments();
  const ops = docs.map((doc) => ({
    replaceOne: {
      filter: { code: doc.code },
      replacement: doc,
      upsert: true,
    },
  }));

  const result = await col.bulkWrite(ops, { ordered: false });

  logger.info(
    { upserted: result.upsertedCount, modified: result.modifiedCount, total: docs.length },
    'countries collection seeded',
  );

  const active = docs.filter((d) => d.active).map((d) => d.code);
  logger.info({ active }, 'active country codes');
}

run()
  .catch((err) => { logger.error({ err }, 'seed-countries failed'); process.exit(1); })
  .finally(() => closeDb());
