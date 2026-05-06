/**
 * Performance Scorecards  (Phase 2)
 *
 * Auto-computes scorecard metrics for PMs and Resources:
 *  - Bookings assigned / completed / cancelled
 *  - Avg rating (from reviews collection)
 *  - On-time completion rate
 *  - Response time (PM: time from assignment to job start)
 *  - Revenue generated
 *
 * Cached in Redis for 10 minutes to avoid aggregation overhead.
 */
import { Router } from 'express';
import { adminGuard, permGuard } from '../../middleware/role.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getDb } from '../../config/db.js';
import { redis } from '../../config/redis.js';
import { toObjectId } from '../../utils/oid.js';
import { AppError } from '../../utils/AppError.js';
import { PERMS } from '../../config/rbac.js';

const r = Router();
r.use(adminGuard);
r.use(permGuard(PERMS.POOL_READ));

const jobsCol = () => getDb().collection('jobs');
const usersCol = () => getDb().collection('users');
const reviewsCol = () => getDb().collection('reviews');

async function computeScorecard(staffId, role) {
  const oid = toObjectId(staffId);
  const fieldKey = role === 'pm' ? 'pmId' : 'resourceId';

  const since90d = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const [bookingStats, ratingStats, revenueStats] = await Promise.all([
    // Booking funnel
    jobsCol().aggregate([
      { $match: { [fieldKey]: oid, createdAt: { $gte: since90d } } },
      { $group: {
        _id: '$status',
        count: { $sum: 1 },
      }},
    ]).toArray(),

    // Avg rating
    reviewsCol().aggregate([
      { $match: { toId: oid, moderationStatus: { $ne: 'removed' } } },
      { $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      }},
    ]).toArray(),

    // Revenue (completed jobs, last 90 days)
    jobsCol().aggregate([
      { $match: { [fieldKey]: oid, status: 'completed', createdAt: { $gte: since90d } } },
      { $group: {
        _id: null,
        total: { $sum: { $ifNull: ['$pricing.total', 0] } },
        avgDuration: { $avg: {
          $cond: [
            { $and: ['$schedule.startTime', '$schedule.endTime'] },
            { $subtract: ['$schedule.endTime', '$schedule.startTime'] },
            null,
          ],
        }},
      }},
    ]).toArray(),
  ]);

  const byStatus = Object.fromEntries(bookingStats.map((s) => [s._id, s.count]));
  const total = bookingStats.reduce((acc, s) => acc + s.count, 0);
  const completed = byStatus.completed || 0;
  const cancelled = byStatus.cancelled || 0;

  return {
    staffId,
    role,
    period: '90d',
    computedAt: new Date().toISOString(),
    bookings: {
      total,
      completed,
      cancelled,
      inProgress: byStatus.in_progress || 0,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      cancellationRate: total > 0 ? Math.round((cancelled / total) * 100) : 0,
    },
    rating: {
      avg: ratingStats[0] ? Math.round(ratingStats[0].avgRating * 10) / 10 : null,
      count: ratingStats[0]?.count || 0,
    },
    revenue: {
      total: revenueStats[0]?.total || 0,
      avgPerBooking: completed > 0 ? Math.round((revenueStats[0]?.total || 0) / completed) : 0,
    },
    avgJobDurationMs: revenueStats[0]?.avgDuration || null,
  };
}

// GET /api/scorecards/:staffId?role=pm
r.get('/:staffId', asyncHandler(async (req, res) => {
  const { staffId } = req.params;
  const role = req.query.role || 'pm';

  if (!['pm', 'resource'].includes(role)) {
    throw new AppError('VALIDATION_ERROR', 'role must be pm or resource', 400);
  }

  const staff = await usersCol().findOne({ _id: toObjectId(staffId), role });
  if (!staff) throw new AppError('RESOURCE_NOT_FOUND', 'Staff member not found', 404);

  const cacheKey = `scorecard:${staffId}:${role}`;
  const cached = await redis.get(cacheKey).catch(() => null);
  if (cached) return res.json({ success: true, data: JSON.parse(cached), cached: true });

  const scorecard = await computeScorecard(staffId, role);
  await redis.set(cacheKey, JSON.stringify(scorecard), 'EX', 600).catch(() => {});
  res.json({ success: true, data: scorecard, cached: false });
}));

// GET /api/scorecards?role=pm&limit=20 — leaderboard
r.get('/', asyncHandler(async (req, res) => {
  const role = req.query.role || 'pm';
  const limit = Math.min(Number(req.query.limit) || 20, 50);

  if (!['pm', 'resource'].includes(role)) {
    throw new AppError('VALIDATION_ERROR', 'role must be pm or resource', 400);
  }

  const cacheKey = `scorecards:leaderboard:${role}:${limit}`;
  const cached = await redis.get(cacheKey).catch(() => null);
  if (cached) return res.json({ success: true, data: JSON.parse(cached), cached: true });

  const staff = await usersCol().find(
    { role, deletedAt: { $exists: false } },
    { projection: { _id: 1, name: 1, role: 1 } },
  ).limit(limit).toArray();

  const scorecards = await Promise.all(
    staff.map((s) => computeScorecard(String(s._id), role).then((sc) => ({ ...sc, name: s.name }))),
  );

  // Sort by completion rate desc, then rating desc
  scorecards.sort((a, b) => {
    const rateA = a.bookings.completionRate;
    const rateB = b.bookings.completionRate;
    if (rateB !== rateA) return rateB - rateA;
    return (b.rating.avg || 0) - (a.rating.avg || 0);
  });

  await redis.set(cacheKey, JSON.stringify(scorecards), 'EX', 600).catch(() => {});
  res.json({ success: true, data: scorecards, cached: false });
}));

export default r;
