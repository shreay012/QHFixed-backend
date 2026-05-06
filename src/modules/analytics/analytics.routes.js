/**
 * Analytics  (Phase 5)
 *
 * Endpoints:
 *  - GET /api/analytics/cohorts      — weekly/monthly booking cohorts
 *  - GET /api/analytics/rfm          — RFM (Recency-Frequency-Monetary) segments
 *  - GET /api/analytics/retention    — D7, D30 booking retention
 *  - GET /api/analytics/funnel       — booking funnel (view → cart → pay → complete)
 *  - GET /api/analytics/revenue      — revenue by day/week/month + breakdown
 *  - POST /api/analytics/segments    — query users matching a custom segment definition
 *
 * All analytics are read-only and require DASHBOARD_READ permission.
 * Heavy aggregations are cached 10-30 minutes.
 */
import { Router } from 'express';
import { z } from 'zod';
import { adminGuard, permGuard } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getDb } from '../../config/db.js';
import { redis } from '../../config/redis.js';
import { PERMS } from '../../config/rbac.js';

const r = Router();
r.use(adminGuard);
r.use(permGuard(PERMS.DASHBOARD_READ));

const jobsCol = () => getDb().collection('jobs');
const usersCol = () => getDb().collection('users');
const paymentsCol = () => getDb().collection('payments');

/* ─── helpers ────────────────────────────────────────────────── */
async function cached(key, ttl, fn) {
  const hit = await redis.get(key).catch(() => null);
  if (hit) return JSON.parse(hit);
  const val = await fn();
  await redis.set(key, JSON.stringify(val), 'EX', ttl).catch(() => {});
  return val;
}

function dateFloor(date, granularity) {
  const d = new Date(date);
  if (granularity === 'week') {
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
  } else if (granularity === 'month') {
    d.setDate(1); d.setHours(0, 0, 0, 0);
  } else {
    d.setHours(0, 0, 0, 0);
  }
  return d;
}

/* ─── Cohort Analysis ────────────────────────────────────────── */
// GET /api/analytics/cohorts?granularity=week&weeks=12
r.get('/cohorts', asyncHandler(async (req, res) => {
  const granularity = req.query.granularity || 'week';
  const periods = Math.min(Number(req.query.periods) || 12, 52);

  const data = await cached(`analytics:cohorts:${granularity}:${periods}`, 1800, async () => {
    const since = new Date(Date.now() - periods * (granularity === 'month' ? 30 : 7) * 86400_000);

    // First booking per user (acquisition cohort)
    const firstBookings = await jobsCol().aggregate([
      { $match: { createdAt: { $gte: since }, status: { $ne: 'cancelled' } } },
      { $sort: { createdAt: 1 } },
      { $group: {
        _id: '$userId',
        firstBooking: { $first: '$createdAt' },
        totalBookings: { $sum: 1 },
        totalSpend: { $sum: { $ifNull: ['$pricing.total', 0] } },
      }},
    ]).toArray();

    // Group into cohort buckets
    const cohorts = {};
    for (const u of firstBookings) {
      const bucket = dateFloor(u.firstBooking, granularity).toISOString().slice(0, 10);
      if (!cohorts[bucket]) cohorts[bucket] = { users: 0, totalBookings: 0, totalSpend: 0 };
      cohorts[bucket].users++;
      cohorts[bucket].totalBookings += u.totalBookings;
      cohorts[bucket].totalSpend += u.totalSpend;
    }

    return Object.entries(cohorts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, data]) => ({ period, ...data, avgBookingsPerUser: data.users ? +(data.totalBookings / data.users).toFixed(2) : 0 }));
  });

  res.json({ success: true, data });
}));

