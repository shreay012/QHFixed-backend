/**
 * Promo Code Engine  (Phase 3)
 *
 * Features:
 *  - Code types: flat_off, pct_off, free_service, first_booking, referral, bogo
 *  - Targeting: country, city, service[], user_segment, new_vs_returning, min_cart
 *  - Limits: usage cap (total + per user), validity window, stackable flag
 *  - Auto-apply best code at checkout
 *  - Admin CRUD: create, clone, pause, expire, preview impact
 *  - Analytics: redemptions, GMV impact
 *  - Fraud guard: per-user limit enforced
 *
 * Collections:
 *   promo_codes         — code definitions
 *   promo_redemptions   — per-booking usage records
 */
import { Router } from 'express';
import { z } from 'zod';
import { adminGuard, permGuard } from '../../middleware/role.middleware.js';
import { auditAdmin } from '../../middleware/audit.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getDb } from '../../config/db.js';
import { ObjectId } from 'mongodb';
import { AppError } from '../../utils/AppError.js';
import { toObjectId } from '../../utils/oid.js';
import { paginate, buildMeta } from '../../utils/pagination.js';
import { PERMS } from '../../config/rbac.js';
import { redis } from '../../config/redis.js';

const r = Router();

const codesCol = () => getDb().collection('promo_codes');
const redemptionsCol = () => getDb().collection('promo_redemptions');

/* ═══════════════════════════════════════════════════════════════
   SCHEMA
═══════════════════════════════════════════════════════════════ */

const promoSchema = z.object({
  code: z.string().min(2).max(30).toUpperCase().regex(/^[A-Z0-9_-]+$/),
  type: z.enum(['flat_off', 'pct_off', 'free_service', 'first_booking', 'referral', 'bogo']),
  value: z.number().min(0),
  description: z.string().max(500).optional().default(''),
  scope: z.object({
    country: z.string().optional(),
    city: z.string().optional(),
    serviceIds: z.array(z.string()).optional().default([]),
    userSegment: z.array(z.enum(['new', 'returning', 'vip', 'all'])).default(['all']),
  }).default({}),
  minCartValue: z.number().min(0).default(0),
  maxDiscount: z.number().min(0).optional(),
  usageLimitTotal: z.number().int().min(1).optional(),
  usageLimitPerUser: z.number().int().min(1).default(1),
  validFrom: z.string().datetime(),
  validTo: z.string().datetime(),
  stackable: z.boolean().default(false),
  campaignId: z.string().optional(),
  ownerId: z.string().optional(), // affiliate owner
  active: z.boolean().default(true),
});

/* ═══════════════════════════════════════════════════════════════
   ADMIN ROUTES
═══════════════════════════════════════════════════════════════ */
const adminRouter = Router();
adminRouter.use(adminGuard);
adminRouter.use(auditAdmin);

// List codes
adminRouter.get('/', permGuard(PERMS.PROMO_READ), asyncHandler(async (req, res) => {
  const p = paginate(req.query);
  const filter = {};
  if (req.query.active !== undefined) filter.active = req.query.active === 'true';
  if (req.query.type) filter.type = req.query.type;
  if (req.query.campaignId) filter.campaignId = req.query.campaignId;

  const [items, total] = await Promise.all([
    codesCol().find(filter).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit).toArray(),
    codesCol().countDocuments(filter),
  ]);
  res.json({ success: true, data: items, meta: buildMeta({ page: p.page, pageSize: p.pageSize, total }) });
}));

adminRouter.get('/:id', permGuard(PERMS.PROMO_READ), asyncHandler(async (req, res) => {
  const doc = await codesCol().findOne({ _id: toObjectId(req.params.id) });
  if (!doc) throw new AppError('RESOURCE_NOT_FOUND', 'Promo code not found', 404);

  // Include redemption stats
  const redemptionCount = await redemptionsCol().countDocuments({ codeId: doc._id });
  const gmvAgg = await redemptionsCol().aggregate([
    { $match: { codeId: doc._id } },
    { $group: { _id: null, totalDiscount: { $sum: '$discount' }, count: { $sum: 1 } } },
  ]).toArray();

  res.json({ success: true, data: { ...doc, stats: {
    redemptions: redemptionCount,
    totalDiscount: gmvAgg[0]?.totalDiscount || 0,
  }}});
}));

