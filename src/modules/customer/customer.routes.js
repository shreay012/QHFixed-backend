/**
 * Customer Self-Serve Actions  (Phase 5)
 *
 * Reschedule and cancellation with business rules:
 *  - Cancel: free if > 24h before start; partial refund 2-24h; no refund < 2h
 *  - Reschedule: allowed up to 2h before start; max 2 reschedules per booking
 *
 * Live Tracking:
 *  - Resource broadcasts GPS coords via socket (POST /tracking/update)
 *  - Customer polls or subscribes to tracking room
 *
 * Routes mounted at /api/customer/*
 */
import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getDb } from '../../config/db.js';
import { ObjectId } from 'mongodb';
import { AppError } from '../../utils/AppError.js';
import { toObjectId } from '../../utils/oid.js';
import { enqueueJob, QUEUES } from '../../queue/index.js';
import { emitTo } from '../../socket/index.js';
import { redis } from '../../config/redis.js';

const r = Router();

const jobsCol = () => getDb().collection('jobs');
const rescheduleHistoryCol = () => getDb().collection('reschedule_history');

/* ═══════════════════════════════════════════════════════════════
   CANCELLATION RULES
═══════════════════════════════════════════════════════════════ */

function getCancellationPolicy(hoursUntilStart) {
  if (hoursUntilStart > 24) return { refundPct: 100, label: 'Full refund' };
  if (hoursUntilStart >= 2) return { refundPct: 50, label: '50% refund' };
  return { refundPct: 0, label: 'No refund' };
}

// GET /api/customer/bookings/:id/cancel-preview
r.get('/bookings/:id/cancel-preview', asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) throw new AppError('AUTH_TOKEN_MISSING', 'Auth required', 401);

  const job = await jobsCol().findOne({ _id: toObjectId(req.params.id), userId: new ObjectId(user.id) });
  if (!job) throw new AppError('RESOURCE_NOT_FOUND', 'Booking not found', 404);
  if (['completed', 'cancelled'].includes(job.status)) {
    throw new AppError('VALIDATION_ERROR', `Booking is already ${job.status}`, 400);
  }

  const startTime = job.schedule?.startTime ? new Date(job.schedule.startTime) : null;
  const hoursUntilStart = startTime ? (startTime - Date.now()) / 3600_000 : Infinity;
  const policy = getCancellationPolicy(hoursUntilStart);

  res.json({ success: true, data: {
    bookingId: String(job._id),
    status: job.status,
    amount: job.pricing?.total || 0,
    policy,
    refundAmount: Math.round((job.pricing?.total || 0) * (policy.refundPct / 100)),
  }});
}));

// POST /api/customer/bookings/:id/cancel
r.post('/bookings/:id/cancel', validate(z.object({
  reason: z.string().min(3).max(500),
})), asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) throw new AppError('AUTH_TOKEN_MISSING', 'Auth required', 401);

  const job = await jobsCol().findOne({ _id: toObjectId(req.params.id), userId: new ObjectId(user.id) });
  if (!job) throw new AppError('RESOURCE_NOT_FOUND', 'Booking not found', 404);
  if (['completed', 'cancelled'].includes(job.status)) {
    throw new AppError('VALIDATION_ERROR', `Booking is already ${job.status}`, 400);
  }
  if (job.status === 'in_progress') {
    throw new AppError('VALIDATION_ERROR', 'Cannot cancel a booking that is in progress', 400);
  }

  const startTime = job.schedule?.startTime ? new Date(job.schedule.startTime) : null;
  const hoursUntilStart = startTime ? (startTime - Date.now()) / 3600_000 : Infinity;
  const policy = getCancellationPolicy(hoursUntilStart);
  const refundAmount = Math.round((job.pricing?.total || 0) * (policy.refundPct / 100));

  const now = new Date();
  await jobsCol().updateOne({ _id: job._id }, { $set: {
    status: 'cancelled',
    cancelReason: req.body.reason,
    cancelledBy: new ObjectId(user.id),
    cancelledByRole: 'customer',
    cancelledAt: now,
    refundPolicy: policy,
    refundAmount,
    updatedAt: now,
  }});

  // Queue refund if applicable
  if (refundAmount > 0) {
    await enqueueJob(QUEUES.ANALYTICS, {
      type: 'process_refund',
      bookingId: String(job._id),
      amount: refundAmount,
      reason: `customer_cancel: ${req.body.reason}`,
      refundPct: policy.refundPct,
    }).catch(() => {});
  }

  // Notify PM and ops
  const notifyIds = [String(job.pmId), String(job.resourceId)].filter((x) => x !== 'null' && x !== 'undefined');
  for (const uid of notifyIds) {
    await enqueueJob(QUEUES.NOTIFICATIONS, {
      type: 'booking_cancelled',
      userId: uid,
      title: 'Booking cancelled',
      body: `Booking #${String(job._id).slice(-8)} was cancelled by the customer.`,
      data: { bookingId: String(job._id) },
    }).catch(() => {});
  }

  res.json({ success: true, data: { cancelled: true, refundAmount, policy } });
}));

/* ═══════════════════════════════════════════════════════════════
   RESCHEDULE
═══════════════════════════════════════════════════════════════ */

