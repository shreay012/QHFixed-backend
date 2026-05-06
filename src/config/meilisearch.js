/**
 * Meilisearch client + index bootstrap (Phase 6)
 *
 * Indexes:
 *   bookings  — searchable by service name, customer name, booking ID
 *   resources — searchable by name, skills, city
 *   articles  — searchable by title, content, tags (powers chatbot RAG upgrade)
 *
 * Call initMeilisearch() once at startup. Subsequent calls are no-ops.
 */
import { MeiliSearch } from 'meilisearch';
import { env } from './env.js';
import { logger } from './logger.js';

let client = null;
let ready = false; // true only after health check passes in initMeilisearch()

export function getMeili() {
  if (!client) {
    client = new MeiliSearch({
      host: env.MEILISEARCH_URL,
      apiKey: env.MEILISEARCH_KEY,
    });
  }
  return client;
}

export function isMeiliReady() {
  return ready;
}

const INDEX_CONFIGS = [
  {
    uid: 'bookings',
    primaryKey: '_id',
    settings: {
      searchableAttributes: ['serviceTitle', 'customerName', 'customerMobile', 'pmName', 'resourceName', 'status', 'shortId'],
      filterableAttributes: ['status', 'country', 'pmId', 'resourceId', 'userId', 'createdAt'],
      sortableAttributes: ['createdAt', 'updatedAt'],
      rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
      typoTolerance: { enabled: true, minWordSizeForTypos: { oneTypo: 5, twoTypos: 9 } },
    },
  },
  {
    uid: 'resources',
    primaryKey: '_id',
    settings: {
      searchableAttributes: ['name', 'mobile', 'email', 'skills', 'city', 'role'],
      filterableAttributes: ['role', 'city', 'status', 'meta.kycVerified'],
      sortableAttributes: ['createdAt'],
      typoTolerance: { enabled: true, minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 } },
    },
  },
  {
    uid: 'articles',
    primaryKey: '_id',
    settings: {
      searchableAttributes: ['title', 'content', 'tags', 'slug'],
      filterableAttributes: ['status', 'lang', 'tags'],
      sortableAttributes: ['createdAt'],
      rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
    },
  },
];

export async function initMeilisearch() {
  if (!env.MEILISEARCH_KEY && env.NODE_ENV === 'production') {
    logger.warn('Meilisearch key not set — search disabled');
    return;
  }

  const meili = getMeili();

  try {
    await meili.health();
  } catch (err) {
    logger.warn({ err: err.message }, 'Meilisearch unreachable — search disabled');
    return;
  }

  for (const cfg of INDEX_CONFIGS) {
    try {
      await meili.createIndex(cfg.uid, { primaryKey: cfg.primaryKey });
    } catch (e) {
      // already exists — ignore
      if (!e.message?.includes('already exists')) logger.warn({ uid: cfg.uid, err: e.message }, 'createIndex warn');
    }
    const idx = meili.index(cfg.uid);
    await idx.updateSettings(cfg.settings);
    logger.info({ uid: cfg.uid }, 'meilisearch index ready');
  }

  ready = true; // only set true after successful health check + index setup
}

/* ─── Sync helpers called from queue workers ─────────────────── */

export async function indexBooking(job) {
  if (!isMeiliReady()) return;
  const doc = {
    _id: String(job._id),
    shortId: String(job._id).slice(-8).toUpperCase(),
    serviceTitle: job.serviceTitle || '',
    customerName: job.customerName || '',
    customerMobile: job.customerMobile || '',
    pmName: job.pmName || '',
    resourceName: job.resourceName || '',
    status: job.status,
    country: job.country || 'IN',
    pmId: job.pmId ? String(job.pmId) : null,
    resourceId: job.resourceId ? String(job.resourceId) : null,
    userId: job.userId ? String(job.userId) : null,
    createdAt: job.createdAt ? new Date(job.createdAt).getTime() : null,
    updatedAt: job.updatedAt ? new Date(job.updatedAt).getTime() : null,
  };
  await getMeili().index('bookings').addDocuments([doc]);
}

export async function indexResource(user) {
  if (!isMeiliReady()) return;
  const doc = {
    _id: String(user._id),
    name: user.name || '',
    mobile: user.mobile || '',
    email: user.email || '',
    skills: Array.isArray(user.skills) ? user.skills.join(' ') : '',
    city: user.city || '',
    role: user.role,
    status: user.status || 'active',
    'meta.kycVerified': user.meta?.kycVerified || false,
    createdAt: user.createdAt ? new Date(user.createdAt).getTime() : null,
  };
  await getMeili().index('resources').addDocuments([doc]);
}

export async function indexArticle(article) {
  if (!isMeiliReady()) return;
  const doc = {
    _id: String(article._id),
    title: article.title || '',
    content: (article.content || '').slice(0, 2000),
    tags: Array.isArray(article.tags) ? article.tags : [],
    slug: article.slug || '',
    status: article.status,
    lang: article.lang || 'en',
    createdAt: article.createdAt ? new Date(article.createdAt).getTime() : null,
  };
  await getMeili().index('articles').addDocuments([doc]);
}

/* ─── Search helpers — used by /admin/search and the per-page ?q= ─── */

/**
 * Search the bookings index. Returns the raw Meili `hits` array (each
 * already shaped via indexBooking() above) capped at `limit`. Caller
 * decides whether to fall back to Mongo regex on empty / failure.
 *
 * Meilisearch supports typo-tolerance and prefix matching out of the
 * box, so a search for "aara" matches "Aarav" without us crafting a
 * regex — and at 1M+ docs it runs in <50ms vs Mongo's COLLSCAN.
 */
export async function searchBookings(q, { limit = 5 } = {}) {
  if (!isMeiliReady() || !q) return null;
  try {
    const res = await getMeili().index('bookings').search(q, { limit });
    return res?.hits || [];
  } catch (err) {
    logger.warn({ err: err.message, q }, 'meili bookings search failed');
    return null;
  }
}

export async function searchResources(q, { limit = 5, role } = {}) {
  if (!isMeiliReady() || !q) return null;
  try {
    const opts = { limit };
    if (role) opts.filter = `role = ${JSON.stringify(role)}`;
    const res = await getMeili().index('resources').search(q, opts);
    return res?.hits || [];
  } catch (err) {
    logger.warn({ err: err.message, q, role }, 'meili resources search failed');
    return null;
  }
}

