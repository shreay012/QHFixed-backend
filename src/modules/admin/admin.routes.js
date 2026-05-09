import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { adminGuard, permGuard } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { auditAdmin } from '../../middleware/audit.middleware.js';
import { rateLimitSearch } from '../../middleware/rateLimit.middleware.js';
import { getDb, getDualDb } from '../../config/db.js';
import { ACTIVE_COUNTRY_CODES } from '../../config/country.config.js';
import { redis } from '../../config/redis.js';
import { clearCachePattern, deleteCacheValue, getOrSet } from '../../utils/cache.js';
import { CACHE_KEYS } from '../../utils/cache.keys.js';
import { ObjectId } from 'mongodb';
import { paginate, buildMeta } from '../../utils/pagination.js';
import { applyScope, isOutOfScope } from '../../utils/scope.js';
import { searchBookings as meiliSearchBookings, searchResources as meiliSearchResources, isMeiliReady } from '../../config/meilisearch.js';
import * as bookingService from '../booking/booking.service.js';
import { AppError } from '../../utils/AppError.js';
import { toObjectId } from '../../utils/oid.js';
import { getSchedulingConfig, setSchedulingConfig } from '../availability/availability.service.js';
import { PERMS } from '../../config/rbac.js';
import { recordAudit } from '../audit/audit.service.js';

const r = Router();
// All admin-namespace roles may enter; individual routes narrow via permGuard()
r.use(adminGuard);
r.use(auditAdmin);

async function invalidateServicesCache(id) {
  try {
    // service.routes.js caches the list under "services:list:<country>:<locale>"
    // (CACHE_KEYS.SERVICES_LIST = 'services:list').
    // The old keys "cache:services:all" / "cache:services:<id>" no longer exist
    // in service.routes.js, so we must target the actual key patterns.
    await clearCachePattern(`${CACHE_KEYS.SERVICES_LIST}:*`);

    if (id) {
      // Detail pages: "services:detail:<id>:<country>:<locale>"
      await clearCachePattern(`${CACHE_KEYS.SERVICES_DETAIL(id)}:*`);
      await deleteCacheValue(CACHE_KEYS.SERVICES_DETAIL(id));
    }
  } catch { /* Redis errors must never crash the admin action */ }
}

const bookingsCol = () => getDualDb().collection('bookings');
const jobsCol = () => getDualDb().collection('jobs');
const usersCol = () => getDualDb().collection('users');
const paymentsCol = () => getDualDb().collection('payments');
const ticketsCol = () => getDualDb().collection('tickets');
const servicesCol = () => getDualDb().collection('services');

// Build hydrated job rows (customerName + serviceName + amount + pmName + resourceName) for FE tables.
async function hydrateJobs(jobs) {
  if (!jobs.length) return [];
  const userIds = new Set();
  const svcIds = new Set();
  const pmIds = new Set();
  const resIds = new Set();
  for (const j of jobs) {
    if (j.userId) userIds.add(String(j.userId));
    if (j.serviceId) svcIds.add(String(j.serviceId));
    if (j.pmId) pmIds.add(String(j.pmId));
    if (j.resourceId) resIds.add(String(j.resourceId));
    for (const s of (j.services || [])) {
      if (s?.serviceId) svcIds.add(String(s.serviceId));
    }
  }
  const toOid = (x) => { try { return new ObjectId(String(x)); } catch { return null; } };
  const [users, svcs] = await Promise.all([
    userIds.size || pmIds.size || resIds.size
      ? usersCol().find({ _id: { $in: [...userIds, ...pmIds, ...resIds].map(toOid).filter(Boolean) } }).toArray()
      : [],
    svcIds.size
      ? servicesCol().find({ _id: { $in: [...svcIds].map(toOid).filter(Boolean) } }).toArray()
      : [],
  ]);
  const uMap = new Map(users.map((u) => [String(u._id), u]));
  const sMap = new Map(svcs.map((s) => [String(s._id), s]));
  return jobs.map((j) => {
    const u = uMap.get(String(j.userId));
    const pm = uMap.get(String(j.pmId));
    const res = uMap.get(String(j.resourceId));
    const firstSvcId = j.services?.[0]?.serviceId || j.serviceId;
    const svc = sMap.get(String(firstSvcId));
    return {
      ...j,
      customerName: u?.name || u?.mobile || 'N/A',
      customerMobile: u?.mobile || '',
      serviceName: svc?.name || j.title || 'Service',
      amount: j.pricing?.total || j.pricing?.subtotal || 0,
      pmName: pm?.name || '',
      pmMobile: pm?.mobile || '',
      resourceName: res?.name || '',
      resourceMobile: res?.mobile || '',
    };
  });
}

r.get('/dashboard', asyncHandler(async (req, res) => {
  // Per-scope cache key — country_admin (IN)'s overview must never be served
  // to country_admin (DE), and super_admin's global view is its own bucket.
  const scopeMode = req.scope?.mode || 'off';
  const scopeCountry = req.scope?.filter?.country || 'all';
  const cacheKey = `admin:dashboard:overview:${scopeMode}:${scopeCountry}`;
  const data = await getOrSet(cacheKey, async () => {
    const userScope = applyScope({ role: 'user' }, req);
    const jobScope  = applyScope({}, req);
    const paidScope = applyScope({ status: 'paid' }, req);
    const [totalUsers, totalBookings, paidPayments, byStatus] = await Promise.all([
      usersCol().countDocuments(userScope),
      jobsCol().countDocuments(jobScope),
      paymentsCol().aggregate([
        { $match: paidScope },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]).toArray(),
      jobsCol().aggregate([
        { $match: jobScope },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]).toArray(),
    ]);
    return {
      totalUsers,
      totalBookings,
      revenue: paidPayments[0] || { total: 0, count: 0 },
      bookingsByStatus: Object.fromEntries(byStatus.map(b => [b._id, b.count])),
    };
  }, 60);
  res.json({ success: true, data });
}));

r.get('/bookings', asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10, pageSize } = req.query;
  const lim = Number(pageSize || limit) || 10;
  const pg = Number(page) || 1;
  const baseFilter = {};
  if (status) baseFilter.status = String(status);
  // Country/role scope merged via applyScope — super_admin sees all, country_admin
  // sees only their country, etc. See utils/scope.js + country-scope.middleware.js.
  const filter = applyScope(baseFilter, req);
  const [rawJobs, total] = await Promise.all([
    jobsCol().find(filter).sort({ createdAt: -1 }).skip((pg - 1) * lim).limit(lim).toArray(),
    jobsCol().countDocuments(filter),
  ]);
  const bookings = await hydrateJobs(rawJobs);
  res.json({ success: true, data: { bookings, total, page: pg, limit: lim } });
}));

r.get('/bookings/:id', asyncHandler(async (req, res) => {
  let job = null;
  try { job = await jobsCol().findOne({ _id: new ObjectId(req.params.id) }); } catch {}
  if (!job) throw new AppError('RESOURCE_NOT_FOUND', 'Booking not found', 404);
  // 404 (not 403) on cross-country access — don't leak that the booking exists.
  if (isOutOfScope(job, req)) throw new AppError('RESOURCE_NOT_FOUND', 'Booking not found', 404);
  const [hydrated] = await hydrateJobs([job]);
  res.json({ success: true, data: hydrated });
}));

