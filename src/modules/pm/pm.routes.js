import { Router } from 'express';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { roleGuard } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { paginate, buildMeta } from '../../utils/pagination.js';
import { getDb } from '../../config/db.js';
import { AppError } from '../../utils/AppError.js';
import { enqueueNotification } from '../notification/notification.service.js';
import { emitTo } from '../../socket/index.js';
import { notifyAdmins } from './pm.assign.js';
import { getOrSet } from '../../utils/cache.js';

const r = Router();
r.use(roleGuard(['pm']));

// Bookings live in the `jobs` collection (v3). PM dashboards/actions all hit it.
const jobsCol = () => getDb().collection('jobs');
const usersCol = () => getDb().collection('users');
const servicesCol = () => getDb().collection('services');

async function loadOwnedJob(id, pmId) {
  let oid;
  try { oid = new ObjectId(String(id)); }
  catch { throw new AppError('VALIDATION_ERROR', 'Invalid booking id', 400); }
  const job = await jobsCol().findOne({ _id: oid });
  if (!job) throw new AppError('NOT_FOUND', 'Booking not found', 404);
  if (!job.pmId || String(job.pmId) !== String(pmId)) {
    throw new AppError('FORBIDDEN', 'Booking not assigned to this PM', 403);
  }
  return job;
}

async function hydrateJobs(jobs) {
  if (!jobs.length) return [];
  const userIds = [...new Set(jobs.map((j) => j.userId).filter(Boolean).map(String))];
  const svcIds = [...new Set(jobs.flatMap((j) =>
    [j.serviceId, ...(j.services || []).map((s) => s?.serviceId)].filter(Boolean).map(String),
  ))];
  const [users, services] = await Promise.all([
    userIds.length ? usersCol().find({ _id: { $in: userIds.map((u) => new ObjectId(u)) } },
      { projection: { name: 1, mobile: 1 } }).toArray() : [],
    svcIds.length ? servicesCol().find({ _id: { $in: svcIds.map((s) => { try { return new ObjectId(s); } catch { return null; } }).filter(Boolean) } }).toArray() : [],
  ]);
  const uMap = new Map(users.map((u) => [String(u._id), u]));
  const sMap = new Map(services.map((s) => [String(s._id), s]));
  return jobs.map((j) => {
    const firstSvcId = j.services?.[0]?.serviceId || j.serviceId;
    const svc = firstSvcId ? sMap.get(String(firstSvcId)) : null;
    const cust = j.userId ? uMap.get(String(j.userId)) : null;
    return {
      ...j,
      customerName: cust?.name || cust?.mobile || 'Customer',
      customerMobile: cust?.mobile || '',
      serviceName: svc?.name || svc?.title || 'Service',
      amount: j.pricing?.total ?? j.amount ?? 0,
    };
  });
}

r.get('/me', asyncHandler(async (req, res) => {
  res.json({ success: true, data: { id: req.user.id, role: 'pm' } });
}));

