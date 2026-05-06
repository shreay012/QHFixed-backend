/**
 * Live Ops Dashboard API  (Phase 2)
 *
 * Endpoints consumed by the admin front-end to power:
 *  - Real-time KPI cards
 *  - SLA breach alert ticker
 *  - Booking funnel by status
 *  - Active jobs map / list
 *  - Recent payment events
 */
import { Router } from 'express';
import { adminGuard, permGuard } from '../../middleware/role.middleware.js';
import { PERMS } from '../../config/rbac.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getDb } from '../../config/db.js';
import { redis } from '../../config/redis.js';
import { getIO } from '../../socket/index.js';

const r = Router();
r.use(adminGuard);
r.use(permGuard(PERMS.DASHBOARD_READ));

const col = (name) => getDb().collection(name);

// SLA thresholds (minutes) — configurable via feature flags later
const SLA = {
  assign_pm_after_payment: 30,    // PM must be assigned within 30 min of payment
  start_after_pm_assign: 60,      // Resource must be started within 1 h of PM assign
  ticket_first_response: 120,     // Support must reply within 2 h
  ticket_resolution: 1440,        // Ticket must close within 24 h
};

function minsAgo(minutes) {
  return new Date(Date.now() - minutes * 60 * 1000);
}

/* ─── GET /api/ops/live ─────────────────────────────────────────
   Main dashboard snapshot — cached 30 s so repeated polls are cheap.
 ─────────────────────────────────────────────────────────────── */
r.get('/live', asyncHandler(async (_req, res) => {
  const cacheKey = 'ops:live:snapshot';
  const cached = await redis.get(cacheKey).catch(() => null);
  if (cached) return res.json({ success: true, data: JSON.parse(cached), cached: true });

  const [
    statusCounts,
    recentPayments,
    openTickets,
    activeJobCount,
    todayNewBookings,
    todayRevenue,
    pmStats,
    resourceStats,
  ] = await Promise.all([
    // Booking funnel by status
    col('jobs').aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]).toArray(),

    // Last 5 payment events
    col('payments').find({}).sort({ createdAt: -1 }).limit(5)
      .project({ amount: 1, status: 1, createdAt: 1, gateway: 1 }).toArray(),

    // Open ticket count
    col('tickets').countDocuments({ status: { $in: ['open', 'in_progress'] } }),

    // Active (in_progress) job count
    col('jobs').countDocuments({ status: 'in_progress' }),

    // New bookings today
    col('jobs').countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    }),

    // Revenue today
    col('jobs').aggregate([
      { $match: {
        status: { $nin: ['cancelled'] },
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }},
      { $group: { _id: null, total: { $sum: { $ifNull: ['$pricing.total', 0] } } } },
    ]).toArray(),

    // PM utilisation
    col('users').aggregate([
      { $match: { role: 'pm', deletedAt: { $exists: false } } },
      { $count: 'total' },
    ]).toArray(),

    // Resource utilisation
    col('users').aggregate([
      { $match: { role: 'resource', deletedAt: { $exists: false } } },
      { $count: 'total' },
    ]).toArray(),
  ]);

  const byStatus = Object.fromEntries(statusCounts.map((s) => [s._id, s.count]));

  const snapshot = {
    timestamp: new Date().toISOString(),
    kpis: {
      activeJobs: activeJobCount,
      openTickets,
      todayBookings: todayNewBookings,
      todayRevenue: todayRevenue[0]?.total || 0,
      totalPMs: pmStats[0]?.total || 0,
      totalResources: resourceStats[0]?.total || 0,
    },
    bookingFunnel: byStatus,
    recentPayments,
  };

  await redis.set(cacheKey, JSON.stringify(snapshot), 'EX', 30).catch(() => {});
  res.json({ success: true, data: snapshot, cached: false });
}));

/* ─── GET /api/ops/sla-breaches ─────────────────────────────────
   Returns bookings currently breaching SLA thresholds.
 ─────────────────────────────────────────────────────────────── */