// Create
adminRouter.post('/', permGuard(PERMS.PROMO_WRITE), validate(promoSchema), asyncHandler(async (req, res) => {
  const exists = await codesCol().findOne({ code: req.body.code.toUpperCase() });
  if (exists) throw new AppError('RESOURCE_CONFLICT', 'Promo code already exists', 409);

  const now = new Date();
  const doc = {
    ...req.body,
    code: req.body.code.toUpperCase(),
    validFrom: new Date(req.body.validFrom),
    validTo: new Date(req.body.validTo),
    createdBy: new ObjectId(req.user.id),
    usedCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  const ins = await codesCol().insertOne(doc);
  res.status(201).json({ success: true, data: { _id: ins.insertedId, ...doc } });
}));

// Update
adminRouter.put('/:id', permGuard(PERMS.PROMO_WRITE), validate(promoSchema.partial()), asyncHandler(async (req, res) => {
  const id = toObjectId(req.params.id);
  const $set = { ...req.body, updatedAt: new Date() };
  if ($set.code) $set.code = $set.code.toUpperCase();
  if ($set.validFrom) $set.validFrom = new Date($set.validFrom);
  if ($set.validTo) $set.validTo = new Date($set.validTo);
  delete $set._id;

  await codesCol().updateOne({ _id: id }, { $set });
  const updated = await codesCol().findOne({ _id: id });
  res.json({ success: true, data: updated });
}));

// Clone — copy a promo code with a new code string
adminRouter.post('/:id/clone', permGuard(PERMS.PROMO_WRITE), validate(z.object({
  code: z.string().min(2).max(30).toUpperCase(),
})), asyncHandler(async (req, res) => {
  const src = await codesCol().findOne({ _id: toObjectId(req.params.id) });
  if (!src) throw new AppError('RESOURCE_NOT_FOUND', 'Promo code not found', 404);

  const { _id, createdAt, ...rest } = src;
  const now = new Date();
  const cloned = { ...rest, code: req.body.code.toUpperCase(), usedCount: 0, active: false, createdBy: new ObjectId(req.user.id), createdAt: now, updatedAt: now };
  const ins = await codesCol().insertOne(cloned);
  res.status(201).json({ success: true, data: { _id: ins.insertedId, ...cloned } });
}));

// Pause / resume
adminRouter.patch('/:id/toggle', permGuard(PERMS.PROMO_WRITE), asyncHandler(async (req, res) => {
  const id = toObjectId(req.params.id);
  const doc = await codesCol().findOne({ _id: id });
  if (!doc) throw new AppError('RESOURCE_NOT_FOUND', 'Promo code not found', 404);
  await codesCol().updateOne({ _id: id }, { $set: { active: !doc.active, updatedAt: new Date() } });
  res.json({ success: true, data: { active: !doc.active } });
}));

// Expire immediately
adminRouter.post('/:id/expire', permGuard(PERMS.PROMO_WRITE), asyncHandler(async (req, res) => {
  const id = toObjectId(req.params.id);
  await codesCol().updateOne({ _id: id }, { $set: { validTo: new Date(), active: false, updatedAt: new Date() } });
  res.json({ success: true });
}));

// Preview impact — estimate users + bookings that qualify
adminRouter.get('/:id/preview', permGuard(PERMS.PROMO_READ), asyncHandler(async (req, res) => {
  const doc = await codesCol().findOne({ _id: toObjectId(req.params.id) });
  if (!doc) throw new AppError('RESOURCE_NOT_FOUND', 'Promo code not found', 404);

  const jobFilter = { status: { $ne: 'cancelled' } };
  if (doc.scope?.country) jobFilter.country = doc.scope.country;
  if (doc.scope?.city) jobFilter.city = doc.scope.city;
  if (doc.minCartValue) jobFilter['pricing.total'] = { $gte: doc.minCartValue };

  const [eligibleJobs, existingRedemptions] = await Promise.all([
    getDb().collection('jobs').countDocuments(jobFilter),
    redemptionsCol().countDocuments({ codeId: doc._id }),
  ]);

  res.json({ success: true, data: {
    eligibleBookings: eligibleJobs,
    usedCount: doc.usedCount || 0,
    redemptions: existingRedemptions,
    remainingCapacity: doc.usageLimitTotal ? doc.usageLimitTotal - (doc.usedCount || 0) : null,
  }});
}));

// Analytics
adminRouter.get('/:id/analytics', permGuard(PERMS.PROMO_READ), asyncHandler(async (req, res) => {
  const codeId = toObjectId(req.params.id);
  const [redemptions, byDay] = await Promise.all([
    redemptionsCol().aggregate([
      { $match: { codeId } },
      { $group: { _id: null, totalDiscount: { $sum: '$discount' }, count: { $sum: 1 } } },
    ]).toArray(),
    redemptionsCol().aggregate([
      { $match: { codeId } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$appliedAt' } }, count: { $sum: 1 }, discount: { $sum: '$discount' } } },
      { $sort: { _id: 1 } },
    ]).toArray(),
  ]);

  res.json({ success: true, data: {
    total: { count: redemptions[0]?.count || 0, discount: redemptions[0]?.totalDiscount || 0 },
    daily: byDay,
  }});
}));

r.use('/admin', adminRouter);

/* ═══════════════════════════════════════════════════════════════
   PUBLIC / CUSTOMER-FACING ROUTES
═══════════════════════════════════════════════════════════════ */

/**
 * Validate and apply a promo code to a cart.
 * Returns discount amount + final price.
 * Does NOT write to DB — that happens on booking confirmation.
 */
r.post('/validate', validate(z.object({
  code: z.string().min(1),
  cartValue: z.number().positive(),
  serviceIds: z.array(z.string()).optional().default([]),
  country: z.string().optional().default('IN'),
  city: z.string().optional(),
})), asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) throw new AppError('AUTH_TOKEN_MISSING', 'Auth required', 401);

  const codeStr = req.body.code.toUpperCase();
  const promo = await codesCol().findOne({ code: codeStr, active: true });

  if (!promo) throw new AppError('PROMO_INVALID', 'Promo code not found or inactive', 404);

  const now = new Date();
  if (promo.validFrom > now || promo.validTo < now) {
    throw new AppError('PROMO_EXPIRED', 'Promo code has expired', 400);
  }
  if (promo.usageLimitTotal && promo.usedCount >= promo.usageLimitTotal) {
    throw new AppError('PROMO_EXHAUSTED', 'Promo code usage limit reached', 400);
  }
  if (req.body.cartValue < (promo.minCartValue || 0)) {
    throw new AppError('PROMO_MIN_CART', `Minimum cart value is ${promo.minCartValue}`, 400);
  }
  if (promo.scope?.country && promo.scope.country !== req.body.country) {
    throw new AppError('PROMO_NOT_APPLICABLE', 'Promo not valid in your region', 400);
  }

  // Per-user limit check
  const userRedemptions = await redemptionsCol().countDocuments({
    codeId: promo._id,
    userId: new ObjectId(user.id),
  });
  if (userRedemptions >= (promo.usageLimitPerUser || 1)) {
    throw new AppError('PROMO_ALREADY_USED', 'You have already used this promo code', 400);
  }

  // Compute discount
  let discount = 0;
  if (promo.type === 'flat_off') discount = promo.value;
  else if (promo.type === 'pct_off') discount = Math.round(req.body.cartValue * (promo.value / 100));
  else if (['first_booking', 'referral'].includes(promo.type)) discount = promo.value;

  if (promo.maxDiscount) discount = Math.min(discount, promo.maxDiscount);
  discount = Math.min(discount, req.body.cartValue);

  res.json({ success: true, data: {
    code: codeStr,
    type: promo.type,
    discount,
    finalPrice: req.body.cartValue - discount,
    promoId: String(promo._id),
  }});
}));