r.get('/bookings/:id/reschedule-preview', asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) throw new AppError('AUTH_TOKEN_MISSING', 'Auth required', 401);

  const job = await jobsCol().findOne({ _id: toObjectId(req.params.id), userId: new ObjectId(user.id) });
  if (!job) throw new AppError('RESOURCE_NOT_FOUND', 'Booking not found', 404);

  const rescheduleCount = job.rescheduleCount || 0;
  const startTime = job.schedule?.startTime ? new Date(job.schedule.startTime) : null;
  const hoursUntilStart = startTime ? (startTime - Date.now()) / 3600_000 : Infinity;

  const canReschedule = rescheduleCount < 2 && hoursUntilStart > 2 && !['completed', 'cancelled', 'in_progress'].includes(job.status);

  res.json({ success: true, data: {
    canReschedule,
    rescheduleCount,
    maxReschedules: 2,
    blockedReason: !canReschedule
      ? rescheduleCount >= 2 ? 'Maximum reschedules reached'
        : hoursUntilStart <= 2 ? 'Less than 2 hours before start'
        : `Cannot reschedule a ${job.status} booking`
      : null,
  }});
}));

r.post('/bookings/:id/reschedule', validate(z.object({
  newStartTime: z.string().datetime(),
  newEndTime: z.string().datetime().optional(),
  reason: z.string().max(500).optional().default(''),
})), asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) throw new AppError('AUTH_TOKEN_MISSING', 'Auth required', 401);

  const job = await jobsCol().findOne({ _id: toObjectId(req.params.id), userId: new ObjectId(user.id) });
  if (!job) throw new AppError('RESOURCE_NOT_FOUND', 'Booking not found', 404);

  const rescheduleCount = job.rescheduleCount || 0;
  if (rescheduleCount >= 2) throw new AppError('VALIDATION_ERROR', 'Maximum reschedules (2) reached', 400);

  const startTime = job.schedule?.startTime ? new Date(job.schedule.startTime) : null;
  const hoursUntilStart = startTime ? (startTime - Date.now()) / 3600_000 : Infinity;
  if (hoursUntilStart <= 2) throw new AppError('VALIDATION_ERROR', 'Cannot reschedule within 2 hours of start', 400);
  if (['completed', 'cancelled', 'in_progress'].includes(job.status)) {
    throw new AppError('VALIDATION_ERROR', `Cannot reschedule a ${job.status} booking`, 400);
  }

  const newStart = new Date(req.body.newStartTime);
  if (newStart <= new Date()) throw new AppError('VALIDATION_ERROR', 'New start time must be in the future', 400);

  const now = new Date();
  // Save reschedule history
  await rescheduleHistoryCol().insertOne({
    bookingId: job._id,
    previousStartTime: job.schedule?.startTime,
    previousEndTime: job.schedule?.endTime,
    newStartTime: newStart,
    newEndTime: req.body.newEndTime ? new Date(req.body.newEndTime) : null,
    reason: req.body.reason,
    requestedBy: new ObjectId(user.id),
    createdAt: now,
  });

  await jobsCol().updateOne({ _id: job._id }, {
    $set: {
      'schedule.startTime': newStart,
      'schedule.endTime': req.body.newEndTime ? new Date(req.body.newEndTime) : job.schedule?.endTime,
      updatedAt: now,
    },
    $inc: { rescheduleCount: 1 },
  });

  // Notify PM
  if (job.pmId) {
    await enqueueJob(QUEUES.NOTIFICATIONS, {
      type: 'booking_rescheduled',
      userId: String(job.pmId),
      title: 'Booking rescheduled',
      body: `Booking #${String(job._id).slice(-8)} rescheduled to ${newStart.toLocaleDateString()}.`,
      data: { bookingId: String(job._id) },
    }).catch(() => {});
  }

  res.json({ success: true, data: { rescheduled: true, newStartTime: newStart, rescheduleCount: rescheduleCount + 1 } });
}));

/* ═══════════════════════════════════════════════════════════════
   LIVE TRACKING
   Resource pushes GPS → stored in Redis (5-min TTL) + emitted via socket.
   Customer polls GET or listens to socket room tracking_<bookingId>.
═══════════════════════════════════════════════════════════════ */

const locationSchema = z.object({
  bookingId: z.string().regex(/^[0-9a-f]{24}$/),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
  heading: z.number().optional(),
  speed: z.number().optional(),
});

// POST /api/customer/tracking/update — resource sends location
r.post('/tracking/update', validate(locationSchema), asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user || !['resource', 'pm'].includes(user.role)) {
    throw new AppError('AUTH_FORBIDDEN', 'Only resources and PMs can update tracking', 403);
  }

  const { bookingId, lat, lng, accuracy, heading, speed } = req.body;
  const job = await jobsCol().findOne({
    _id: toObjectId(bookingId),
    $or: [{ resourceId: new ObjectId(user.id) }, { pmId: new ObjectId(user.id) }],
    status: 'in_progress',
  });
  if (!job) throw new AppError('RESOURCE_NOT_FOUND', 'Active booking not found', 404);

  const location = { lat, lng, accuracy, heading, speed, updatedAt: new Date().toISOString(), staffId: user.id };

  // Store in Redis with 5-min TTL
  await redis.set(`tracking:${bookingId}`, JSON.stringify(location), 'EX', 300).catch(() => {});

  // Emit to the booking's tracking room
  try { emitTo(`tracking_${bookingId}`, 'location:update', location); } catch {}

  res.json({ success: true });
}));

// GET /api/customer/tracking/:bookingId — customer polls current location
r.get('/tracking/:bookingId', asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) throw new AppError('AUTH_TOKEN_MISSING', 'Auth required', 401);

  const bookingId = req.params.bookingId;
  const job = await jobsCol().findOne({ _id: toObjectId(bookingId), userId: new ObjectId(user.id) });
  if (!job) throw new AppError('RESOURCE_NOT_FOUND', 'Booking not found', 404);

  const raw = await redis.get(`tracking:${bookingId}`).catch(() => null);
  if (!raw) return res.json({ success: true, data: null, message: 'No location data yet' });

  res.json({ success: true, data: JSON.parse(raw) });
}));

export default r;