r.get('/sla-breaches', asyncHandler(async (_req, res) => {
  const cacheKey = 'ops:sla-breaches';
  const cached = await redis.get(cacheKey).catch(() => null);
  if (cached) return res.json({ success: true, data: JSON.parse(cached), cached: true });

  const [unassigned, unstarted, overdueTickets] = await Promise.all([
    // Paid but no PM assigned after threshold
    col('jobs').find({
      status: { $in: ['pending', 'confirmed'] },
      createdAt: { $lte: minsAgo(SLA.assign_pm_after_payment) },
    }).sort({ createdAt: 1 }).limit(50)
      .project({ _id: 1, status: 1, createdAt: 1, 'pricing.total': 1 }).toArray(),

    // PM assigned but not started after threshold
    col('jobs').find({
      status: 'assigned_to_pm',
      updatedAt: { $lte: minsAgo(SLA.start_after_pm_assign) },
    }).sort({ updatedAt: 1 }).limit(50)
      .project({ _id: 1, status: 1, updatedAt: 1, pmId: 1 }).toArray(),

    // Open tickets with no reply past SLA
    col('tickets').find({
      status: { $in: ['open', 'in_progress'] },
      createdAt: { $lte: minsAgo(SLA.ticket_first_response) },
    }).sort({ createdAt: 1 }).limit(50)
      .project({ _id: 1, status: 1, createdAt: 1, subject: 1 }).toArray(),
  ]);

  const breaches = [
    ...unassigned.map((b) => ({ type: 'PM_NOT_ASSIGNED', bookingId: b._id, since: b.createdAt, slaMin: SLA.assign_pm_after_payment })),
    ...unstarted.map((b) => ({ type: 'NOT_STARTED', bookingId: b._id, since: b.updatedAt, pmId: b.pmId, slaMin: SLA.start_after_pm_assign })),
    ...overdueTickets.map((t) => ({ type: 'TICKET_OVERDUE', ticketId: t._id, since: t.createdAt, subject: t.subject, slaMin: SLA.ticket_first_response })),
  ];

  await redis.set(cacheKey, JSON.stringify(breaches), 'EX', 60).catch(() => {});
  res.json({ success: true, data: breaches, count: breaches.length, cached: false });
}));

/* ─── GET /api/ops/alerts ────────────────────────────────────────
   Alert ticker: recent anomalies (failed payments, high cancellation
   rate, etc.).  Data is cached 2 min.
 ─────────────────────────────────────────────────────────────── */
r.get('/alerts', asyncHandler(async (_req, res) => {
  const cacheKey = 'ops:alerts';
  const cached = await redis.get(cacheKey).catch(() => null);
  if (cached) return res.json({ success: true, data: JSON.parse(cached) });

  const since1h = new Date(Date.now() - 3600_000);
  const since15m = new Date(Date.now() - 900_000);

  const [
    failedPayments,
    cancelledLast1h,
    highVelocityUsers,
  ] = await Promise.all([
    col('payments').countDocuments({ status: 'failed', createdAt: { $gte: since1h } }),
    col('jobs').countDocuments({ status: 'cancelled', updatedAt: { $gte: since1h } }),
    // Users who created 3+ bookings in last 15 min (velocity check)
    col('jobs').aggregate([
      { $match: { createdAt: { $gte: since15m } } },
      { $group: { _id: '$userId', count: { $sum: 1 } } },
      { $match: { count: { $gte: 3 } } },
      { $count: 'suspicious' },
    ]).toArray(),
  ]);

  const alerts = [];
  if (failedPayments >= 5) {
    alerts.push({ level: 'warn', type: 'HIGH_FAILED_PAYMENTS', value: failedPayments, message: `${failedPayments} payment failures in last 1 hour` });
  }
  if (cancelledLast1h >= 10) {
    alerts.push({ level: 'warn', type: 'HIGH_CANCELLATION_RATE', value: cancelledLast1h, message: `${cancelledLast1h} cancellations in last 1 hour` });
  }
  if (highVelocityUsers[0]?.suspicious > 0) {
    alerts.push({ level: 'warn', type: 'BOOKING_VELOCITY_SPIKE', value: highVelocityUsers[0].suspicious, message: `${highVelocityUsers[0].suspicious} users with 3+ bookings in 15 min` });
  }

  await redis.set(cacheKey, JSON.stringify(alerts), 'EX', 120).catch(() => {});
  res.json({ success: true, data: alerts });
}));

/* ─── GET /api/ops/active-jobs ───────────────────────────────────
   Paginated list of currently in_progress jobs for live ops table.
 ─────────────────────────────────────────────────────────────── */
r.get('/active-jobs', asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const skip = Number(req.query.skip) || 0;

  const [jobs, total] = await Promise.all([
    col('jobs').find({ status: 'in_progress' })
      .sort({ updatedAt: -1 }).skip(skip).limit(limit)
      .project({ _id: 1, status: 1, 'pricing.total': 1, pmId: 1, resourceId: 1, createdAt: 1, updatedAt: 1 })
      .toArray(),
    col('jobs').countDocuments({ status: 'in_progress' }),
  ]);

  res.json({ success: true, data: jobs, total, limit, skip });
}));

/* ─── POST /api/ops/broadcast ────────────────────────────────────
   Emit a socket event to all connected admin clients (ops-only write).
 ─────────────────────────────────────────────────────────────── */
r.post('/broadcast', permGuard(PERMS.BOOKING_WRITE), asyncHandler(async (req, res) => {
  const { event = 'ops:announcement', payload = {} } = req.body || {};
  const io = getIO();
  if (io) io.to('role_admin').emit(event, { ...payload, sentAt: new Date().toISOString() });
  res.json({ success: true });
}));

export default r;