/* ═══════════════════════════════════════════════════════════════════════
   GLOBAL SEARCH — single endpoint backing the admin shell's command-bar.
   ?q=… is matched across bookings, customers, payments, and tickets, then
   results are returned as a tagged union the FE can render in grouped
   sections and use to deep-link straight to the right detail page.

   Cap is 5 hits per kind (so the dropdown stays scannable) and 24-char
   hex strings are short-circuited to direct ObjectId lookups so a paste
   of a booking/payment/user id always lands first.
══════════════════════════════════════════════════════════════════════ */
r.get('/search', rateLimitSearch(), asyncHandler(async (req, res) => {
  const raw = String(req.query.q || '').trim();
  if (raw.length < 2) {
    return res.json({ success: true, data: { bookings: [], customers: [], payments: [], tickets: [] } });
  }
  const safe = raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(safe, 'i');
  const oid = (() => { try { return new ObjectId(raw); } catch { return null; } })();
  const cap = 5;

  // Bookings + (PM/resource) staff: prefer Meilisearch when ready. The
  // bookings + resources collections are the two largest the search hits
  // and the only ones already wired into Meili indexes (see
  // config/meilisearch.js). Customers / payments / tickets fall back to
  // Mongo for now — separate Meili indexes can be added later if those
  // become hot. When Meili is unhealthy we transparently fall back to
  // Mongo regex for everything so search never returns "service down".
  const meiliBookings = await meiliSearchBookings(raw, { limit: cap });
  const meiliResources = await meiliSearchResources(raw, { limit: cap });

  // ── Bookings — Meili-first, Mongo fallback. The previous Mongo path
  // used `$expr: { $regexMatch: { $toString: '$_id' } }` which forces a
  // full collection scan even on indexed _id. The fallback now matches
  // ObjectId only when the input is a full 24-char hex string and
  // otherwise relies on the customer-field regex (which still scans
  // jobs at scale — that's why the Meili path is preferred).
  const bookingFilter = { $or: [
    ...(oid ? [{ _id: oid }] : []),
    { customerName: re },
    { customerMobile: re },
    { customerEmail: re },
  ]};

  // Customers (role 'user') — name / mobile / email
  const customerFilter = { role: 'user', $or: [
    ...(oid ? [{ _id: oid }] : []),
    { name: re },
    { mobile: re },
    { email: re },
  ]};

  // Payments — Razorpay/Stripe IDs are short strings, not ObjectIds.
  const paymentFilter = { $or: [
    { paymentId: re },
    { orderId:   re },
    ...(oid ? [{ _id: oid }] : []),
  ]};

  // Tickets — subject + ticket _id + linked user (looked up below)
  const userMatchIds = (await usersCol()
    .find({ $or: [{ name: re }, { mobile: re }, { email: re }] })
    .project({ _id: 1 })
    .limit(20)
    .toArray()).map((u) => u._id);
  const ticketFilter = { $or: [
    { subject: re },
    ...(oid ? [{ _id: oid }] : []),
    ...(userMatchIds.length ? [{ userId: { $in: userMatchIds } }] : []),
  ]};

  // Bookings: hydrate from Meili if we got hits, otherwise fall back to
  // Mongo. Meili hits are pre-shaped via indexBooking() so we can use
  // them directly.
  const bookingsTask = (meiliBookings && meiliBookings.length)
    ? Promise.resolve(meiliBookings.map((h) => ({
        _id: h._id,
        customerName: h.customerName,
        customerMobile: h.customerMobile,
        serviceName: h.serviceTitle,
        status: h.status,
      })))
    : jobsCol().find(bookingFilter).sort({ createdAt: -1 }).limit(cap).toArray();

  const [bookings, customers, payments, tickets] = await Promise.all([
    bookingsTask,
    usersCol().find(customerFilter).sort({ createdAt: -1 }).limit(cap).toArray(),
    paymentsCol().find(paymentFilter).sort({ createdAt: -1 }).limit(cap).toArray(),
    ticketsCol().find(ticketFilter).sort({ createdAt: -1 }).limit(cap).toArray(),
  ]);

  // Surface a debug header so on-call can tell at a glance whether the
  // search hit Meili or fell back. Doesn't leak anything sensitive.
  res.setHeader('x-search-backend', isMeiliReady() ? 'meilisearch' : 'mongo');

  // Shape each row into { kind, _id, label, sublabel, route } so the FE
  // doesn't have to know the schema differences. The route field is what
  // the global-search bar's onClick handler navigates to.
  res.json({
    success: true,
    data: {
      bookings: bookings.map((b) => ({
        kind: 'booking',
        _id: String(b._id),
        label: b.customerName || `Booking #${String(b._id).slice(-8)}`,
        sublabel: `${b.serviceName || 'Booking'} · ${b.status || '—'} · #${String(b._id).slice(-8)}`,
        route: `/admin/bookings/${b._id}`,
      })),
      customers: customers.map((u) => ({
        kind: 'customer',
        _id: String(u._id),
        label: u.name || u.mobile || u.email || 'Customer',
        sublabel: [u.mobile, u.email].filter(Boolean).join(' · ') || `#${String(u._id).slice(-8)}`,
        route: `/admin/users?q=${encodeURIComponent(u.mobile || u.email || u.name || '')}`,
      })),
      payments: payments.map((p) => ({
        kind: 'payment',
        _id: String(p._id),
        label: p.paymentId || p.orderId || `Payment #${String(p._id).slice(-8)}`,
        sublabel: `${p.currency || ''} ${p.amount ?? ''} · ${p.status || '—'} · ${p.provider || ''}`.trim(),
        route: `/admin/payments?q=${encodeURIComponent(p.paymentId || p.orderId || String(p._id))}`,
      })),
      tickets: tickets.map((t) => ({
        kind: 'ticket',
        _id: String(t._id),
        label: t.subject || `Ticket #${String(t._id).slice(-8)}`,
        sublabel: `${t.status || '—'} · ${t.priority || 'normal'} · #${String(t._id).slice(-8)}`,
        route: `/admin/tickets/${t._id}`,
      })),
    },
  });
}));

/* ══════════════════════════════════════════════════════════════════════
   PAYMENTS — admin transaction explorer
   - GET /admin/payments               list with filters + pagination
   - GET /admin/payments/stats         aggregated KPIs across all currencies
   - GET /admin/payments/:id           single transaction detail (hydrated)
   Filters: status, country, currency, gateway, q (paymentId/orderId/email),
            from, to (ISO dates), userId, jobId
══════════════════════════════════════════════════════════════════════ */

async function hydratePayments(payments) {
  if (!payments.length) return [];
  const userIds = new Set();
  const jobIds  = new Set();
  for (const p of payments) {
    if (p.userId) userIds.add(String(p.userId));
    if (p.jobId)  jobIds.add(String(p.jobId));
  }
  const toOid = (x) => { try { return new ObjectId(String(x)); } catch { return null; } };
  const [users, jobs] = await Promise.all([
    userIds.size
      ? usersCol().find({ _id: { $in: [...userIds].map(toOid).filter(Boolean) } })
          .project({ name: 1, mobile: 1, email: 1 })
          .toArray()
      : [],
    jobIds.size
      ? jobsCol().find({ _id: { $in: [...jobIds].map(toOid).filter(Boolean) } })
          .project({ title: 1, status: 1, services: 1, pricing: 1 })
          .toArray()
      : [],
  ]);
  const uMap = new Map(users.map((u) => [String(u._id), u]));
  const jMap = new Map(jobs.map((j) => [String(j._id), j]));
  return payments.map((p) => {
    const u = uMap.get(String(p.userId));
    const j = jMap.get(String(p.jobId));
    return {
      ...p,
      customerName:   u?.name   || '',
      customerMobile: u?.mobile || '',
      customerEmail:  u?.email  || '',
      jobStatus:      j?.status || '',
      jobTitle:       j?.title  || '',
    };
  });
}

r.get('/payments', permGuard(PERMS.PAYMENT_READ), asyncHandler(async (req, res) => {
  const { status, country, currency, gateway, q, from, to, userId, jobId,
          page = 1, limit = 20, pageSize } = req.query;
  const lim = Math.min(Number(pageSize || limit) || 20, 100);
  const pg  = Number(page) || 1;

  const baseFilter = {};
  if (status)   baseFilter.status   = String(status);
  if (country)  baseFilter.country  = String(country).toUpperCase();
  if (currency) baseFilter.currency = String(currency).toUpperCase();
  if (gateway)  baseFilter.provider = String(gateway).toLowerCase();
  if (userId) { try { baseFilter.userId = new ObjectId(String(userId)); } catch {} }
  if (jobId)  { try { baseFilter.jobId  = new ObjectId(String(jobId));  } catch {} }
  if (from || to) {
    baseFilter.createdAt = {};
    if (from) baseFilter.createdAt.$gte = new Date(String(from));
    if (to)   baseFilter.createdAt.$lte = new Date(String(to));
  }
  if (q) {
    const needle = String(q).trim();
    baseFilter.$or = [
      { paymentId: needle },
      { orderId:   needle },
      // partial match for payment IDs (Razorpay/Stripe IDs are short enough)
      { paymentId: { $regex: needle, $options: 'i' } },
      { orderId:   { $regex: needle, $options: 'i' } },
    ];
  }
  // Country/role scope merged in. Note: super_admin's explicit ?country=
  // filter wins over scope (scope is {} for global). country_admin can't
  // widen via ?country=AE — applyScope's scope filter has the floor.
  const filter = applyScope(baseFilter, req);

  const [raw, total] = await Promise.all([
    paymentsCol().find(filter).sort({ createdAt: -1 }).skip((pg - 1) * lim).limit(lim).toArray(),
    paymentsCol().countDocuments(filter),
  ]);
  const payments = await hydratePayments(raw);
  res.json({ success: true, data: { payments, total, page: pg, limit: lim } });
}));