r.get('/dashboard', asyncHandler(async (req, res) => {
  // Each PM sees their own counts → cache key is per-PM. 30s TTL keeps
  // the dashboard feeling live while collapsing five Mongo round-trips
  // into one Redis hit on every refresh.
  const pmIdStr = String(req.user.id);
  const data = await getOrSet(`pm:dashboard:${pmIdStr}`, async () => {
    const pmId = new ObjectId(pmIdStr);
    const [assigned, inProgress, paused, completed, byStatus] = await Promise.all([
      jobsCol().countDocuments({ pmId, status: 'assigned_to_pm' }),
      jobsCol().countDocuments({ pmId, status: 'in_progress' }),
      jobsCol().countDocuments({ pmId, status: 'paused' }),
      jobsCol().countDocuments({ pmId, status: 'completed' }),
      jobsCol().aggregate([
        { $match: { pmId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]).toArray(),
    ]);
    return {
      assigned, inProgress, paused, completed,
      byStatus: Object.fromEntries(byStatus.map((b) => [b._id, b.count])),
    };
  }, 30);
  res.json({ success: true, data });
}));

r.get('/bookings', asyncHandler(async (req, res) => {
  const p = paginate(req.query);
  const filter = { pmId: new ObjectId(req.user.id) };
  if (req.query.status) filter.status = String(req.query.status);

  // Free-text search across the bookingId tail, raw mongo _id, customer
  // name, customer mobile, and customer email so a PM can find a single
  // booking out of thousands without paging through them. Supplied as
  // ?q=… by the frontend; missing → no extra filter applied.
  const q = String(req.query.q || '').trim();
  if (q) {
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(safe, 'i');
    const orParts = [
      { customerName: re },
      { customerMobile: re },
      { customerEmail: re },
    ];
    if (/^[0-9a-f]{24}$/i.test(q)) {
      try { orParts.push({ _id: new ObjectId(q) }); } catch { /* ignore */ }
    } else if (/^[0-9a-f]{4,23}$/i.test(q)) {
      // Partial id — match anywhere in the hex string of _id
      orParts.push({ $expr: { $regexMatch: { input: { $toString: '$_id' }, regex: re } } });
    }
    filter.$or = orParts;
  }

  const [items, total] = await Promise.all([
    jobsCol().find(filter).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit).toArray(),
    jobsCol().countDocuments(filter),
  ]);
  const data = await hydrateJobs(items);
  res.json({ success: true, data, meta: buildMeta({ page: p.page, pageSize: p.pageSize, total }) });
}));

r.get('/bookings/:id', asyncHandler(async (req, res) => {
  const job = await loadOwnedJob(req.params.id, req.user.id);
  const [hydrated] = await hydrateJobs([job]);
  res.json({ success: true, data: hydrated });
}));

const noteSchema = z.object({ note: z.string().max(500).optional() });

function pushBookingEvent(job, status, extra = {}) {
  const bookingId = String(job._id);
  try {
    if (job.userId) emitTo(`user_${job.userId}`, 'booking:status', { bookingId, status });
    if (job.pmId)   emitTo(`user_${job.pmId}`, 'booking:status', { bookingId, status });
    emitTo('role_admin', 'booking:status', { bookingId, status, ...extra });
  } catch {}
}

// PM accepts an assignment (records acceptance, status stays assigned_to_pm).
r.post('/bookings/:id/accept', validate(noteSchema), asyncHandler(async (req, res) => {
  const job = await loadOwnedJob(req.params.id, req.user.id);
  const now = new Date();
  await jobsCol().updateOne(
    { _id: job._id },
    {
      $set: { pmAcceptedAt: now, updatedAt: now },
      $push: { history: { at: now, actorId: new ObjectId(req.user.id), actorRole: 'pm', event: 'pm_accepted', note: req.body.note || 'PM accepted' } },
    },
  );
  if (job.userId) {
    enqueueNotification({
      userId: String(job.userId), type: 'booking_update',
      title: 'PM accepted', body: 'Your project manager has accepted the assignment.',
      data: { bookingId: String(job._id) },
    }).catch(() => {});
  }
  res.json({ success: true, data: await jobsCol().findOne({ _id: job._id }) });
}));

// PM declines: clears pmId so admin can reassign.
r.post('/bookings/:id/decline', validate(noteSchema), asyncHandler(async (req, res) => {
  const job = await loadOwnedJob(req.params.id, req.user.id);
  const now = new Date();
  await jobsCol().updateOne(
    { _id: job._id },
    {
      $set: { pmId: null, projectManager: null, pmAcceptedAt: null, status: 'paid', updatedAt: now },
      $push: { history: { at: now, actorId: new ObjectId(req.user.id), actorRole: 'pm', event: 'pm_declined', note: req.body.note || 'PM declined' } },
    },
  );
  notifyAdmins({
    type: 'pm_declined',
    title: 'PM declined assignment',
    body: `Booking ${String(job._id).slice(-8)} needs reassignment.`,
    data: { bookingId: String(job._id) },
  }).catch(() => {});
  res.json({ success: true, data: await jobsCol().findOne({ _id: job._id }) });
}));

// PM starts work — sets status in_progress, records startedAt for current session.
r.post('/bookings/:id/start', validate(noteSchema), asyncHandler(async (req, res) => {
  const job = await loadOwnedJob(req.params.id, req.user.id);
  if (!['assigned_to_pm', 'paused'].includes(job.status)) {
    throw new AppError('INVALID_STATE', `Cannot start from status ${job.status}`, 409);
  }
  const now = new Date();
  await jobsCol().updateOne(
    { _id: job._id },
    {
      $set: {
        status: 'in_progress',
        currentSessionStart: now,
        startedAt: job.startedAt || now,
        updatedAt: now,
      },
      $push: { history: { at: now, actorId: new ObjectId(req.user.id), actorRole: 'pm', event: 'work_started', note: req.body.note || 'PM started work' } },
    },
  );
  const updated = await jobsCol().findOne({ _id: job._id });
  pushBookingEvent(updated, 'in_progress');
  if (job.userId) enqueueNotification({
    userId: String(job.userId), type: 'work_started',
    title: 'Work started', body: 'Your project manager has started working on your booking.',
    data: { bookingId: String(job._id) },
  }).catch(() => {});
  notifyAdmins({
    type: 'work_started', title: 'PM started work',
    body: `Booking ${String(job._id).slice(-8)} is now in progress.`,
    data: { bookingId: String(job._id) },
  }).catch(() => {});
  res.json({ success: true, data: updated });
}));

// PM stops work — pauses timer, accumulates worked minutes, status = paused.
r.post('/bookings/:id/stop', validate(noteSchema), asyncHandler(async (req, res) => {
  const job = await loadOwnedJob(req.params.id, req.user.id);
  if (job.status !== 'in_progress') {
    throw new AppError('INVALID_STATE', `Cannot stop from status ${job.status}`, 409);
  }
  const now = new Date();
  const sessionStart = job.currentSessionStart ? new Date(job.currentSessionStart) : now;
  const sessionMs = Math.max(0, now - sessionStart);
  const accruedMs = (job.workedMs || 0) + sessionMs;
  await jobsCol().updateOne(
    { _id: job._id },
    {
      $set: {
        status: 'paused',
        currentSessionStart: null,
        lastStoppedAt: now,
        workedMs: accruedMs,
        updatedAt: now,
      },
      $push: { history: { at: now, actorId: new ObjectId(req.user.id), actorRole: 'pm', event: 'work_stopped', note: req.body.note || 'PM stopped work', sessionMs } },
    },
  );
  const updated = await jobsCol().findOne({ _id: job._id });
  pushBookingEvent(updated, 'paused');
  if (job.userId) enqueueNotification({
    userId: String(job.userId), type: 'work_paused',
    title: 'Work paused', body: 'Your project manager has paused work on your booking.',
    data: { bookingId: String(job._id) },
  }).catch(() => {});
  res.json({ success: true, data: updated });
}));

// PM completes the booking.
r.post('/bookings/:id/complete', validate(noteSchema), asyncHandler(async (req, res) => {
  const job = await loadOwnedJob(req.params.id, req.user.id);
  if (!['in_progress', 'paused'].includes(job.status)) {
    throw new AppError('INVALID_STATE', `Cannot complete from status ${job.status}`, 409);
  }
  const now = new Date();
  let workedMs = job.workedMs || 0;
  if (job.status === 'in_progress' && job.currentSessionStart) {
    workedMs += Math.max(0, now - new Date(job.currentSessionStart));
  }
  await jobsCol().updateOne(
    { _id: job._id },
    {
      $set: {
        status: 'completed',
        completedAt: now,
        currentSessionStart: null,
        workedMs,
        updatedAt: now,
      },
      $push: { history: { at: now, actorId: new ObjectId(req.user.id), actorRole: 'pm', event: 'completed', note: req.body.note || 'PM marked complete' } },
    },
  );
  const updated = await jobsCol().findOne({ _id: job._id });
  pushBookingEvent(updated, 'completed');
  if (job.userId) enqueueNotification({
    userId: String(job.userId), type: 'booking_completed',
    title: 'Booking completed', body: 'Your project manager has marked the booking as completed.',
    data: { bookingId: String(job._id) },
  }).catch(() => {});
  notifyAdmins({
    type: 'booking_completed', title: 'Booking completed',
    body: `Booking ${String(job._id).slice(-8)} marked complete by PM.`,
    data: { bookingId: String(job._id) },
  }).catch(() => {});
  res.json({ success: true, data: updated });
}));

// Timeline: append a PM-authored update entry to job history.
const timelineSchema = z.object({
  status: z.string().min(2).max(40).optional(),
  note: z.string().min(1).max(1000),
  progressPercent: z.number().int().min(0).max(100).optional(),
});
r.post('/bookings/:id/timeline', validate(timelineSchema), asyncHandler(async (req, res) => {
  const job = await loadOwnedJob(req.params.id, req.user.id);
  const now = new Date();
  const entry = {
    at: now,
    actorId: new ObjectId(req.user.id),
    actorRole: 'pm',
    event: 'timeline_update',
    status: req.body.status || job.status,
    progressPercent: req.body.progressPercent,
    note: req.body.note,
  };
  await jobsCol().updateOne(
    { _id: job._id },
    { $set: { updatedAt: now }, $push: { history: entry } },
  );
  if (job.userId) {
    enqueueNotification({
      userId: String(job.userId), type: 'booking_update',
      title: 'Project update', body: req.body.note,
      data: { bookingId: String(job._id) },
    }).catch(() => {});
  }
  res.status(201).json({ success: true, data: entry });
}));

r.get('/bookings/:id/timeline', asyncHandler(async (req, res) => {
  const job = await loadOwnedJob(req.params.id, req.user.id);
  res.json({ success: true, data: job.history || [] });
}));

// List active resources the PM can assign.
r.get('/resources', asyncHandler(async (req, res) => {
  const p = paginate(req.query);
  const filter = { role: 'resource', 'meta.status': { $ne: 'inactive' } };
  if (req.query.q) filter.mobile = { $regex: String(req.query.q), $options: 'i' };
  const [items, total] = await Promise.all([
    usersCol().find(filter, { projection: { otpHash: 0 } }).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit).toArray(),
    usersCol().countDocuments(filter),
  ]);
  res.json({ success: true, data: items, meta: buildMeta({ page: p.page, pageSize: p.pageSize, total }) });
}));

