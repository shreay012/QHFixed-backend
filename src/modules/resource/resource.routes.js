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
import { getOrSet } from '../../utils/cache.js';

const r = Router();

// Bookings live in `jobs` (v3). Use that consistently.
const jobsCol         = () => getDb().collection('jobs');
const usersCol        = () => getDb().collection('users');
const servicesCol     = () => getDb().collection('services');
const timeLogsCol     = () => getDb().collection('resource_time_logs');
const updatesCol      = () => getDb().collection('resource_work_updates');
const deliverablesCol = () => getDb().collection('resource_deliverables');
const chatCol         = () => getDb().collection('chat');

// Public-ish: any authenticated staff/customer can fetch a resource profile.
r.get('/:id/profile', roleGuard(['user', 'pm', 'admin', 'resource']), asyncHandler(async (req, res) => {
  if (!/^[0-9a-f]{24}$/.test(req.params.id)) {
    throw new AppError('VALIDATION_ERROR', 'Invalid resource id', 422);
  }
  const u = await usersCol().findOne(
    { _id: new ObjectId(req.params.id) },
    { projection: { name: 1, email: 1, avatarUrl: 1, role: 1, skills: 1, bio: 1, rating: 1, mobile: 1 } },
  );
  if (!u) throw new AppError('RESOURCE_NOT_FOUND', 'Resource not found', 404);
  res.json({ success: true, data: u });
}));

// Routes below require the resource role.
r.use(roleGuard(['resource']));

async function loadOwnAssignment(req) {
  let oid;
  try { oid = new ObjectId(String(req.params.id)); }
  catch { throw new AppError('VALIDATION_ERROR', 'Invalid booking id', 400); }
  const job = await jobsCol().findOne({ _id: oid });
  if (!job) throw new AppError('NOT_FOUND', 'Assignment not found', 404);
  if (!job.resourceId || String(job.resourceId) !== String(req.user.id)) {
    throw new AppError('FORBIDDEN', 'Not your assignment', 403);
  }
  return { job, jobId: oid, resourceId: new ObjectId(req.user.id) };
}

async function hydrateJobs(jobs) {
  if (!jobs.length) return [];
  const userIds = [...new Set(jobs.map((j) => j.userId).filter(Boolean).map(String))];
  const svcIds  = [...new Set(jobs.flatMap((j) =>
    [j.serviceId, ...(j.services || []).map((s) => s?.serviceId)].filter(Boolean).map(String),
  ))];
  const [users, services] = await Promise.all([
    userIds.length ? usersCol().find(
      { _id: { $in: userIds.map((u) => new ObjectId(u)) } },
      { projection: { name: 1, mobile: 1 } },
    ).toArray() : [],
    svcIds.length ? servicesCol().find(
      { _id: { $in: svcIds.map((s) => { try { return new ObjectId(s); } catch { return null; } }).filter(Boolean) } },
    ).toArray() : [],
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
  res.json({ success: true, data: { id: req.user.id, role: 'resource' } });
}));

r.get('/dashboard', asyncHandler(async (req, res) => {
  // Per-resource cache (30s) — collapses 3 Mongo round-trips per refresh
  // into 1 Redis hit. Time-logs aggregation in particular was the
  // expensive part since it scans the resource's full history of logs.
  const resourceIdStr = String(req.user.id);
  const data = await getOrSet(`resource:dashboard:${resourceIdStr}`, async () => {
    const resourceId = new ObjectId(resourceIdStr);
    const [active, completed, totalLogged] = await Promise.all([
      jobsCol().countDocuments({ resourceId, status: { $in: ['assigned_to_pm', 'in_progress', 'paused'] } }),
      jobsCol().countDocuments({ resourceId, status: 'completed' }),
      timeLogsCol().aggregate([
        { $match: { resourceId } },
        { $group: { _id: null, hours: { $sum: '$hours' } } },
      ]).toArray(),
    ]);
    return {
      activeAssignments: active,
      completedAssignments: completed,
      totalHoursLogged: totalLogged[0]?.hours || 0,
    };
  }, 30);
  res.json({ success: true, data });
}));

