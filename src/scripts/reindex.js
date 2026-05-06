/**
 * Standalone Meilisearch reindex script
 *
 * Usage:
 *   npm run search:reindex
 *   # or with env override:
 *   MEILISEARCH_URL=http://meili:7700 node src/scripts/reindex.js
 */
import { connectDb, getDb, closeDb } from '../config/db.js';
import { initMeilisearch, getMeili } from '../config/meilisearch.js';
import { logger } from '../config/logger.js';

async function run() {
  logger.info('connecting to database...');
  await connectDb();
  logger.info('initialising meilisearch...');
  await initMeilisearch();

  const db = getDb();
  logger.info('fetching documents...');

  const [jobs, users, articles] = await Promise.all([
    db.collection('jobs').find({}).project({
      _id: 1, serviceTitle: 1, customerName: 1, customerMobile: 1,
      pmName: 1, resourceName: 1, status: 1, country: 1,
      pmId: 1, resourceId: 1, userId: 1, createdAt: 1, updatedAt: 1,
    }).limit(50_000).toArray(),

    db.collection('users').find({ role: { $in: ['pm', 'resource'] } }).project({
      _id: 1, name: 1, mobile: 1, email: 1, skills: 1, city: 1, role: 1, status: 1, meta: 1, createdAt: 1,
    }).limit(20_000).toArray(),

    db.collection('cms_articles').find({ status: 'published' }).project({
      _id: 1, title: 1, content: 1, tags: 1, slug: 1, status: 1, lang: 1, createdAt: 1,
    }).limit(10_000).toArray(),
  ]);

  logger.info({ jobs: jobs.length, users: users.length, articles: articles.length }, 'documents fetched');

  const meili = getMeili();

  const BATCH_SIZE = 1000;

  // Index in batches to avoid request size limits
  async function batchIndex(indexName, docs) {
    for (let i = 0; i < docs.length; i += BATCH_SIZE) {
      const batch = docs.slice(i, i + BATCH_SIZE);
      await meili.index(indexName).addDocuments(batch);
      logger.info({ index: indexName, progress: `${i + batch.length}/${docs.length}` }, 'indexed batch');
    }
  }

  await Promise.all([
    batchIndex('bookings', jobs.map((j) => ({
      _id: String(j._id),
      shortId: String(j._id).slice(-8).toUpperCase(),
      serviceTitle: j.serviceTitle || '',
      customerName: j.customerName || '',
      customerMobile: j.customerMobile || '',
      pmName: j.pmName || '',
      resourceName: j.resourceName || '',
      status: j.status,
      country: j.country || 'IN',
      pmId: j.pmId ? String(j.pmId) : null,
      resourceId: j.resourceId ? String(j.resourceId) : null,
      userId: j.userId ? String(j.userId) : null,
      createdAt: j.createdAt ? new Date(j.createdAt).getTime() : null,
      updatedAt: j.updatedAt ? new Date(j.updatedAt).getTime() : null,
    }))),

    batchIndex('resources', users.map((u) => ({
      _id: String(u._id),
      name: u.name || '',
      mobile: u.mobile || '',
      email: u.email || '',
      skills: Array.isArray(u.skills) ? u.skills.join(' ') : '',
      city: u.city || '',
      role: u.role,
      status: u.status || 'active',
      'meta.kycVerified': u.meta?.kycVerified || false,
      createdAt: u.createdAt ? new Date(u.createdAt).getTime() : null,
    }))),

    batchIndex('articles', articles.map((a) => ({
      _id: String(a._id),
      title: a.title || '',
      content: (a.content || '').slice(0, 2000),
      tags: Array.isArray(a.tags) ? a.tags : [],
      slug: a.slug || '',
      status: a.status,
      lang: a.lang || 'en',
      createdAt: a.createdAt ? new Date(a.createdAt).getTime() : null,
    }))),
  ]);

  logger.info('reindex complete');
  await closeDb();
  process.exit(0);
}

run().catch((e) => {
  logger.fatal({ err: e }, 'reindex failed');
  process.exit(1);
});