r.get('/payments/stats', permGuard(PERMS.PAYMENT_READ), asyncHandler(async (req, res) => {
  // KPIs grouped per currency so the dashboard can show "₹4.5M paid /
  // €12k paid / $3.2k paid" side by side instead of mixing currencies.
  // Cached 60s, keyed by scope so country admins see only their data.
  const scopeMode = req.scope?.mode || 'off';
  const scopeCountry = req.scope?.filter?.country || 'all';
  const cacheKey = `admin:payments:stats:${scopeMode}:${scopeCountry}`;
  const data = await getOrSet(cacheKey, async () => {
    const baseScope = applyScope({}, req);
    const paidScope = applyScope({ status: 'paid' }, req);
    const mockScope = applyScope({ mock: true }, req);
    const [byStatus, byCurrency, mockCount, gatewayBreakdown] = await Promise.all([
      paymentsCol().aggregate([
        { $match: baseScope },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]).toArray(),
      paymentsCol().aggregate([
        { $match: paidScope },
        { $group: { _id: '$currency', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]).toArray(),
      paymentsCol().countDocuments(mockScope),
      paymentsCol().aggregate([
        { $match: baseScope },
        { $group: { _id: '$provider', count: { $sum: 1 }, total: { $sum: '$amount' } } },
      ]).toArray(),
    ]);
    return {
      countsByStatus:   Object.fromEntries(byStatus.map((s) => [s._id || 'unknown', s.count])),
      paidByCurrency:   byCurrency.map((c) => ({ currency: c._id || 'INR', total: c.total, count: c.count })),
      mockPayments:     mockCount,
      gatewayBreakdown: gatewayBreakdown.map((g) => ({ gateway: g._id || 'unknown', count: g.count, total: g.total })),
    };
  }, 60);
  res.json({ success: true, data });
}));

r.get('/payments/:id', permGuard(PERMS.PAYMENT_READ), asyncHandler(async (req, res) => {
  let payment = null;
  try { payment = await paymentsCol().findOne({ _id: new ObjectId(req.params.id) }); } catch {}
  if (!payment) {
    // Fallback: support lookup by Razorpay/Stripe paymentId or orderId so the
    // admin can paste a `pay_xxx` / `order_xxx` directly into the URL.
    payment = await paymentsCol().findOne({
      $or: [{ paymentId: req.params.id }, { orderId: req.params.id }],
    });
  }
  if (!payment) throw new AppError('RESOURCE_NOT_FOUND', 'Payment not found', 404);
  // 404 (not 403) on cross-country payment access — don't leak existence.
  if (isOutOfScope(payment, req)) throw new AppError('RESOURCE_NOT_FOUND', 'Payment not found', 404);
  const [hydrated] = await hydratePayments([payment]);
  res.json({ success: true, data: hydrated });
}));

// Helper: load a booking by id, ensure caller's scope can touch it.
// Returns the booking or throws 404 (uses isOutOfScope so cross-country
// callers get the same error as a missing booking — no existence leak).
async function loadScopedBooking(req, idLike) {
  const id = toObjectId(idLike);
  const job = await jobsCol().findOne({ _id: id });
  if (!job) throw new AppError('RESOURCE_NOT_FOUND', 'Booking not found', 404);
  if (isOutOfScope(job, req)) throw new AppError('RESOURCE_NOT_FOUND', 'Booking not found', 404);
  return { id, job };
}

r.patch('/bookings/:id/confirm', permGuard(PERMS.BOOKING_WRITE), asyncHandler(async (req, res) => {
  const { id } = await loadScopedBooking(req, req.params.id);
  await jobsCol().updateOne({ _id: id }, { $set: { status: 'confirmed', updatedAt: new Date() } });
  const updated = await jobsCol().findOne({ _id: id });
  res.json({ success: true, data: updated });
}));

r.patch('/bookings/:id/reject', permGuard(PERMS.BOOKING_WRITE), asyncHandler(async (req, res) => {
  const { id } = await loadScopedBooking(req, req.params.id);
  await jobsCol().updateOne(
    { _id: id },
    { $set: { status: 'cancelled', cancelReason: req.body?.reason || '', updatedAt: new Date() } },
  );
  const updated = await jobsCol().findOne({ _id: id });
  res.json({ success: true, data: updated });
}));

r.post('/bookings/:id/confirm', permGuard(PERMS.BOOKING_WRITE), asyncHandler(async (req, res) => {
  const { id } = await loadScopedBooking(req, req.params.id);
  await jobsCol().updateOne({ _id: id }, { $set: { status: 'confirmed', updatedAt: new Date() } });
  const updated = await jobsCol().findOne({ _id: id });
  res.json({ success: true, data: updated });
}));

const assignSchema = z.object({ pmId: z.string().regex(/^[0-9a-f]{24}$/) });
r.post('/bookings/:id/assign-pm', permGuard(PERMS.BOOKING_WRITE), validate(assignSchema), asyncHandler(async (req, res) => {
  const pm = await usersCol().findOne({ _id: toObjectId(req.body.pmId, 'pmId'), role: 'pm' });
  if (!pm) throw new AppError('RESOURCE_NOT_FOUND', 'PM not found', 404);
  const { id, job } = await loadScopedBooking(req, req.params.id);
  // Block cross-country assignments: a country_admin (IN) can't assign
  // an AE-based PM to an IN booking. Super admin is unconstrained because
  // their scope filter is empty.
  if (job.country && pm.country && pm.country !== job.country && req.scope?.mode !== 'global' && req.scope?.mode !== 'global-leg') {
    throw new AppError('VALIDATION_ERROR', `PM is in ${pm.country} but booking is in ${job.country}`, 422);
  }
  // Strict hierarchy: country_admin can only assign PMs they themselves created
  // (parentCountryAdminId = self). Stops one country admin from poaching
  // another admin's PMs even within the same country.
  if (req.user?.role === 'country_admin'
      && pm.parentCountryAdminId
      && String(pm.parentCountryAdminId) !== String(req.user.id)) {
    throw new AppError('AUTH_FORBIDDEN', 'PM is not in your team', 403);
  }
  await jobsCol().updateOne(
    { _id: id },
    { $set: { pmId: pm._id, projectManager: { _id: pm._id, name: pm.name, mobile: pm.mobile }, status: 'assigned_to_pm', updatedAt: new Date() } },
  );
  const updated = await jobsCol().findOne({ _id: id });
  recordAudit(req, {
    action: 'BOOKING_ASSIGNED_PM',
    resourceType: 'booking',
    resourceId: String(id),
    country: job.country,
    before: { pmId: job.pmId ? String(job.pmId) : null, status: job.status },
    after:  { pmId: String(pm._id), status: 'assigned_to_pm' },
  });
  // Real-time socket events
  try {
    const { emitTo } = await import('../../socket/index.js');
    emitTo(`user_${pm._id}`, 'booking:assigned', { bookingId: String(id) });
    if (updated?.userId) {
      emitTo(`user_${updated.userId}`, 'booking:status', { bookingId: String(id), status: 'assigned_to_pm' });
    }
    emitTo('role_admin', 'booking:assigned', { bookingId: String(id), pmId: String(pm._id) });
  } catch {}
  // Notify the assigned PM and the customer
  try {
    const { enqueueNotification } = await import('../notification/notification.service.js');
    enqueueNotification({
      userId: String(pm._id), type: 'booking_assigned',
      title: 'New booking assigned',
      body: `You have been assigned booking ${String(id).slice(-8)}.`,
      data: { bookingId: String(id) },
    }).catch(() => {});
    if (updated?.userId) {
      enqueueNotification({
        userId: String(updated.userId), type: 'booking_assigned',
        title: 'Project Manager assigned',
        body: `${pm.name || 'A project manager'} has been assigned to your booking.`,
        data: { bookingId: String(id) },
      }).catch(() => {});
    }
  } catch {}
  res.json({ success: true, data: updated });
}));

const assignResSchema = z.object({
  resourceId: z.string().regex(/^[0-9a-f]{24}$/),
  jobId: z.string().optional(),
});
r.post('/bookings/:id/assign-resource', permGuard(PERMS.BOOKING_WRITE), validate(assignResSchema), asyncHandler(async (req, res) => {
  const resource = await usersCol().findOne({ _id: toObjectId(req.body.resourceId, 'resourceId'), role: 'resource' });
  if (!resource) throw new AppError('RESOURCE_NOT_FOUND', 'Resource not found', 404);
  const { id, job } = await loadScopedBooking(req, req.params.id);
  if (job.country && resource.country && resource.country !== job.country && req.scope?.mode !== 'global' && req.scope?.mode !== 'global-leg') {
    throw new AppError('VALIDATION_ERROR', `Resource is in ${resource.country} but booking is in ${job.country}`, 422);
  }
  // Strict hierarchy enforcement at assignment time:
  //   pm role         → resource.pmId must equal self
  //   country_admin   → resource's PM must be one of THEIR PMs
  if (req.user?.role === 'pm'
      && resource.pmId
      && String(resource.pmId) !== String(req.user.id)) {
    throw new AppError('AUTH_FORBIDDEN', 'Resource is not in your roster', 403);
  }
  if (req.user?.role === 'country_admin' && resource.pmId) {
    const pmDoc = await usersCol().findOne(
      { _id: resource.pmId, role: 'pm' },
      { projection: { parentCountryAdminId: 1 } },
    );
    if (pmDoc?.parentCountryAdminId
        && String(pmDoc.parentCountryAdminId) !== String(req.user.id)) {
      throw new AppError('AUTH_FORBIDDEN', "Resource belongs to another admin's PM", 403);
    }
  }

  // Prevent double-booking: reject if resource already has an active assignment.
  const ACTIVE_STATUSES = ['assigned_to_pm', 'in_progress', 'paused'];
  const conflict = await jobsCol().findOne({
    resourceId: resource._id,
    status: { $in: ACTIVE_STATUSES },
    _id: { $ne: id }, // allow re-assigning the same booking to the same resource
  });
  if (conflict) {
    throw new AppError('RESOURCE_CONFLICT', `Resource is already assigned to an active booking (${String(conflict._id).slice(-8)})`, 409);
  }

  // Do NOT force in_progress — status stays at its current value; the PM starts work explicitly.
  await jobsCol().updateOne(
    { _id: id },
    { $set: { resourceId: resource._id, assignedResource: { _id: resource._id, name: resource.name, mobile: resource.mobile }, updatedAt: new Date() } },
  );
  const updated = await jobsCol().findOne({ _id: id });
  recordAudit(req, {
    action: 'BOOKING_ASSIGNED_RESOURCE',
    resourceType: 'booking',
    resourceId: String(id),
    country: job.country,
    before: { resourceId: job.resourceId ? String(job.resourceId) : null },
    after:  { resourceId: String(resource._id) },
  });
  // Notify resource
  try {
    const { enqueueNotification } = await import('../notification/notification.service.js');
    enqueueNotification({
      userId: String(resource._id), type: 'assignment',
      title: 'New assignment', body: `You have been assigned to booking ${String(id).slice(-8)}.`,
      data: { bookingId: String(id) },
    }).catch(() => {});
  } catch {}
  res.json({ success: true, data: updated });
}));

r.patch('/users/:id/status', permGuard(PERMS.USER_WRITE), validate(z.object({
  status: z.enum(['active', 'suspended']),
})), asyncHandler(async (req, res) => {
  await usersCol().updateOne(
    { _id: new ObjectId(req.params.id) },
    { $set: { 'meta.status': req.body.status, updatedAt: new Date() } },
  );
  res.json({ success: true });
}));

r.get('/users', asyncHandler(async (req, res) => {
  const p = paginate(req.query);
  const baseFilter = {};
  if (req.query.role) {
    // FE uses role=customer; backend stores role='user'
    baseFilter.role = req.query.role === 'customer' ? 'user' : req.query.role;
  }
  // Scope-aware: country_admin sees only users in their country (PMs/Resources
  // and any customer with country set). Super admin sees all.
  const filter = applyScope(baseFilter, req);
  const [items, total] = await Promise.all([
    usersCol().find(filter).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit).toArray(),
    usersCol().countDocuments(filter),
  ]);
  res.json({ success: true, data: items, meta: buildMeta({ page: p.page, pageSize: p.pageSize, total }) });
}));

r.get('/availability', asyncHandler(async (req, res) => {
  const duration = Number(req.query.duration) || 8;
  // Stub: in production this would compute against bookings + resource availability
  const slots = [];
  const base = new Date();
  base.setHours(9, 0, 0, 0);
  for (let d = 0; d < 7; d++) {
    for (let h = 9; h <= 17 - duration; h += duration) {
      const start = new Date(base);
      start.setDate(start.getDate() + d);
      start.setHours(h, 0, 0, 0);
      slots.push(start.toISOString());
    }
  }
  res.json({ success: true, data: { duration, slots } });
}));

/* ─────────────────────────────────────────────────────────────
 * Admin: Services CRUD (lenient schema, accepts FE payload)
 * ───────────────────────────────────────────────────────────── */

const slugify = (s = '') =>
  String(s)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

// i18n string schema — accepts either a plain string (incl. empty) or a
// multi-locale object. Empty strings are permitted because the customer-facing
// service.routes.js projectForCountry() will substitute name/description from
// the i18n object and falls back to the English value or skips empty fields.
//
// SCHEMA_ACCEPT_EMPTY_FIX_V1: removed .min(1) from the string branch so that
// editing a service that had no tagline (sent as '') no longer 422s.
const I18nStringSchema = z.union([
  z.string().max(2000),
  z.object({
    en:      z.string().optional(),
    hi:      z.string().optional(),
    ar:      z.string().optional(),
    de:      z.string().optional(),
    es:      z.string().optional(),
    fr:      z.string().optional(),
    ja:      z.string().optional(),
    'zh-CN': z.string().optional(),
  }),
]);

// Technology schema — supports both legacy plain strings and rich i18n objects
// (stored as { name, en, hi, ... }).  The customer-facing axios interceptor
// (flattenI18nDeep) converts the rich form to a locale string automatically.
const TechItemSchema = z.union([
  z.string().max(100),
  z.object({
    name:    z.string().optional(),
    en:      z.string().optional(),
    hi:      z.string().optional(),
    ar:      z.string().optional(),
    de:      z.string().optional(),
    es:      z.string().optional(),
    fr:      z.string().optional(),
    ja:      z.string().optional(),
    'zh-CN': z.string().optional(),
  }),
]);

// Only explicitly listed fields reach MongoDB — prevents injection of
// computed fields like role, meta.status, etc.
const serviceSchema = z.object({
  name:         I18nStringSchema,
  category:     z.string().max(100).optional().default(''),
  description:  I18nStringSchema.optional().default(''),
  // SERVICE_TAGLINE_V1: short one-liner shown on customer service cards
  // (homepage Bookresourceservices grid) and as a sub-heading. Multi-locale.
  tagline:      I18nStringSchema.optional().default(''),
  technologies: z.array(TechItemSchema).optional().default([]),
  // Admins can now write notIncluded entries per-language (same i18n shape as
  // service name/description). Plain strings remain accepted for backwards
  // compatibility with any older payloads or external imports.
  notIncluded:  z.array(I18nStringSchema).optional().default([]),
  hourlyRate:   z.union([z.number(), z.string()]).transform((v) => Number(v) || 0),
  // imageUrl accepts: empty string, an absolute URL (https://…), OR a
  // site-relative path (/foo.svg, /uploads/…). The strict .url() check
  // was rejecting relative paths the admin uploader returns by default.
  imageUrl:     z.string()
    .refine(
      (v) => v === '' || /^https?:\/\//i.test(v) || v.startsWith('/'),
      { message: 'Must be a URL (https://…) or a site-relative path (/…)' },
    )
    .optional()
    .default(''),
  // FAQ question/answer can each be a plain string (legacy) or an i18n
  // object so admins can localise FAQs alongside name/description.
  faqs:         z.array(z.object({
    question: I18nStringSchema,
    answer:   I18nStringSchema,
  })).optional().default([]),
  // SERVICE_CMS_SECTIONS_V1: per-service overrides for the static sections of
  // the customer-facing /service-details page. All optional — if a service
  // leaves them empty the components fall back to the platform defaults
  // shipped in messages/{locale}.json. Each text field is i18n-shaped so
  // translations live alongside name/description/tagline.
  features: z.array(z.object({
    icon:  z.string().optional().default(''),  // optional URL or emoji
    label: I18nStringSchema,
  })).optional().default([]),
  processSteps: z.array(z.object({
    title:       I18nStringSchema,
    description: I18nStringSchema,
  })).optional().default([]),
  promises:     z.array(I18nStringSchema).optional().default([]),
  workingHours: I18nStringSchema.optional().default(''),
  transparentTitle:    I18nStringSchema.optional().default(''),
  transparentSubtitle: I18nStringSchema.optional().default(''),
  active:       z.boolean().optional(),
  availability: z.record(z.unknown()).optional(),
});

// Helper: resolve the English string from a name/description value that
// may be either a plain string or a multi-locale object.
const toEnglish = (v) => {
  if (!v) return '';
  if (typeof v === 'string') return v;
  return v.en || Object.values(v).find(Boolean) || '';
};

r.get('/services', asyncHandler(async (req, res) => {
  // Servicing the catalog admin: paginated, searchable, filterable.
  // The previous handler returned every service in one shot which would
  // have collapsed once the catalog grew past a few hundred entries — and
  // the FE silently dropped any rows beyond the rendered page anyway.
  const p = paginate(req.query);
  const filter = {};
  if (req.query.active === 'true')  filter.active = true;
  if (req.query.active === 'false') filter.active = false;
  if (req.query.category) filter.category = String(req.query.category);

  // Search across English name, slug, and any localised name variant.
  // Service `name` is stored as either a string or an i18n object — match
  // the regex in `name` (string case) or any of `name.en`, `name.de`, …
  // (i18n-object case) via $or expansion.
  const q = String(req.query.q || '').trim();
  if (q) {
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(safe, 'i');
    filter.$or = [
      { name: re },
      { slug: re },
      { 'name.en': re }, { 'name.hi': re }, { 'name.de': re },
      { 'name.ar': re }, { 'name.es': re },
    ];
  }

  const [items, total] = await Promise.all([
    servicesCol().find(filter).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit).toArray(),
    servicesCol().countDocuments(filter),
  ]);
  res.json({ success: true, data: items, meta: buildMeta({ page: p.page, pageSize: p.pageSize, total }) });
}));