// PM assigns a resource to a booking they own.
const assignResourceSchema = z.object({
  resourceId: z.string().regex(/^[0-9a-f]{24}$/),
  note: z.string().max(500).optional(),
});
r.post('/bookings/:id/assign-resource', validate(assignResourceSchema), asyncHandler(async (req, res) => {
  const job = await loadOwnedJob(req.params.id, req.user.id);
  const resourceId = new ObjectId(req.body.resourceId);
  const resource = await usersCol().findOne({ _id: resourceId, role: 'resource' });
  if (!resource) throw new AppError('NOT_FOUND', 'Resource not found', 404);
  const now = new Date();
  await jobsCol().updateOne(
    { _id: job._id },
    {
      $set: {
        resourceId,
        assignedResource: { _id: resource._id, name: resource.name, mobile: resource.mobile },
        resourceAssignedAt: now,
        updatedAt: now,
      },
      $push: { history: { at: now, actorId: new ObjectId(req.user.id), actorRole: 'pm', event: 'resource_assigned', note: req.body.note || `Resource ${req.body.resourceId} assigned by PM` } },
    },
  );
  enqueueNotification({
    userId: String(resourceId), type: 'assignment',
    title: 'New assignment',
    body: `You have been assigned to booking ${String(job._id).slice(-8)}.`,
    data: { bookingId: String(job._id) },
  }).catch(() => {});
  // Notify the customer too
  if (job.userId) {
    enqueueNotification({
      userId: String(job.userId), type: 'resource_assigned',
      title: 'Resource assigned',
      body: `${resource.name || 'A resource'} has been assigned to your booking.`,
      data: { bookingId: String(job._id) },
    }).catch(() => {});
  }
  res.json({ success: true, data: await jobsCol().findOne({ _id: job._id }) });
}));