/* ─── RFM Segmentation ───────────────────────────────────────── */
// GET /api/analytics/rfm?limit=500
r.get('/rfm', asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 200, 1000);

  const data = await cached(`analytics:rfm:${limit}`, 1800, async () => {
    const since90d = new Date(Date.now() - 90 * 86400_000);
    const now = new Date();

    const users = await jobsCol().aggregate([
      { $match: { status: { $ne: 'cancelled' }, 'pricing.total': { $gt: 0 } } },
      { $group: {
        _id: '$userId',
        lastBooking: { $max: '$createdAt' },
        frequency: { $sum: 1 },
        monetary: { $sum: { $ifNull: ['$pricing.total', 0] } },
      }},
      { $limit: limit },
    ]).toArray();

    const scored = users.map((u) => {
      const recencyDays = Math.floor((now - u.lastBooking) / 86400_000);
      // Score 1-5 (5 = best)
      const R = recencyDays <= 7 ? 5 : recencyDays <= 30 ? 4 : recencyDays <= 60 ? 3 : recencyDays <= 90 ? 2 : 1;
      const F = u.frequency >= 10 ? 5 : u.frequency >= 6 ? 4 : u.frequency >= 3 ? 3 : u.frequency >= 2 ? 2 : 1;
      const M = u.monetary >= 50000 ? 5 : u.monetary >= 20000 ? 4 : u.monetary >= 10000 ? 3 : u.monetary >= 5000 ? 2 : 1;
      const rfmScore = R * 100 + F * 10 + M;

      let segment;
      if (R >= 4 && F >= 4 && M >= 4) segment = 'champions';
      else if (R >= 3 && F >= 3) segment = 'loyal';
      else if (R >= 4 && F <= 2) segment = 'new';
      else if (R <= 2 && F >= 3) segment = 'at_risk';
      else if (R === 1) segment = 'lost';
      else segment = 'potential';

      return { userId: u._id, recencyDays, frequency: u.frequency, monetary: u.monetary, R, F, M, rfmScore, segment };
    });

    // Summary by segment
    const summary = {};
    for (const u of scored) {
      if (!summary[u.segment]) summary[u.segment] = { count: 0, totalRevenue: 0 };
      summary[u.segment].count++;
      summary[u.segment].totalRevenue += u.monetary;
    }

    return { users: scored, summary };
  });

  res.json({ success: true, data });
}));

/* ─── Retention ──────────────────────────────────────────────── */
// GET /api/analytics/retention — D7 + D30 returning bookers
r.get('/retention', asyncHandler(async (req, res) => {
  const data = await cached('analytics:retention', 3600, async () => {
    const d7 = new Date(Date.now() - 7 * 86400_000);
    const d30 = new Date(Date.now() - 30 * 86400_000);
    const d60 = new Date(Date.now() - 60 * 86400_000);

    const [newLast30, retainedD7, retainedD30] = await Promise.all([
      // Users who placed first ever booking in last 30 days
      jobsCol().aggregate([
        { $sort: { createdAt: 1 } },
        { $group: { _id: '$userId', firstAt: { $first: '$createdAt' } } },
        { $match: { firstAt: { $gte: d30 } } },
        { $count: 'n' },
      ]).toArray(),

      // Users who booked in last 7 days AND had a prior booking
      jobsCol().aggregate([
        { $match: { createdAt: { $gte: d7 } } },
        { $group: { _id: '$userId' } },
        { $lookup: { from: 'jobs', localField: '_id', foreignField: 'userId', as: 'prior' } },
        { $match: { 'prior.1': { $exists: true } } }, // at least 2 bookings total
        { $count: 'n' },
      ]).toArray(),

      // Users who booked in last 30 days AND had booking before that
      jobsCol().aggregate([
        { $match: { createdAt: { $gte: d30, $lt: new Date() } } },
        { $group: { _id: '$userId' } },
        { $lookup: { from: 'jobs', localField: '_id', foreignField: 'userId', as: 'older' } },
        { $match: { 'older.createdAt': { $lte: d30 } } },
        { $count: 'n' },
      ]).toArray(),
    ]);

    return {
      newUsersLast30d: newLast30[0]?.n || 0,
      retainedD7: retainedD7[0]?.n || 0,
      retainedD30: retainedD30[0]?.n || 0,
    };
  });

  res.json({ success: true, data });
}));

/* ─── Revenue Analytics ──────────────────────────────────────── */
// GET /api/analytics/revenue?granularity=day&from=2026-01-01&to=2026-04-30
r.get('/revenue', asyncHandler(async (req, res) => {
  const granularity = req.query.granularity || 'day'; // day | week | month
  const from = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 30 * 86400_000);
  const to = req.query.to ? new Date(req.query.to) : new Date();

  const cacheKey = `analytics:revenue:${granularity}:${from.toISOString().slice(0, 10)}:${to.toISOString().slice(0, 10)}`;
  const data = await cached(cacheKey, 1800, async () => {
    const fmt = granularity === 'month' ? '%Y-%m' : granularity === 'week' ? '%Y-%V' : '%Y-%m-%d';
    const rows = await jobsCol().aggregate([
      { $match: { status: { $ne: 'cancelled' }, createdAt: { $gte: from, $lte: to } } },
      { $group: {
        _id: { $dateToString: { format: fmt, date: '$createdAt' } },
        revenue: { $sum: { $ifNull: ['$pricing.total', 0] } },
        bookings: { $sum: 1 },
        avgOrderValue: { $avg: { $ifNull: ['$pricing.total', 0] } },
      }},
      { $sort: { _id: 1 } },
    ]).toArray();

    return rows.map((r) => ({ period: r._id, revenue: r.revenue, bookings: r.bookings, avgOrderValue: Math.round(r.avgOrderValue) }));
  });

  res.json({ success: true, data });
}));