r.get('/assignments', asyncHandler(async (req, res) => {
  const p = paginate(req.query);
  const filter = { resourceId: new ObjectId(req.user.id) };
  if (req.query.status) filter.status = String(req.query.status);

  // Free-text search across customer name / mobile / email and full or
  // partial 24-char booking _id, mirroring /pm/bookings. Lets a resource
  // working dozens of jobs find a single booking without paging.
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

r.get('/assignments/:id', asyncHandler(async (req, res) => {
  const { job } = await loadOwnAssignment(req);
  const [hydrated] = await hydrateJobs([job]);
  res.json({ success: true, data: hydrated });
}));

const noteSchema = z.object({ note: z.string().max(500).optional() });

r.post('/assignments/:id/accept', validate(noteSchema), asyncHandler(async (req, res) => {
  const { job, jobId, resourceId } = await loadOwnAssignment(req);
  const now = new Date();
  await jobsCol().updateOne(
    { _id: jobId },
    {
      $set: { resourceAcceptedAt: now, updatedAt: now },
      $push: { history: { at: now, actorId: resourceId, actorRole: 'resource', event: 'resource_accepted', note: req.body.note || 'Resource accepted' } },
    },
  );
  if (job.pmId) {
    enqueueNotification({
      userId: String(job.pmId), type: 'assignment',
      title: 'Resource accepted', body: `Resource accepted booking ${String(jobId).slice(-8)}`,
      data: { bookingId: String(jobId) },
    }).catch(() => {});
  }
  res.json({ success: true, data: await jobsCol().findOne({ _id: jobId }) });
}));

r.post('/assignments/:id/decline', validate(noteSchema), asyncHandler(async (req, res) => {
  const { job, jobId, resourceId } = await loadOwnAssignment(req);
  const now = new Date();
  await jobsCol().updateOne(
    { _id: jobId },
    {
      $set: { resourceAcceptedAt: null, updatedAt: now },
      $unset: { resourceId: '', assignedResource: '' },
      $push: { history: { at: now, actorId: resourceId, actorRole: 'resource', event: 'resource_declined', note: req.body.note || 'Resource declined' } },
    },
  );
  if (job.pmId) {
    enqueueNotification({
      userId: String(job.pmId), type: 'assignment',
      title: 'Resource declined', body: `Resource declined booking ${String(jobId).slice(-8)}`,
      data: { bookingId: String(jobId) },
    }).catch(() => {});
  }
  res.json({ success: true, data: await jobsCol().findOne({ _id: jobId }) });
}));

// ---------- Time logs ----------
const logSchema = z.object({
  bookingId: z.string().regex(/^[0-9a-f]{24}$/),
  hours: z.number().positive().max(24),
  note: z.string().max(500).optional(),
});

r.post('/time-log', validate(logSchema), asyncHandler(async (req, res) => {
  const bookingId = new ObjectId(req.body.bookingId);
  const resourceId = new ObjectId(req.user.id);
  // Ensure ownership
  const job = await jobsCol().findOne({ _id: bookingId });
  if (!job || String(job.resourceId) !== String(resourceId)) {
    throw new AppError('FORBIDDEN', 'Not your assignment', 403);
  }
  const doc = {
    resourceId, bookingId,
    hours: req.body.hours, note: req.body.note || '',
    createdAt: new Date(),
  };
  const ins = await timeLogsCol().insertOne(doc);
  const created = { _id: ins.insertedId, ...doc };

  if (job.userId) {
    emitTo(`user_${job.userId}`, 'time-log:new', { bookingId: String(bookingId), log: created });
    enqueueNotification({
      userId: String(job.userId), type: 'TIME_LOG',
      title: 'New time log', body: `Resource logged ${req.body.hours}h on your booking.`,
      data: { bookingId: String(bookingId) },
    }).catch(() => {});
  }
  if (job.pmId) emitTo(`user_${job.pmId}`, 'time-log:new', { bookingId: String(bookingId), log: created });

  res.status(201).json({ success: true, data: created });
}));

r.get('/time-logs', asyncHandler(async (req, res) => {
  const p = paginate(req.query);
  const filter = { resourceId: new ObjectId(req.user.id) };
  const [items, total] = await Promise.all([
    timeLogsCol().find(filter).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit).toArray(),
    timeLogsCol().countDocuments(filter),
  ]);
  res.json({ success: true, data: items, meta: buildMeta({ page: p.page, pageSize: p.pageSize, total }) });
}));

// ---------- Work updates / deliverables ----------
const updateSchema = z.object({
  note: z.string().min(1).max(2000),
  progressPercent: z.number().int().min(0).max(100).optional(),
  hoursLogged: z.number().min(0).max(24).optional(),
});
r.post('/assignments/:id/updates', validate(updateSchema), asyncHandler(async (req, res) => {
  const { job, jobId, resourceId } = await loadOwnAssignment(req);
  const now = new Date();
  const doc = {
    bookingId: jobId, resourceId,
    note: req.body.note,
    progressPercent: req.body.progressPercent ?? null,
    hoursLogged: req.body.hoursLogged ?? 0,
    createdAt: now,
  };
  const result = await updatesCol().insertOne(doc);
  await jobsCol().updateOne(
    { _id: jobId },
    { $set: { updatedAt: now }, $push: { history: { at: now, actorId: resourceId, actorRole: 'resource', event: 'work_update', note: req.body.note, progressPercent: req.body.progressPercent } } },
  );
  if (job.pmId) {
    enqueueNotification({
      userId: String(job.pmId), type: 'booking_update',
      title: 'Resource update', body: req.body.note,
      data: { bookingId: String(jobId) },
    }).catch(() => {});
  }
  res.status(201).json({ success: true, data: { _id: result.insertedId, ...doc } });
}));

r.get('/assignments/:id/updates', asyncHandler(async (req, res) => {
  const { jobId } = await loadOwnAssignment(req);
  const items = await updatesCol().find({ bookingId: jobId }).sort({ createdAt: -1 }).toArray();
  res.json({ success: true, data: items });
}));

const deliverableSchema = z.object({
  fileUrl: z.string().url(),
  fileName: z.string().min(1).max(200).optional(),
  type: z.enum(['code', 'design', 'doc', 'other']).default('other'),
  description: z.string().max(1000).optional(),
});
r.post('/assignments/:id/deliverables', validate(deliverableSchema), asyncHandler(async (req, res) => {
  const { job, jobId, resourceId } = await loadOwnAssignment(req);
  const now = new Date();
  const doc = {
    bookingId: jobId, resourceId,
    fileUrl: req.body.fileUrl,
    fileName: req.body.fileName || req.body.fileUrl.split('/').pop(),
    type: req.body.type,
    description: req.body.description || '',
    createdAt: now,
  };
  const ins = await deliverablesCol().insertOne(doc);
  await jobsCol().updateOne(
    { _id: jobId },
    { $set: { updatedAt: now }, $push: { history: { at: now, actorId: resourceId, actorRole: 'resource', event: 'deliverable_uploaded', note: doc.fileName } } },
  );
  if (job.pmId) {
    enqueueNotification({
      userId: String(job.pmId), type: 'booking_update',
      title: 'Deliverable uploaded', body: `Resource uploaded ${doc.fileName}`,
      data: { bookingId: String(jobId) },
    }).catch(() => {});
  }
  res.status(201).json({ success: true, data: { _id: ins.insertedId, ...doc } });
}));

r.get('/assignments/:id/deliverables', asyncHandler(async (req, res) => {
  const { jobId } = await loadOwnAssignment(req);
  const items = await deliverablesCol().find({ bookingId: jobId }).sort({ createdAt: -1 }).toArray();
  res.json({ success: true, data: items });
}));

// ---------- Booking-scoped group chat ----------
function bookingRoomId(bookingId) { return `booking_${String(bookingId)}`; }

r.get('/assignments/:id/messages', asyncHandler(async (req, res) => {
  const { jobId } = await loadOwnAssignment(req);
  const items = await chatCol()
    .find({ roomId: bookingRoomId(jobId) })
    .sort({ createdAt: 1 }).limit(200).toArray();
  res.json({ success: true, data: items });
}));

const sendMsgSchema = z.object({ msg: z.string().min(1).max(5000) });
r.post('/assignments/:id/messages', validate(sendMsgSchema), asyncHandler(async (req, res) => {
  const { job, jobId, resourceId } = await loadOwnAssignment(req);
  const roomId = bookingRoomId(jobId);
  const now = new Date();
  const doc = {
    roomId, bookingId: jobId,
    serviceId: job.services?.[0]?.serviceId || job.serviceId || null,
    senderId: resourceId,
    senderRole: 'resource',
    senderName: 'Resource',
    msg: req.body.msg,
    msgType: 0,
    attachment: null,
    createdAt: now,
  };
  const ins = await chatCol().insertOne(doc);
  const message = { ...doc, _id: ins.insertedId };
  try { emitTo(roomId, 'new-message', message); } catch {}
  // CHAT_FANOUT_FIX_V1: push to each participant's personal room as well so
  // the message reaches clients even if they haven't joined booking_<id>.
  const recipients = [job.userId, job.pmId].filter(Boolean).map(String);
  recipients.forEach((uid) => {
    try { emitTo(`user_${uid}`, 'message:new', message); } catch {}
    enqueueNotification({
      userId: uid, type: 'chat_message',
      title: 'New chat message', body: req.body.msg.slice(0, 120),
      data: { bookingId: String(jobId) },
    }).catch(() => {});
  });
  // Admin observers
  try { emitTo('role_admin', 'message:new', message); } catch {}
  res.status(201).json({ success: true, data: message });
}));

export default r;