// ---------------------------------------------------------------------------
// Booking-scoped group chat (customer + PM + resource + admin).
// Uses the existing `chat` collection but with a stable bookingId-based room.
// ---------------------------------------------------------------------------
const chatCol = () => getDb().collection('chat');

function bookingRoomId(bookingId) { return `booking_${String(bookingId)}`; }

r.get('/bookings/:id/messages', asyncHandler(async (req, res) => {
  const job = await loadOwnedJob(req.params.id, req.user.id);
  const items = await chatCol()
    .find({ roomId: bookingRoomId(job._id) })
    .sort({ createdAt: 1 })
    .limit(200)
    .toArray();
  res.json({ success: true, data: items });
}));

const sendMsgSchema = z.object({ msg: z.string().min(1).max(5000) });
r.post('/bookings/:id/messages', validate(sendMsgSchema), asyncHandler(async (req, res) => {
  const job = await loadOwnedJob(req.params.id, req.user.id);
  const roomId = bookingRoomId(job._id);
  const now = new Date();
  const doc = {
    roomId,
    bookingId: job._id,
    serviceId: job.services?.[0]?.serviceId || job.serviceId || null,
    senderId: new ObjectId(req.user.id),
    senderRole: 'pm',
    senderName: 'PM',
    msg: req.body.msg,
    msgType: 0,
    attachment: null,
    createdAt: now,
  };
  const ins = await chatCol().insertOne(doc);
  const message = { ...doc, _id: ins.insertedId };
  // Live broadcast to the booking room (anyone explicitly joined)
  try { emitTo(roomId, 'new-message', message); } catch {}
  // CHAT_FANOUT_FIX_V1: also push directly to each participant's personal
  // user_<id> room so clients still receive the message even if they haven't
  // joined the booking_<id> room (e.g. global SocketProvider clobbered the
  // ChatPanel subscription on a reconnect).
  const recipients = [job.userId, job.resourceId].filter(Boolean).map(String);
  recipients.forEach((uid) => {
    try { emitTo(`user_${uid}`, 'message:new', message); } catch {}
    enqueueNotification({
      userId: uid, type: 'chat_message',
      title: 'New chat message', body: req.body.msg.slice(0, 120),
      data: { bookingId: String(job._id) },
    }).catch(() => {});
  });
  // Admin observers (auto-joined to role_admin on connect)
  try { emitTo('role_admin', 'message:new', message); } catch {}
  res.status(201).json({ success: true, data: message });
}));

export default r;