r.get('/services/categories', asyncHandler(async (_req, res) => {
  res.json({ success: true, data: [] });
}));

r.get('/services/:id', asyncHandler(async (req, res) => {
  const svc = await servicesCol().findOne({ _id: toObjectId(req.params.id) });
  if (!svc) throw new AppError('RESOURCE_NOT_FOUND', 'Service not found', 404);
  res.json({ success: true, data: svc });
}));

r.post('/services', permGuard(PERMS.SERVICE_WRITE), validate(serviceSchema), asyncHandler(async (req, res) => {
  const body = req.body;
  const nameEn = toEnglish(body.name);
  const slug = slugify(nameEn) + '-' + Math.random().toString(36).slice(2, 7);
  const doc = {
    slug,
    name:         body.name,          // i18n object or plain string
    title:        nameEn,             // always a plain English string (legacy compat)
    category:     body.category || '',
    description:  body.description || '',
    tagline:      body.tagline || '',
    technologies: body.technologies || [],
    notIncluded:  body.notIncluded || [],
    hourlyRate:   Number(body.hourlyRate) || 0,
    pricing:      { hourly: Number(body.hourlyRate) || 0, currency: 'INR' },
    imageUrl:     body.imageUrl || '',
    image:        body.imageUrl || '',
    faqs:         body.faqs || [],
    // CMS sections — persist exactly what admin sent so customer-facing
    // flattenI18nDeep can pick the right locale at read time.
    features:            body.features            || [],
    processSteps:        body.processSteps        || [],
    promises:            body.promises            || [],
    workingHours:        body.workingHours        || '',
    transparentTitle:    body.transparentTitle    || '',
    transparentSubtitle: body.transparentSubtitle || '',
    availability: body.availability || {},
    active:       body.active !== undefined ? body.active : true,
    createdAt:    new Date(),
    updatedAt:    new Date(),
  };
  const ins = await servicesCol().insertOne(doc);
  await invalidateServicesCache();
  res.status(201).json({ success: true, data: { _id: ins.insertedId, ...doc } });
}));

r.put('/services/:id', permGuard(PERMS.SERVICE_WRITE), validate(serviceSchema.partial()), asyncHandler(async (req, res) => {
  const id = toObjectId(req.params.id);
  const body = req.body;
  const $set = { updatedAt: new Date() };
  if (body.name !== undefined) {
    $set.name  = body.name;
    $set.title = toEnglish(body.name);
  }
  if (body.category     !== undefined) $set.category     = body.category;
  if (body.description  !== undefined) $set.description  = body.description;
  if (body.tagline      !== undefined) $set.tagline      = body.tagline;
  if (body.technologies !== undefined) $set.technologies = body.technologies;
  if (body.notIncluded  !== undefined) $set.notIncluded  = body.notIncluded;
  if (body.hourlyRate   !== undefined) {
    $set.hourlyRate = Number(body.hourlyRate) || 0;
    $set.pricing    = { hourly: Number(body.hourlyRate) || 0, currency: 'INR' };
  }
  if (body.imageUrl !== undefined) { $set.imageUrl = body.imageUrl; $set.image = body.imageUrl; }
  if (body.faqs     !== undefined) $set.faqs     = body.faqs;
  // CMS sections (per-service overrides for the static service-details page)
  if (body.features            !== undefined) $set.features            = body.features;
  if (body.processSteps        !== undefined) $set.processSteps        = body.processSteps;
  if (body.promises            !== undefined) $set.promises            = body.promises;
  if (body.workingHours        !== undefined) $set.workingHours        = body.workingHours;
  if (body.transparentTitle    !== undefined) $set.transparentTitle    = body.transparentTitle;
  if (body.transparentSubtitle !== undefined) $set.transparentSubtitle = body.transparentSubtitle;
  if (body.active   !== undefined) $set.active   = body.active;
  if (body.availability !== undefined) $set.availability = body.availability;
  await servicesCol().updateOne({ _id: id }, { $set });
  await invalidateServicesCache(req.params.id);
  const updated = await servicesCol().findOne({ _id: id });
  res.json({ success: true, data: updated });
}));

