/**
 * Unified Search  (Phase 6 — Meilisearch)
 *
 * Routes:
 *   GET  /api/search/bookings   — admin/ops full-text booking search
 *   GET  /api/search/resources  — admin/ops resource search
 *   GET  /api/search/articles   — public article/FAQ search (powers chatbot + help centre)
 *   POST /api/search/reindex    — admin: trigger full reindex from MongoDB
 *
 * Falls back to a simple MongoDB text query when Meilisearch is unavailable.
 */
import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getMeili, isMeiliReady, indexBooking, indexResource, indexArticle } from '../../config/meilisearch.js';
import { adminGuard, permGuard } from '../../middleware/role.middleware.js';
import { getDb } from '../../config/db.js';
import { PERMS } from '../../config/rbac.js';
import { paginate } from '../../utils/pagination.js';
import { logger } from '../../config/logger.js';

const r = Router();

const searchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  filter: z.string().optional(),
  sort: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

/* ─── Booking search (admin/ops) ─────────────────────────────── */
r.get('/bookings', adminGuard, permGuard(PERMS.BOOKING_READ), validate(searchQuerySchema, 'query'), asyncHandler(async (req, res) => {
  const { q, filter, sort, page, pageSize } = req.query;
  const offset = (page - 1) * pageSize;

  if (isMeiliReady()) {
    const result = await getMeili().index('bookings').search(q, {
      filter: filter || undefined,
      sort: sort ? [sort] : ['createdAt:desc'],
      offset,
      limit: +pageSize,
      attributesToRetrieve: ['_id', 'shortId', 'serviceTitle', 'customerName', 'status', 'createdAt', 'pmName', 'resourceName'],
    });
    return res.json({ success: true, data: result.hits, meta: { total: result.estimatedTotalHits, page: +page, pageSize: +pageSize } });
  }

  // MongoDB fallback
  const jobsCol = getDb().collection('jobs');
  const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const cursor = jobsCol.find({ $or: [{ serviceTitle: regex }, { customerName: regex }, { customerMobile: regex }] });
  const [items, total] = await Promise.all([
    cursor.skip(offset).limit(+pageSize).toArray(),
    cursor.count(),
  ]);
  res.json({ success: true, data: items, meta: { total, page: +page, pageSize: +pageSize } });
}));

/* ─── Resource search (admin/ops/pm) ────────────────────────── */
r.get('/resources', adminGuard, validate(searchQuerySchema, 'query'), asyncHandler(async (req, res) => {
  const { q, filter, page, pageSize } = req.query;
  const offset = (page - 1) * pageSize;

  if (isMeiliReady()) {
    const result = await getMeili().index('resources').search(q, {
      filter: filter || undefined,
      sort: ['createdAt:desc'],
      offset,
      limit: +pageSize,
      attributesToRetrieve: ['_id', 'name', 'mobile', 'role', 'city', 'skills', 'status'],
    });
    return res.json({ success: true, data: result.hits, meta: { total: result.estimatedTotalHits, page: +page, pageSize: +pageSize } });
  }

  const usersCol = getDb().collection('users');
  const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const items = await usersCol.find({
    role: { $in: ['pm', 'resource'] },
    $or: [{ name: regex }, { mobile: regex }, { email: regex }, { skills: regex }],
  }).skip(offset).limit(+pageSize).toArray();
  res.json({ success: true, data: items, meta: { page: +page, pageSize: +pageSize } });
}));

/* ─── Article search (public — powers help centre) ──────────── */
r.get('/articles', validate(searchQuerySchema, 'query'), asyncHandler(async (req, res) => {
  const { q, filter, page, pageSize } = req.query;
  const offset = (page - 1) * pageSize;

  if (isMeiliReady()) {
    const result = await getMeili().index('articles').search(q, {
      filter: filter ? `status = "published" AND ${filter}` : 'status = "published"',
      offset,
      limit: +pageSize,
      attributesToHighlight: ['title', 'content'],
      highlightPreTag: '<mark>',
      highlightPostTag: '</mark>',
      attributesToRetrieve: ['_id', 'title', 'slug', 'tags', 'lang', 'createdAt'],
    });
    return res.json({ success: true, data: result.hits, meta: { total: result.estimatedTotalHits, page: +page, pageSize: +pageSize } });
  }

  // MongoDB fallback
  const articlesCol = getDb().collection('cms_articles');
  const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const items = await articlesCol.find({
    status: 'published',
    $or: [{ title: regex }, { content: regex }, { tags: regex }],
  }).skip(offset).limit(+pageSize).project({ title: 1, slug: 1, tags: 1, lang: 1, createdAt: 1 }).toArray();
  res.json({ success: true, data: items, meta: { page: +page, pageSize: +pageSize } });
}));

/* ─── Full reindex (admin only) ─────────────────────────────── */
r.post('/reindex', adminGuard, permGuard(PERMS.DASHBOARD_READ), asyncHandler(async (req, res) => {
  if (!isMeiliReady()) {
    return res.status(503).json({ success: false, error: 'Meilisearch not available' });
  }

  // Fire reindex asynchronously — don't block the HTTP response
  res.json({ success: true, message: 'Reindex started in background' });

  setImmediate(async () => {
    try {
      const db = getDb();
      const [jobs, users, articles] = await Promise.all([
        db.collection('jobs').find({}).limit(10000).toArray(),
        db.collection('users').find({ role: { $in: ['pm', 'resource'] } }).limit(10000).toArray(),
        db.collection('cms_articles').find({ status: 'published' }).limit(5000).toArray(),
      ]);

      await Promise.all([
        getMeili().index('bookings').addDocuments(jobs.map((j) => ({
          _id: String(j._id), shortId: String(j._id).slice(-8).toUpperCase(),
          serviceTitle: j.serviceTitle || '', customerName: j.customerName || '',
          customerMobile: j.customerMobile || '', status: j.status,
          country: j.country || 'IN',
          pmId: j.pmId ? String(j.pmId) : null,
          resourceId: j.resourceId ? String(j.resourceId) : null,
          userId: j.userId ? String(j.userId) : null,
          createdAt: j.createdAt ? new Date(j.createdAt).getTime() : null,
        }))),
        getMeili().index('resources').addDocuments(users.map((u) => ({
          _id: String(u._id), name: u.name || '', mobile: u.mobile || '',
          email: u.email || '', skills: Array.isArray(u.skills) ? u.skills.join(' ') : '',
          city: u.city || '', role: u.role, status: u.status || 'active',
          'meta.kycVerified': u.meta?.kycVerified || false,
          createdAt: u.createdAt ? new Date(u.createdAt).getTime() : null,
        }))),
        getMeili().index('articles').addDocuments(articles.map((a) => ({
          _id: String(a._id), title: a.title || '',
          content: (a.content || '').slice(0, 2000),
          tags: Array.isArray(a.tags) ? a.tags : [], slug: a.slug || '',
          status: a.status, lang: a.lang || 'en',
          createdAt: a.createdAt ? new Date(a.createdAt).getTime() : null,
        }))),
      ]);
      logger.info({ jobs: jobs.length, users: users.length, articles: articles.length }, 'meilisearch reindex complete');
    } catch (err) {
      logger.error({ err }, 'meilisearch reindex failed');
    }
  });
}));

export default r;
