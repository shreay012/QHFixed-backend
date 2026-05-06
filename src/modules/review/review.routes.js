/**
 * Reviews, Ratings & Tips  (Phase 5)
 *
 * Post-completion flow:
 *  1. Customer rates PM (1-5 stars + comment) — once per booking
 *  2. Customer optionally tips the resource
 *  3. PM rates the customer (internal, private)
 *
 * Collections:
 *   reviews   — { bookingId, fromId, toId, toRole, rating, comment, flagged, moderationStatus }
 *   tips      — { bookingId, fromId, toId, amount, currency, status }
 */
import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getDb } from '../../config/db.js';
import { ObjectId } from 'mongodb';
import { AppError } from '../../utils/AppError.js';
import { toObjectId } from '../../utils/oid.js';
import { paginate, buildMeta } from '../../utils/pagination.js';
import { enqueueJob, QUEUES } from '../../queue/index.js';

const r = Router();

const reviewsCol = () => getDb().collection('reviews');
const tipsCol = () => getDb().collection('tips');
const jobsCol = () => getDb().collection('jobs');

/* ─── Submit Review ──────────────────────────────────────────── */
const reviewSchema = z.object({
  bookingId: z.string().regex(/^[0-9a-f]{24}$/),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional().default(''),
});

r.post('/', validate(reviewSchema), asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) throw new AppError('AUTH_TOKEN_MISSING', 'Auth required', 401);

  const bookingId = toObjectId(req.body.bookingId, 'bookingId');
  const job = await jobsCol().findOne({ _id: bookingId });
  if (!job) throw new AppError('RESOURCE_NOT_FOUND', 'Booking not found', 404);
  if (job.status !== 'completed') throw new AppError('VALIDATION_ERROR', 'Can only review completed bookings', 400);

  // Determine who the review is directed to (customer → PM; PM → customer)
  let toId, toRole;
  if (user.role === 'user' || user.role === 'customer') {
    if (!job.pmId) throw new AppError('VALIDATION_ERROR', 'No PM assigned to this booking', 400);
    toId = job.pmId;
    toRole = 'pm';
    // Verify the reviewer is the booking's customer
    if (String(job.userId) !== user.id) throw new AppError('AUTH_FORBIDDEN', 'Not your booking', 403);
  } else if (user.role === 'pm') {
    toId = job.userId;
    toRole = 'customer';
    if (String(job.pmId) !== user.id) throw new AppError('AUTH_FORBIDDEN', 'Not your booking', 403);
  } else {
    throw new AppError('AUTH_FORBIDDEN', 'Only customers and PMs can submit reviews', 403);
  }

  // Prevent duplicate reviews
  const existing = await reviewsCol().findOne({
    bookingId,
    fromId: new ObjectId(user.id),
  });
  if (existing) throw new AppError('RESOURCE_CONFLICT', 'You have already reviewed this booking', 409);

  const now = new Date();
  const doc = {
    bookingId,
    fromId: new ObjectId(user.id),
    fromRole: user.role,
    toId: new ObjectId(String(toId)),
    toRole,
    rating: req.body.rating,
    comment: req.body.comment,
    flagged: false,
    moderationStatus: 'approved',
    createdAt: now,
    updatedAt: now,
  };

  const ins = await reviewsCol().insertOne(doc);

  // Notify the reviewed party
  await enqueueJob(QUEUES.NOTIFICATIONS, {
    type: 'review_received',
    userId: String(toId),
    title: 'You got a new review',
    body: `${req.body.rating}⭐ — "${req.body.comment.slice(0, 80) || 'No comment'}"`,
    data: { bookingId: String(bookingId) },
  }).catch(() => {});

  res.status(201).json({ success: true, data: { _id: ins.insertedId, ...doc } });
}));