r.delete('/services/:id', permGuard(PERMS.SERVICE_WRITE), asyncHandler(async (req, res) => {
  const id = toObjectId(req.params.id);
  // Soft-delete: keep historical references intact, hide from public list.
  await servicesCol().updateOne(
    { _id: id },
    { $set: { active: false, deletedAt: new Date(), updatedAt: new Date() } },
  );
  await invalidateServicesCache(req.params.id);
  res.json({ success: true });
}));

/* ─────────────────────────────────────────────────────────────
 * Admin: PMs / Resources CRUD (creates users with role)
 * ───────────────────────────────────────────────────────────── */
// Strict schema — no passthrough(). Prevents injecting computed fields like `role`
// or `meta.status` directly into the users collection via admin staff create/update.
// PM creation requires a parent country_admin so the routing tree is
// always intact — every PM rolls up to a country_admin → country.
// Resource creation requires a parent PM so booking assignments stay
// within the (admin → PM → resource) chain.
const pmSchema = z.object({
  name: z.string().min(2).max(200),
  mobile: z.string().regex(/^\d{10}$/, 'mobile must be 10 digits'),
  email: z.string().email().optional().or(z.literal('')).default(''),
  specialization: z.array(z.string().max(100)).optional().default([]),
  skills: z.array(z.string().max(100)).optional().default([]),
  parentCountryAdminId: z.string().regex(/^[0-9a-f]{24}$/).optional(),
  country: z.string().length(2).optional(),    // super_admin override
}).strict();
const resourceSchema = z.object({
  name: z.string().min(2).max(200),
  mobile: z.string().regex(/^\d{10}$/, 'mobile must be 10 digits'),
  email: z.string().email().optional().or(z.literal('')).default(''),
  specialization: z.array(z.string().max(100)).optional().default([]),
  skills: z.array(z.string().max(100)).optional().default([]),
  pmId: z.string().regex(/^[0-9a-f]{24}$/).optional(),
  country: z.string().length(2).optional(),
}).strict();
const SCHEMA_BY_ROLE = { pm: pmSchema, resource: resourceSchema };

const makeStaffRoutes = (role, basePath) => {
  const staffSchema = SCHEMA_BY_ROLE[role];
  r.get(basePath, asyncHandler(async (req, res) => {
    const p = paginate(req.query);
    const baseFilter = { role, deletedAt: { $exists: false } };

    // Free-text search across name / mobile / email for the PM and
    // Resource directories. With staffing fleets in the thousands the
    // admin needs to find a single record without paginating.
    const q = String(req.query.q || '').trim();
    if (q) {
      const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(safe, 'i');
      baseFilter.$or = [{ name: re }, { mobile: re }, { email: re }];
    }
    // Country scope: country_admin sees only their country's PMs/Resources.
    const filter = applyScope(baseFilter, req);

    const [items, total] = await Promise.all([
      usersCol().find(filter).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit).toArray(),
      usersCol().countDocuments(filter),
    ]);
    res.json({ success: true, data: items, meta: buildMeta({ page: p.page, pageSize: p.pageSize, total }) });
  }));

  r.get(`${basePath}/:id`, asyncHandler(async (req, res) => {
    const u = await usersCol().findOne({ _id: toObjectId(req.params.id), role });
    if (!u) throw new AppError('RESOURCE_NOT_FOUND', `${role} not found`, 404);
    // Cross-country: 404 (not 403) — don't leak that the user exists.
    if (isOutOfScope(u, req)) throw new AppError('RESOURCE_NOT_FOUND', `${role} not found`, 404);
    res.json({ success: true, data: u });
  }));

  r.post(basePath, permGuard(PERMS.POOL_WRITE), validate(staffSchema), asyncHandler(async (req, res) => {
    const exists = await usersCol().findOne({ mobile: req.body.mobile });
    if (exists) throw new AppError('RESOURCE_CONFLICT', 'User with this mobile already exists', 409);
    const now = new Date();
    const scopeCountry = req.scope?.filter?.country;
    const requestedCountry = req.body.country
      ? String(req.body.country).toUpperCase()
      : null;

    let parentCountryAdminId = null;
    let pmId = null;
    let country = scopeCountry || requestedCountry || null;
    let parentName = null;

    if (role === 'pm') {
      // PM must roll up to a country_admin. country_admin creating a PM
      // auto-uses themselves as the parent; super_admin must specify.
      if (req.user.role === 'country_admin') {
        parentCountryAdminId = req.user.id;
        country = req.user.country || country;
      } else if (req.body.parentCountryAdminId) {
        const parent = await usersCol().findOne({
          _id: toObjectId(req.body.parentCountryAdminId, 'parentCountryAdminId'),
          role: 'country_admin',
        });
        if (!parent) throw new AppError('VALIDATION_ERROR', 'Parent country_admin not found', 422);
        parentCountryAdminId = String(parent._id);
        // Country must be one the parent admin manages.
        const managed = parent.managedCountries || [parent.country].filter(Boolean);
        const desired = requestedCountry || managed[0];
        if (!managed.includes(desired)) {
          throw new AppError('VALIDATION_ERROR', `Country ${desired} not in parent admin's managedCountries`, 422);
        }
        country = desired;
        parentName = parent.name;
      } else {
        throw new AppError('VALIDATION_ERROR', 'parentCountryAdminId required for PM', 422);
      }
    }

    if (role === 'resource') {
      // Resource must roll up to a PM. PM creating a resource auto-uses
      // themselves; admin/country_admin/super_admin specify pmId.
      const sourcePmId = req.user.role === 'pm' ? req.user.id : req.body.pmId;
      if (!sourcePmId) throw new AppError('VALIDATION_ERROR', 'pmId required for resource', 422);
      const pm = await usersCol().findOne({
        _id: toObjectId(sourcePmId, 'pmId'),
        role: 'pm',
        deletedAt: { $exists: false },
      });
      if (!pm) throw new AppError('VALIDATION_ERROR', 'Parent PM not found', 422);
      // country_admin can only attach to PMs they own.
      if (req.user.role === 'country_admin' && pm.country !== req.user.country) {
        throw new AppError('FORBIDDEN', 'Cannot attach resource to a PM in a different country', 403);
      }
      pmId = String(pm._id);
      parentCountryAdminId = pm.parentCountryAdminId
        ? String(pm.parentCountryAdminId)
        : null;
      country = pm.country;
      parentName = pm.name;
    }

    const doc = {
      role,
      name: req.body.name,
      mobile: req.body.mobile,
      email: req.body.email || '',
      specialization: req.body.specialization || [],
      skills: req.body.skills || [],
      country,
      ...(parentCountryAdminId ? { parentCountryAdminId } : {}),
      ...(pmId ? { pmId } : {}),
      meta: { isProfileComplete: true, status: 'active' },
      createdAt: now,
      updatedAt: now,
    };
    const ins = await usersCol().insertOne(doc);
    recordAudit(req, {
      action: role === 'pm' ? 'PM_CREATED' : 'RESOURCE_CREATED',
      resourceType: 'user', resourceId: String(ins.insertedId),
      country,
      after: { mobile: req.body.mobile, parentCountryAdminId, pmId, country, parentName },
    });
    res.status(201).json({ success: true, data: { _id: ins.insertedId, ...doc } });
  }));

  r.put(`${basePath}/:id`, permGuard(PERMS.POOL_WRITE), validate(staffSchema.partial()), asyncHandler(async (req, res) => {
    const id = toObjectId(req.params.id);
    const $set = { updatedAt: new Date() };
    for (const k of ['name', 'mobile', 'email', 'specialization', 'skills']) {
      if (req.body[k] !== undefined) $set[k] = req.body[k];
    }
    await usersCol().updateOne({ _id: id, role }, { $set });
    const updated = await usersCol().findOne({ _id: id });
    res.json({ success: true, data: updated });
  }));

  r.delete(`${basePath}/:id`, permGuard(PERMS.POOL_WRITE), asyncHandler(async (req, res) => {
    // Soft-delete: keep historical assignments intact.
    await usersCol().updateOne(
      { _id: toObjectId(req.params.id), role },
      { $set: { deletedAt: new Date(), 'meta.status': 'deleted', updatedAt: new Date() } },
    );
    res.json({ success: true });
  }));
};

makeStaffRoutes('pm', '/pms');
makeStaffRoutes('resource', '/resources');

/* ─────────────────────────────────────────────────────────────
 * Country Admin lifecycle (super_admin only)
 *
 * Reuses the same shape as /pms and /resources but with stricter
 * permissions: only super_admin can create / activate / deactivate
 * country admins. Listing is already covered by /admin/users?role=country_admin
 * (gated by USER_READ which includes super_admin).
 * ───────────────────────────────────────────────────────────── */
// Sourced from country.config.js (imported at top of file) — flipping a
// country's `active: true` there is the only change needed to expand the
// supported list.
const VALID_COUNTRIES = ACTIVE_COUNTRY_CODES;

// Multi-country support: a single country_admin can be granted access
// to several countries (e.g. an APAC admin handling AU+IN). The first
// element of managedCountries seeds the user's primary `country` field
// because country-scope middleware reads from there for "default" view.
const countryAdminSchema = z.object({
  name: z.string().min(2).max(100),
  mobile: z.string().regex(/^\+?\d{10,15}$/, 'mobile must be 10–15 digits, optional + prefix'),
  email: z.string().email().optional().or(z.literal('')).default(''),
  managedCountries: z.array(z.enum(VALID_COUNTRIES)).min(1).max(VALID_COUNTRIES.length),
}).strict();