/* ─── Segment Query (audience builder) ──────────────────────── */
// POST /api/analytics/segments — returns user IDs matching criteria
r.post('/segments', validate(z.object({
  minBookings: z.number().int().min(1).optional(),
  maxBookings: z.number().int().optional(),
  minSpend: z.number().optional(),
  maxSpend: z.number().optional(),
  lastActiveAfter: z.string().datetime().optional(),
  lastActiveBefore: z.string().datetime().optional(),
  country: z.string().optional(),
  rfmSegment: z.enum(['champions', 'loyal', 'new', 'at_risk', 'lost', 'potential']).optional(),
  limit: z.number().int().min(1).max(10000).default(1000),
})), asyncHandler(async (req, res) => {
  const { minBookings, maxBookings, minSpend, maxSpend, lastActiveAfter, lastActiveBefore, country, limit } = req.body;

  const matchStage = { status: { $ne: 'cancelled' } };
  if (country) matchStage.country = country;

  const groupStage = {
    _id: '$userId',
    frequency: { $sum: 1 },
    monetary: { $sum: { $ifNull: ['$pricing.total', 0] } },
    lastActive: { $max: '$createdAt' },
  };

  const havingFilters = {};
  if (minBookings) havingFilters.frequency = { ...havingFilters.frequency, $gte: minBookings };
  if (maxBookings) havingFilters.frequency = { ...havingFilters.frequency, $lte: maxBookings };
  if (minSpend) havingFilters.monetary = { ...havingFilters.monetary, $gte: minSpend };
  if (maxSpend) havingFilters.monetary = { ...havingFilters.monetary, $lte: maxSpend };
  if (lastActiveAfter) havingFilters.lastActive = { ...havingFilters.lastActive, $gte: new Date(lastActiveAfter) };
  if (lastActiveBefore) havingFilters.lastActive = { ...havingFilters.lastActive, $lte: new Date(lastActiveBefore) };

  const pipeline = [
    { $match: matchStage },
    { $group: groupStage },
    ...(Object.keys(havingFilters).length ? [{ $match: havingFilters }] : []),
    { $sort: { monetary: -1 } },
    { $limit: limit },
    { $project: { _id: 1, frequency: 1, monetary: 1, lastActive: 1 } },
  ];

  const users = await jobsCol().aggregate(pipeline).toArray();
  res.json({ success: true, data: { count: users.length, users } });
}));

/* ─── Funnel Analytics ───────────────────────────────────────── */
// GET /api/analytics/funnel?from=2026-01-01
r.get('/funnel', asyncHandler(async (req, res) => {
  const from = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 30 * 86400_000);

  const data = await cached(`analytics:funnel:${from.toISOString().slice(0, 10)}`, 1800, async () => {
    const [created, confirmed, paid, completed, cancelled] = await Promise.all([
      jobsCol().countDocuments({ createdAt: { $gte: from } }),
      jobsCol().countDocuments({ createdAt: { $gte: from }, status: { $nin: ['pending'] } }),
      paymentsCol().countDocuments({ createdAt: { $gte: from }, status: 'paid' }),
      jobsCol().countDocuments({ createdAt: { $gte: from }, status: 'completed' }),
      jobsCol().countDocuments({ createdAt: { $gte: from }, status: 'cancelled' }),
    ]);

    return [
      { stage: 'created', count: created, pct: 100 },
      { stage: 'confirmed', count: confirmed, pct: created ? Math.round((confirmed / created) * 100) : 0 },
      { stage: 'paid', count: paid, pct: created ? Math.round((paid / created) * 100) : 0 },
      { stage: 'completed', count: completed, pct: created ? Math.round((completed / created) * 100) : 0 },
      { stage: 'cancelled', count: cancelled, pct: created ? Math.round((cancelled / created) * 100) : 0 },
    ];
  });

  res.json({ success: true, data });
}));

export default r;