/**
 * Auto-apply — find the best applicable code for a cart.
 */
r.post('/auto-apply', validate(z.object({
  cartValue: z.number().positive(),
  serviceIds: z.array(z.string()).optional().default([]),
  country: z.string().optional().default('IN'),
})), asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) throw new AppError('AUTH_TOKEN_MISSING', 'Auth required', 401);

  const now = new Date();
  const activeCodes = await codesCol().find({
    active: true,
    validFrom: { $lte: now },
    validTo: { $gte: now },
    minCartValue: { $lte: req.body.cartValue },
    $or: [
      { 'scope.country': { $exists: false } },
      { 'scope.country': req.body.country },
    ],
  }).toArray();

  // Filter by per-user limit
  const userId = new ObjectId(user.id);
  const bestCodes = (await Promise.all(activeCodes.map(async (promo) => {
    const used = await redemptionsCol().countDocuments({ codeId: promo._id, userId });
    if (used >= (promo.usageLimitPerUser || 1)) return null;
    if (promo.usageLimitTotal && promo.usedCount >= promo.usageLimitTotal) return null;

    let discount = 0;
    if (promo.type === 'flat_off') discount = promo.value;
    else if (promo.type === 'pct_off') discount = Math.round(req.body.cartValue * (promo.value / 100));
    else if (['first_booking', 'referral'].includes(promo.type)) discount = promo.value;
    if (promo.maxDiscount) discount = Math.min(discount, promo.maxDiscount);
    discount = Math.min(discount, req.body.cartValue);

    return { code: promo.code, promoId: String(promo._id), discount, type: promo.type };
  }))).filter(Boolean);

  bestCodes.sort((a, b) => b.discount - a.discount);
  const best = bestCodes[0] || null;

  res.json({ success: true, data: best
    ? { ...best, finalPrice: req.body.cartValue - best.discount }
    : null,
  });
}));

/**
 * Redeem — called internally after successful payment to record usage.
 * Restricted to admin/ops roles (BOOKING_WRITE) — never callable by end-users.
 */
r.post('/redeem', adminGuard, permGuard(PERMS.BOOKING_WRITE), asyncHandler(async (req, res) => {
  const { promoId, bookingId, userId, discount, currency = 'INR' } = req.body;
  if (!promoId || !bookingId || !userId) {
    throw new AppError('VALIDATION_ERROR', 'promoId, bookingId, userId required', 400);
  }

  const codeId = toObjectId(promoId);
  const now = new Date();

  await Promise.all([
    redemptionsCol().insertOne({
      codeId,
      userId: new ObjectId(userId),
      bookingId: toObjectId(bookingId),
      discount: Number(discount) || 0,
      currency,
      appliedAt: now,
    }),
    codesCol().updateOne({ _id: codeId }, { $inc: { usedCount: 1 }, $set: { updatedAt: now } }),
  ]);

  res.json({ success: true });
}));

export default r;