r.post('/country-admins', permGuard(PERMS.COUNTRY_ADMIN_WRITE), validate(countryAdminSchema), asyncHandler(async (req, res) => {
  const { name, mobile, email, managedCountries } = req.body;
  const existing = await usersCol().findOne({ mobile, role: 'country_admin' });
  if (existing) throw new AppError('RESOURCE_CONFLICT', 'Country admin with this mobile already exists', 409);
  const now = new Date();
  const doc = {
    role: 'country_admin',
    country: managedCountries[0],     // primary country drives default scope
    name,
    mobile,
    email: email || '',
    managedCountries,
    parentCountryAdminId: req.user.id, // back-ref to the super_admin who created
    meta: { isProfileComplete: true, status: 'active' },
    createdAt: now,
    updatedAt: now,
  };
  const ins = await usersCol().insertOne(doc);
  recordAudit(req, {
    action: 'COUNTRY_ADMIN_CREATED',
    resourceType: 'user', resourceId: String(ins.insertedId),
    after: { mobile, managedCountries, name },
  });
  res.status(201).json({ success: true, data: { _id: ins.insertedId, ...doc } });
}));

// List all country admins. Super_admin sees everyone; country_admin
// only sees themselves (so they can't enumerate peers).
r.get('/country-admins', permGuard(PERMS.USER_READ), asyncHandler(async (req, res) => {
  const filter = { role: 'country_admin' };
  if (req.user.role === 'country_admin') filter._id = new ObjectId(req.user.id);
  const items = await usersCol().find(filter)
    .project({ name: 1, mobile: 1, email: 1, country: 1, managedCountries: 1, meta: 1, createdAt: 1, deletedAt: 1 })
    .sort({ createdAt: -1 })
    .toArray();
  res.json({ success: true, data: items });
}));

// Patch — rename, swap email, change managed countries. Mobile is
// immutable because it's the login identity; use a separate endpoint
// if rotation is ever needed.
const countryAdminPatchSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional().or(z.literal('')),
  managedCountries: z.array(z.enum(VALID_COUNTRIES)).min(1).optional(),
}).strict();

r.patch('/country-admins/:id', permGuard(PERMS.COUNTRY_ADMIN_WRITE), validate(countryAdminPatchSchema), asyncHandler(async (req, res) => {
  const id = toObjectId(req.params.id, 'id');
  const before = await usersCol().findOne({ _id: id, role: 'country_admin' });
  if (!before) throw new AppError('RESOURCE_NOT_FOUND', 'Country admin not found', 404);
  const update = { updatedAt: new Date() };
  if (req.body.name) update.name = req.body.name;
  if (req.body.email !== undefined) update.email = req.body.email;
  if (req.body.managedCountries) {
    update.managedCountries = req.body.managedCountries;
    update.country = req.body.managedCountries[0];   // primary follows the array head
  }
  await usersCol().updateOne({ _id: id }, { $set: update });
  recordAudit(req, {
    action: 'COUNTRY_ADMIN_UPDATED',
    resourceType: 'user', resourceId: String(id),
    before: { name: before.name, email: before.email, managedCountries: before.managedCountries },
    after:  update,
  });
  res.json({ success: true });
}));

// Soft-deactivate — sets meta.status='deactivated'. Existing JWTs
// stay valid until expiry; the auth middleware checks status on every
// request and rejects deactivated users with 401.
r.post('/country-admins/:id/deactivate', permGuard(PERMS.COUNTRY_ADMIN_WRITE), asyncHandler(async (req, res) => {
  const id = toObjectId(req.params.id, 'id');
  await usersCol().updateOne(
    { _id: id, role: 'country_admin' },
    { $set: { 'meta.status': 'deactivated', deactivatedAt: new Date(), updatedAt: new Date() } },
  );
  // Hard-revoke all live sessions so they're booted out immediately.
  await getDualDb().collection('sessions').updateMany(
    { userId: id }, { $set: { revoked: true, updatedAt: new Date() } },
  );
  recordAudit(req, {
    action: 'COUNTRY_ADMIN_DEACTIVATED',
    resourceType: 'user', resourceId: String(id),
    after: { status: 'deactivated' },
  });
  res.json({ success: true });
}));

r.post('/country-admins/:id/reactivate', permGuard(PERMS.COUNTRY_ADMIN_WRITE), asyncHandler(async (req, res) => {
  const id = toObjectId(req.params.id, 'id');
  await usersCol().updateOne(
    { _id: id, role: 'country_admin' },
    { $set: { 'meta.status': 'active', updatedAt: new Date() }, $unset: { deactivatedAt: '' } },
  );
  recordAudit(req, {
    action: 'COUNTRY_ADMIN_REACTIVATED',
    resourceType: 'user', resourceId: String(id),
    after: { status: 'active' },
  });
  res.json({ success: true });
}));

// Trigger an OTP send for a country_admin's mobile — useful when they
// say "I never got my login OTP". Doesn't actually log them in; just
// re-runs the OTP flow on their behalf.
r.post('/country-admins/:id/resend-login', permGuard(PERMS.COUNTRY_ADMIN_WRITE), asyncHandler(async (req, res) => {
  const id = toObjectId(req.params.id, 'id');
  const user = await usersCol().findOne({ _id: id, role: 'country_admin' });
  if (!user) throw new AppError('RESOURCE_NOT_FOUND', 'Country admin not found', 404);
  const { sendOtp } = await import('../auth/auth.service.js');
  await sendOtp({ mobile: user.mobile, role: 'country_admin' });
  recordAudit(req, {
    action: 'COUNTRY_ADMIN_LOGIN_OTP_RESENT',
    resourceType: 'user', resourceId: String(id),
    after: { mobile: user.mobile },
  });
  res.json({ success: true, message: `OTP sent to ${user.mobile}` });
}));

/* ─────────────────────────────────────────────────────────────
 * Super Admin lifecycle (super_admin only — RBAC_WRITE perm)
 *
 * Used by /admin/super-admins frontend page. Lets the existing root
 * super_admin onboard additional super_admins (e.g. CTO, head of ops)
 * or demote a country_admin → admin if they leave the country role.
 *
 * Promote-existing flow: when `userId` is provided, upgrade that user's
 * role; otherwise create a new user with role=super_admin.
 * ───────────────────────────────────────────────────────────── */
const superAdminSchema = z.object({
  // When userId provided, we're promoting an existing user (any role).
  userId: z.string().regex(/^[0-9a-f]{24}$/).optional(),
  // Otherwise these create a new super_admin from scratch.
  name: z.string().min(2).max(100).optional(),
  mobile: z.string().regex(/^\+?\d{10,15}$/).optional(),
  email: z.string().email().optional().or(z.literal('')).default(''),
}).refine((v) => v.userId || (v.name && v.mobile), {
  message: 'Either userId (to promote) or name+mobile (to create) is required',
});

r.post('/super-admins', permGuard(PERMS.RBAC_WRITE), validate(superAdminSchema), asyncHandler(async (req, res) => {
  const { userId, name, mobile, email } = req.body;
  const now = new Date();

  // Promote existing user
  if (userId) {
    const target = await usersCol().findOne({ _id: toObjectId(userId, 'userId') });
    if (!target) throw new AppError('RESOURCE_NOT_FOUND', 'User not found', 404);
    await usersCol().updateOne(
      { _id: target._id },
      { $set: { role: 'super_admin', country: null, updatedAt: now },
        $push: { history: { at: now, actorId: req.user.id, event: 'role_promoted', from: target.role, to: 'super_admin' } } },
    );
    const updated = await usersCol().findOne({ _id: target._id });
    return res.status(200).json({ success: true, data: updated, action: 'promoted' });
  }

  // Create new super_admin
  const conflict = await usersCol().findOne({ mobile });
  if (conflict) throw new AppError('RESOURCE_CONFLICT', 'A user with this mobile already exists. Use userId to promote them.', 409);
  const doc = {
    role: 'super_admin',
    country: null,
    name,
    mobile,
    email: email || '',
    meta: { isProfileComplete: true, status: 'active' },
    createdAt: now,
    updatedAt: now,
  };
  const ins = await usersCol().insertOne(doc);
  res.status(201).json({ success: true, data: { _id: ins.insertedId, ...doc }, action: 'created' });
}));

/* ─────────────────────────────────────────────────────────────
 * Admin: Dashboard sub-routes used by FE
 * ───────────────────────────────────────────────────────────── */
// Dashboard endpoints run multiple aggregations + countDocuments and were
// re-running on every page load. At 1M-user scale this dominated read
// load on jobs/users/payments. Each handler now caches its payload in
// Redis with a TTL that matches how stale the data can reasonably be:
//   • stats        — 60s (counts changing minute by minute is fine)
//   • revenue      — 300s (month-aggregated; new month boundaries don't
//                          warrant per-page recomputation)
//   • recent-activity — 30s (needs to feel live but bursting page
//                            refreshes don't need fresh aggregates)
// Cache misses fall through to the original aggregation; misses are
// the first request after TTL expiry, then ~0 during the steady state.
r.get('/dashboard/stats', asyncHandler(async (req, res) => {
  const scopeMode = req.scope?.mode || 'off';
  const scopeCountry = req.scope?.filter?.country || 'all';
  const cacheKey = `admin:dashboard:stats:${scopeMode}:${scopeCountry}`;
  const data = await getOrSet(cacheKey, async () => {
    const userScope    = applyScope({ role: 'user' }, req);
    const jobAllScope  = applyScope({}, req);
    const pendingScope = applyScope({ status: { $in: ['pending', 'confirmed'] } }, req);
    const activeScope  = applyScope({ status: { $in: ['assigned_to_pm', 'in_progress'] } }, req);
    const pmScope      = applyScope({ role: 'pm' }, req);
    const resScope     = applyScope({ role: 'resource' }, req);
    const revScope     = applyScope({ status: { $nin: ['cancelled'] } }, req);
    const [
      totalCustomers, totalBookings, pendingBookings, activeJobs,
      totalPMs, totalResources, paidAgg,
    ] = await Promise.all([
      usersCol().countDocuments(userScope),
      jobsCol().countDocuments(jobAllScope),
      jobsCol().countDocuments(pendingScope),
      jobsCol().countDocuments(activeScope),
      usersCol().countDocuments(pmScope),
      usersCol().countDocuments(resScope),
      jobsCol().aggregate([
        { $match: revScope },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$pricing.total', 0] } } } },
      ]).toArray(),
    ]);
    return {
      totalBookings,
      pendingBookings,
      activeJobs,
      totalRevenue: paidAgg[0]?.total || 0,
      totalCustomers,
      totalPMs,
      totalResources,
    };
  }, 60);
  res.json({ success: true, data });
}));