/* ─── Get Reviews for a User ─────────────────────────────────── */
r.get('/user/:userId', asyncHandler(async (req, res) => {
  const p = paginate(req.query);
  const toId = toObjectId(req.params.userId);

  const [items, total, avg] = await Promise.all([
    reviewsCol().find({ toId, moderationStatus: { $ne: 'removed' } })
      .sort({ createdAt: -1 }).skip(p.skip).limit(p.limit).toArray(),
    reviewsCol().countDocuments({ toId, moderationStatus: { $ne: 'removed' } }),
    reviewsCol().aggregate([
      { $match: { toId, moderationStatus: { $ne: 'removed' } } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]).toArray(),
  ]);

  res.json({ success: true, data: items, meta: buildMeta({ page: p.page, pageSize: p.pageSize, total }), summary: {
    avgRating: avg[0] ? Math.round(avg[0].avg * 10) / 10 : null,
    totalReviews: avg[0]?.count || 0,
  }});
}));

/* ─── Get Review for a Booking ───────────────────────────────── */
r.get('/booking/:bookingId', asyncHandler(async (req, res) => {
  const bookingId = toObjectId(req.params.bookingId);
  const reviews = await reviewsCol().find({ bookingId, moderationStatus: { $ne: 'removed' } }).toArray();
  // Return only the review visible to the caller (customer sees PM's rating from them, not the PM-to-customer one)
  const user = req.user;
  let visible = reviews;
  if (user?.role === 'user') visible = reviews.filter((r) => r.fromRole !== 'pm'); // hide PM→customer review
  res.json({ success: true, data: visible });
}));

/* ─── Flag Review ────────────────────────────────────────────── */
r.post('/:id/flag', asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError('AUTH_TOKEN_MISSING', 'Auth required', 401);
  await reviewsCol().updateOne({ _id: toObjectId(req.params.id) }, { $set: { flagged: true, updatedAt: new Date() } });
  res.json({ success: true });
}));

/* ─── Tips ───────────────────────────────────────────────────── */
r.post('/tips', validate(z.object({
  bookingId: z.string().regex(/^[0-9a-f]{24}$/),
  amount: z.number().positive().max(10000),
  currency: z.string().length(3).default('INR'),
})), asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) throw new AppError('AUTH_TOKEN_MISSING', 'Auth required', 401);

  const bookingId = toObjectId(req.body.bookingId, 'bookingId');
  const job = await jobsCol().findOne({ _id: bookingId });
  if (!job) throw new AppError('RESOURCE_NOT_FOUND', 'Booking not found', 404);
  if (job.status !== 'completed') throw new AppError('VALIDATION_ERROR', 'Can only tip on completed bookings', 400);
  if (String(job.userId) !== user.id) throw new AppError('AUTH_FORBIDDEN', 'Not your booking', 403);

  const resourceId = job.resourceId || job.pmId;
  if (!resourceId) throw new AppError('VALIDATION_ERROR', 'No staff to tip on this booking', 400);

  // Prevent duplicate tip
  const existingTip = await tipsCol().findOne({ bookingId, fromId: new ObjectId(user.id) });
  if (existingTip) throw new AppError('RESOURCE_CONFLICT', 'You have already tipped for this booking', 409);

  const now = new Date();
  const doc = {
    bookingId,
    fromId: new ObjectId(user.id),
    toId: new ObjectId(String(resourceId)),
    amount: req.body.amount,
    currency: req.body.currency,
    status: 'pending', // will be processed via payout engine
    createdAt: now,
    updatedAt: now,
  };
  const ins = await tipsCol().insertOne(doc);

  // Notify resource
  await enqueueJob(QUEUES.NOTIFICATIONS, {
    type: 'tip_received',
    userId: String(resourceId),
    title: 'You received a tip!',
    body: `${req.body.currency} ${req.body.amount} tip for booking #${String(bookingId).slice(-8)}.`,
    data: { bookingId: String(bookingId), amount: req.body.amount },
  }).catch(() => {});

  res.status(201).json({ success: true, data: { _id: ins.insertedId, ...doc } });
}));

export default r;