r.get('/dashboard/revenue', asyncHandler(async (req, res) => {
  const scopeMode = req.scope?.mode || 'off';
  const scopeCountry = req.scope?.filter?.country || 'all';
  const cacheKey = `admin:dashboard:revenue:6m:${scopeMode}:${scopeCountry}`;
  const data = await getOrSet(cacheKey, async () => {
    const since = new Date(); since.setMonth(since.getMonth() - 6);
    const match = applyScope({ status: { $nin: ['cancelled'] }, createdAt: { $gte: since } }, req);
    const rows = await jobsCol().aggregate([
      { $match: match },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        revenue: { $sum: { $ifNull: ['$pricing.total', 0] } },
      }},
      { $sort: { _id: 1 } },
    ]).toArray();
    return rows.map((r2) => ({ month: r2._id, revenue: r2.revenue }));
  }, 300);
  res.json({ success: true, data });
}));

r.get('/dashboard/recent-activity', asyncHandler(async (req, res) => {
  // Cache key includes scope.mode so country admins don't see super_admin's
  // cached recent activity. (cache:30s).
  const cacheKey = `admin:dashboard:recent:${req.scope?.mode || 'off'}:${req.scope?.filter?.country || 'all'}`;
  const data = await getOrSet(cacheKey, async () => {
    const items = await jobsCol().find(applyScope({}, req)).sort({ createdAt: -1 }).limit(10).toArray();
    return await hydrateJobs(items);
  }, 30);
  res.json({ success: true, data });
}));

/* ─────────────────────────────────────────────────────────────
 * Admin: Payments page sources jobs
 * ───────────────────────────────────────────────────────────── */
r.get('/jobs', asyncHandler(async (req, res) => {
  const p = paginate(req.query);
  const items = await jobsCol().find(applyScope({}, req)).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit).toArray();
  const hydrated = await hydrateJobs(items);
  res.json({ success: true, data: hydrated });
}));

/* ─────────────────────────────────────────────────────────────
 * Admin: Tickets list (hydrated with customer name)
 * ───────────────────────────────────────────────────────────── */
r.get('/tickets', asyncHandler(async (req, res) => {
  const p = paginate(req.query);
  const filter = {};
  if (req.query.status)   filter.status   = String(req.query.status);
  if (req.query.priority) filter.priority = String(req.query.priority);

  // Free-text search across subject, ticket _id, and the full set of
  // hydrated user fields — but since name/email/mobile live on the users
  // collection we resolve them to userId filters separately and union.
  const q = String(req.query.q || '').trim();
  if (q) {
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(safe, 'i');
    const orParts = [{ subject: re }, { description: re }];
    if (/^[0-9a-f]{24}$/i.test(q)) {
      try { orParts.push({ _id: new ObjectId(q) }); } catch { /* ignore */ }
    }
    // Look up matching users by name / email / mobile and add them to the
    // OR. Bounded by limit(20) so a generic search doesn't pull half the
    // users collection into memory.
    const matchingUsers = await usersCol()
      .find({ $or: [{ name: re }, { mobile: re }, { email: re }] })
      .project({ _id: 1 })
      .limit(20)
      .toArray();
    if (matchingUsers.length) {
      orParts.push({ userId: { $in: matchingUsers.map((u) => u._id) } });
    }
    filter.$or = orParts;
  }

  const [items, total] = await Promise.all([
    ticketsCol().find(filter).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit).toArray(),
    ticketsCol().countDocuments(filter),
  ]);
  const userIds = [...new Set(items.map((t) => String(t.userId)).filter(Boolean))];
  const users = userIds.length
    ? await usersCol().find({ _id: { $in: userIds.map((x) => { try { return new ObjectId(x); } catch { return null; } }).filter(Boolean) } }).toArray()
    : [];
  const uMap = new Map(users.map((u) => [String(u._id), u]));
  const hydrated = items.map((t) => {
    const u = uMap.get(String(t.userId));
    return { ...t, customerName: u?.name || u?.mobile || 'N/A' };
  });
  res.json({ success: true, data: hydrated, meta: buildMeta({ page: p.page, pageSize: p.pageSize, total }) });
}));

r.get('/tickets/:id', asyncHandler(async (req, res) => {
  const t = await ticketsCol().findOne({ _id: toObjectId(req.params.id) });
  if (!t) throw new AppError('RESOURCE_NOT_FOUND', 'Ticket not found', 404);
  res.json({ success: true, data: t });
}));

r.patch('/tickets/:id/status', permGuard(PERMS.TICKET_WRITE), validate(z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
})), asyncHandler(async (req, res) => {
  const id = toObjectId(req.params.id);
  await ticketsCol().updateOne({ _id: id }, { $set: { status: req.body.status, updatedAt: new Date() } });
  const updated = await ticketsCol().findOne({ _id: id });
  res.json({ success: true, data: updated });
}));

// Scheduling config: slot capacity per slot + holiday list (YYYY-MM-DD).
r.get('/scheduling-config', asyncHandler(async (_req, res) => {
  const cfg = await getSchedulingConfig();
  res.json({ success: true, data: cfg });
}));

r.put('/scheduling-config', permGuard(PERMS.SCHEDULE_WRITE), validate(z.object({
  slotCapacity: z.number().int().min(1).max(1000).optional(),
  holidays: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
})), asyncHandler(async (req, res) => {
  const cfg = await setSchedulingConfig(req.body);
  res.json({ success: true, data: cfg });
}));

/* ─────────────────────────────────────────────────────────────
 * Admin: booking-scoped group chat (read + send as admin)
 * ───────────────────────────────────────────────────────────── */
const chatCol = () => getDualDb().collection('chat');
const bookingRoomId = (id) => `booking_${String(id)}`;

r.get('/bookings/:id/messages', asyncHandler(async (req, res) => {
  const id = toObjectId(req.params.id);
  const job = await jobsCol().findOne({ _id: id });
  if (!job) throw new AppError('RESOURCE_NOT_FOUND', 'Booking not found', 404);
  const items = await chatCol()
    .find({ roomId: bookingRoomId(id) })
    .sort({ createdAt: 1 }).limit(500).toArray();
  res.json({ success: true, data: items });
}));

r.post('/bookings/:id/messages',
  permGuard(PERMS.TICKET_WRITE),
  validate(z.object({ msg: z.string().min(1).max(5000) })),
  asyncHandler(async (req, res) => {
    const id = toObjectId(req.params.id);
    const job = await jobsCol().findOne({ _id: id });
    if (!job) throw new AppError('RESOURCE_NOT_FOUND', 'Booking not found', 404);
    const { emitTo } = await import('../../socket/index.js');
    const { enqueueNotification } = await import('../notification/notification.service.js');
    const roomId = bookingRoomId(id);
    const now = new Date();
    const doc = {
      roomId, bookingId: id,
      serviceId: job.services?.[0]?.serviceId || job.serviceId || null,
      senderId: new ObjectId(req.user.id),
      senderRole: 'admin',
      senderName: 'Admin',
      msg: req.body.msg,
      msgType: 0,
      attachment: null,
      createdAt: now,
    };
    const ins = await chatCol().insertOne(doc);
    const message = { ...doc, _id: ins.insertedId };
    try { emitTo(roomId, 'new-message', message); } catch {}
    // CHAT_FANOUT_FIX_V1: push to participant personal rooms so clients receive
    // the message even if they haven't joined booking_<id> (covers cases where
    // the global SocketProvider reconnect clobbered the ChatPanel room join).
    [job.userId, job.pmId, job.resourceId].filter(Boolean).map(String).forEach((uid) => {
      try { emitTo(`user_${uid}`, 'message:new', message); } catch {}
      enqueueNotification({
        userId: uid, type: 'chat_message',
        title: 'Admin message', body: req.body.msg.slice(0, 120),
        data: { bookingId: String(id) },
      }).catch(() => {});
    });
    res.status(201).json({ success: true, data: message });
  }),
);

/* Admin: ticket detail + messages (chat) */
r.get('/tickets/:id/detail', asyncHandler(async (req, res) => {
  const ticketId = toObjectId(req.params.id);
  const ticket = await ticketsCol().findOne({ _id: ticketId });
  if (!ticket) throw new AppError('RESOURCE_NOT_FOUND', 'Ticket not found', 404);
  const messagesCol = getDualDb().collection('ticket_messages');
  const messages = await messagesCol.find({ ticketId }).sort({ createdAt: 1 }).toArray();
  let user = null;
  try { user = await usersCol().findOne({ _id: ticket.userId }, { projection: { name: 1, mobile: 1, email: 1 } }); } catch {}
  res.json({ success: true, data: { ticket: { ...ticket, customerName: user?.name || user?.mobile || 'N/A', customerMobile: user?.mobile || '' }, messages } });
}));

r.post('/tickets/:id/message',
  permGuard(PERMS.TICKET_WRITE),
  validate(z.object({ msg: z.string().min(1).max(5000) })),
  asyncHandler(async (req, res) => {
    const ticketId = toObjectId(req.params.id);
    const ticket = await ticketsCol().findOne({ _id: ticketId });
    if (!ticket) throw new AppError('RESOURCE_NOT_FOUND', 'Ticket not found', 404);
    const messagesCol = getDualDb().collection('ticket_messages');
    const doc = {
      ticketId,
      senderId: new ObjectId(req.user.id),
      senderRole: 'admin',
      msg: req.body.msg,
      createdAt: new Date(),
    };
    const ins = await messagesCol.insertOne(doc);
    const message = { _id: ins.insertedId, ...doc };
    const { emitTo } = await import('../../socket/index.js');
    const { enqueueNotification } = await import('../notification/notification.service.js');
    try { emitTo(`ticket_${req.params.id}`, 'message:new', message); } catch {}
    if (ticket.userId) enqueueNotification({
      userId: String(ticket.userId), type: 'ticket_message',
      title: 'Support replied', body: req.body.msg.slice(0, 120),
      data: { ticketId: String(ticketId) },
    }).catch(() => {});
    res.status(201).json({ success: true, data: message });
  }),
);

/* Admin: PM/Resource list aliases used by FE pickers */
// Dropdowns used in "Assign PM / Assign Resource" UIs. Strict hierarchy:
//   super_admin     → all PMs / all resources
//   country_admin   → only PMs created BY them (parentCountryAdminId = self)
//                     and resources whose PM is in that set
//   pm              → only THEIR resources (pmId = self)
// This makes the dropdown match the assignment endpoints' guard: a country_admin
// in IN literally cannot pick an AE PM by mistake.
r.get('/pms-list', asyncHandler(async (req, res) => {
  const baseFilter = { role: 'pm', deletedAt: { $exists: false } };
  // Optional country query filter for super_admin: ?country=DE
  if (req.query.country) baseFilter.country = String(req.query.country).toUpperCase();
  if (req.user?.role === 'country_admin') {
    baseFilter.parentCountryAdminId = new ObjectId(req.user.id);
  }
  const filter = applyScope(baseFilter, req);
  const items = await usersCol().find(
    filter,
    { projection: { name: 1, mobile: 1, email: 1, specialization: 1, country: 1 } },
  ).toArray();
  res.json({ success: true, data: items });
}));

r.get('/resources-list', asyncHandler(async (req, res) => {
  const baseFilter = { role: 'resource', deletedAt: { $exists: false } };
  if (req.query.country) baseFilter.country = String(req.query.country).toUpperCase();
  // Filter by a specific PM's roster (used after assign-pm step to pick a resource)
  if (req.query.pmId) {
    try { baseFilter.pmId = new ObjectId(String(req.query.pmId)); } catch {}
  }
  if (req.user?.role === 'pm') {
    // PM only sees their own resources
    baseFilter.pmId = new ObjectId(req.user.id);
  } else if (req.user?.role === 'country_admin') {
    // Country admin sees resources under PMs they created
    const myPms = await usersCol().find(
      { role: 'pm', parentCountryAdminId: new ObjectId(req.user.id) },
      { projection: { _id: 1 } },
    ).toArray();
    baseFilter.pmId = { $in: myPms.map((p) => p._id) };
  }
  const filter = applyScope(baseFilter, req);
  const items = await usersCol().find(
    filter,
    { projection: { name: 1, mobile: 1, email: 1, skills: 1, country: 1, pmId: 1 } },
  ).toArray();
  res.json({ success: true, data: items });
}));

/* Admin: CMS list + update (proxy to /cms admin endpoints, but exposed under /admin) */
r.get('/cms', asyncHandler(async (_req, res) => {
  const cmsCol = getDualDb().collection('cms_content');
  const items = await cmsCol.find({}).toArray();
  res.json({ success: true, data: items });
}));

r.get('/cms/:key', asyncHandler(async (req, res) => {
  const cmsCol = getDualDb().collection('cms_content');
  const doc = await cmsCol.findOne({ key: req.params.key });
  res.json({ success: true, data: doc || { key: req.params.key, items: [] } });
}));

r.put('/cms/:key',
  permGuard(PERMS.CMS_WRITE),
  validate(z.object({ items: z.array(z.any()) })),
  asyncHandler(async (req, res) => {
    const cmsCol = getDualDb().collection('cms_content');
    await cmsCol.updateOne(
      { key: req.params.key },
      { $set: { key: req.params.key, items: req.body.items, updatedAt: new Date() } },
      { upsert: true },
    );
    try { await redis.del(`cache:cms:${req.params.key}`); } catch {}
    res.json({ success: true });
  }),
);

// Hierarchy: returns the full super_admin → country_admin → PM →
// resource tree with booking counts. Only super_admin can see the
// global tree; country_admin gets just their slice.
r.get('/hierarchy', permGuard(PERMS.USER_READ), asyncHandler(async (req, res) => {
  const isCountryScoped = req.user.role === 'country_admin';
  const baseFilter = { deletedAt: { $exists: false } };

  // Pull every relevant user in one round-trip; tree-build in memory.
  const [admins, pms, resources] = await Promise.all([
    usersCol().find({
      ...baseFilter, role: 'country_admin',
      ...(isCountryScoped ? { _id: new ObjectId(req.user.id) } : {}),
    }).project({ name: 1, mobile: 1, email: 1, country: 1, managedCountries: 1, meta: 1, createdAt: 1 })
      .toArray(),
    usersCol().find({
      ...baseFilter, role: 'pm',
      ...(isCountryScoped ? { country: req.user.country } : {}),
    }).project({ name: 1, mobile: 1, email: 1, country: 1, parentCountryAdminId: 1, meta: 1, createdAt: 1 })
      .toArray(),
    usersCol().find({
      ...baseFilter, role: 'resource',
      ...(isCountryScoped ? { country: req.user.country } : {}),
    }).project({ name: 1, mobile: 1, email: 1, country: 1, pmId: 1, parentCountryAdminId: 1, specialization: 1, meta: 1, createdAt: 1 })
      .toArray(),
  ]);

  // Booking counts per PM (active = non-cancelled, non-completed).
  const ACTIVE_STATUSES = ['assigned_to_pm', 'in_progress', 'paused', 'pending', 'confirmed'];
  const bookingCounts = await jobsCol().aggregate([
    { $match: { status: { $in: ACTIVE_STATUSES } } },
    { $group: { _id: { pm: '$pmId', resource: '$resourceId' }, count: { $sum: 1 } } },
  ]).toArray().catch(() => []);
  const pmActive = new Map();
  const resActive = new Map();
  for (const b of bookingCounts) {
    if (b._id?.pm) pmActive.set(String(b._id.pm), (pmActive.get(String(b._id.pm)) || 0) + b.count);
    if (b._id?.resource) resActive.set(String(b._id.resource), (resActive.get(String(b._id.resource)) || 0) + b.count);
  }

  // Pivot: country_admin → [PMs] → [resources]
  const adminById = new Map(admins.map((a) => [String(a._id), {
    ...a, _id: String(a._id), pms: [], resourceCount: 0, activeBookings: 0,
  }]));
  // Index PMs under their parent country_admin (or "_unassigned" bucket).
  const pmById = new Map();
  for (const pm of pms) {
    const parentId = pm.parentCountryAdminId ? String(pm.parentCountryAdminId) : null;
    const node = {
      ...pm, _id: String(pm._id),
      activeBookings: pmActive.get(String(pm._id)) || 0,
      resources: [],
    };
    pmById.set(node._id, node);
    if (parentId && adminById.has(parentId)) {
      adminById.get(parentId).pms.push(node);
    }
  }
  // Index resources under their PM.
  const orphanResources = [];
  for (const r of resources) {
    const node = {
      ...r, _id: String(r._id),
      activeBookings: resActive.get(String(r._id)) || 0,
    };
    const pmKey = r.pmId ? String(r.pmId) : null;
    if (pmKey && pmById.has(pmKey)) {
      pmById.get(pmKey).resources.push(node);
    } else {
      orphanResources.push(node);
    }
  }
  // Roll-up counts.
  for (const admin of adminById.values()) {
    let resCount = 0, active = 0;
    for (const pm of admin.pms) {
      resCount += pm.resources.length;
      active += pm.activeBookings;
    }
    admin.resourceCount = resCount;
    admin.activeBookings = active;
  }

  res.json({
    success: true,
    data: {
      countryAdmins: Array.from(adminById.values()),
      orphanPMs: pms.filter((pm) => !pm.parentCountryAdminId).map((pm) => ({ ...pm, _id: String(pm._id) })),
      orphanResources,
      totals: {
        countryAdmins: admins.length,
        pms: pms.length,
        resources: resources.length,
      },
    },
  });
}));

// Audit-log read for the country-admin audit dashboard. Filtered by
// scope so country_admin only sees their country's entries; super_admin
// without ?asCountry= sees everything.
r.get('/audit', permGuard(PERMS.AUDIT_READ), asyncHandler(async (req, res) => {
  const { getPg } = await import('../../db/postgres.js');
  const pg = getPg();
  const { auditLogsV2 } = await import('../../db/schema.js');
  const { desc, eq, and } = await import('drizzle-orm');
  const limit = Math.min(Number(req.query.limit) || 100, 500);

  let scopeCountry = null;
  if (req.scope?.mode === 'country' || req.scope?.mode === 'country-as') {
    scopeCountry = req.scope.filter?.country || req.scope.asCountry || null;
  }
  // super_admin without asCountry sees global; otherwise narrow.
  const baseSel = pg.select().from(auditLogsV2);
  const where = scopeCountry ? eq(auditLogsV2.country, scopeCountry) : undefined;
  const rows = where
    ? await baseSel.where(where).orderBy(desc(auditLogsV2.createdAt)).limit(limit)
    : await baseSel.orderBy(desc(auditLogsV2.createdAt)).limit(limit);
  res.json({ success: true, data: { items: rows } });
}));

export default r;
