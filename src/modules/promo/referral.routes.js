/**
 * Referral & Affiliate System  (Phase 3)
 *
 * Referral: each user gets an auto-generated personal referral code.
 *   When a new user books with that code, the referrer earns credit.
 *
 * Affiliate: influencer/business codes with commission tracking.
 *   Each redemption logs commission; finance can query and pay out.
 *
 * Collections:
 *   promo_codes         — the referral/affiliate code (type = referral)
 *   promo_redemptions   — usage records (with referrerId or affiliateId)
 *   affiliate_commissions — computed commission lines
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

const r = Router();
const codesCol = () => getDb().collection('promo_codes');
const commissionsCol = () => getDb().collection('affiliate_commissions');
const redemptionsCol = () => getDb().collection('promo_redemptions');
const usersCol = () => getDb().collection('users');

function generateReferralCode(userId) {
  const suffix = String(userId).slice(-6).toUpperCase();
  return `REF${suffix}`;
}

/* ─── Referral Code ──────────────────────────────────────────── */

// GET /api/referral/my-code — get or create personal referral code
r.get('/my-code', asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError('AUTH_TOKEN_MISSING', 'Auth required', 401);

  const code = generateReferralCode(req.user.id);
  const now = new Date();

  // Upsert the referral code for this user
  await codesCol().updateOne(
    { code, type: 'referral', ownerId: String(req.user.id) },
    { $setOnInsert: {
      code,
      type: 'referral',
      value: 100, // ₹100 off for referee, configurable
      description: 'Referral code',
      scope: { userSegment: ['new'] },
      minCartValue: 0,
      usageLimitPerUser: 1,
      stackable: false,
      active: true,
      usedCount: 0,
      ownerId: String(req.user.id),
      validFrom: now,
      validTo: new Date(now.getTime() + 365 * 86400_000), // 1 year
      createdAt: now,
      updatedAt: now,
    }},
    { upsert: true },
  );

  const doc = await codesCol().findOne({ code });
  const redemptionCount = await redemptionsCol().countDocuments({ codeId: doc._id });

  res.json({ success: true, data: { code, url: `https://quickhire.in/r/${code}`, redemptions: redemptionCount } });
}));

// GET /api/referral/stats — how many people I referred + earnings
r.get('/stats', asyncHandler(async (req, res) => {
  if (!req.user) throw new AppError('AUTH_TOKEN_MISSING', 'Auth required', 401);

  const code = generateReferralCode(req.user.id);
  const promoDoc = await codesCol().findOne({ code, ownerId: String(req.user.id) });
  if (!promoDoc) return res.json({ success: true, data: { referrals: 0, earned: 0 } });

  const agg = await redemptionsCol().aggregate([
    { $match: { codeId: promoDoc._id } },
    { $group: { _id: null, count: { $sum: 1 }, totalDiscount: { $sum: '$discount' } } },
  ]).toArray();

  res.json({ success: true, data: {
    referralCode: code,
    referrals: agg[0]?.count || 0,
    totalRefereeDiscount: agg[0]?.totalDiscount || 0,
  }});
}));

/* ─── Affiliate Management (admin) ──────────────────────────── */
const affiliateRouter = Router();
affiliateRouter.use(adminGuard);
affiliateRouter.use(auditAdmin);

const affiliateSchema = z.object({
  ownerId: z.string().regex(/^[0-9a-f]{24}$/),
  code: z.string().min(2).max(30).toUpperCase(),
  value: z.number().positive(),
  type: z.enum(['flat_off', 'pct_off']).default('flat_off'),
  commissionPct: z.number().min(0).max(100).default(5),
  validFrom: z.string().datetime(),
  validTo: z.string().datetime(),
  maxDiscount: z.number().positive().optional(),
  usageLimitTotal: z.number().int().positive().optional(),
});

affiliateRouter.post('/', permGuard(PERMS.PROMO_WRITE), validate(affiliateSchema), asyncHandler(async (req, res) => {
  const exists = await codesCol().findOne({ code: req.body.code });
  if (exists) throw new AppError('RESOURCE_CONFLICT', 'Code already in use', 409);

  const now = new Date();
  const doc = {
    code: req.body.code.toUpperCase(),
    type: req.body.type,
    value: req.body.value,
    description: 'Affiliate code',
    scope: { userSegment: ['all'] },
    minCartValue: 0,
    maxDiscount: req.body.maxDiscount,
    usageLimitTotal: req.body.usageLimitTotal,
    usageLimitPerUser: 1,
    stackable: false,
    active: true,
    ownerId: req.body.ownerId,
    commissionPct: req.body.commissionPct,
    isAffiliate: true,
    validFrom: new Date(req.body.validFrom),
    validTo: new Date(req.body.validTo),
    usedCount: 0,
    createdBy: new ObjectId(req.user.id),
    createdAt: now,
    updatedAt: now,
  };
  const ins = await codesCol().insertOne(doc);
  res.status(201).json({ success: true, data: { _id: ins.insertedId, ...doc } });
}));

// List affiliate codes
affiliateRouter.get('/', permGuard(PERMS.PROMO_READ), asyncHandler(async (req, res) => {
  const p = paginate(req.query);
  const filter = { isAffiliate: true };
  if (req.query.ownerId) filter.ownerId = req.query.ownerId;

  const [items, total] = await Promise.all([
    codesCol().find(filter).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit).toArray(),
    codesCol().countDocuments(filter),
  ]);
  res.json({ success: true, data: items, meta: buildMeta({ page: p.page, pageSize: p.pageSize, total }) });
}));

// Commission tracking per affiliate
affiliateRouter.get('/:code/commissions', permGuard(PERMS.PROMO_READ), asyncHandler(async (req, res) => {
  const promo = await codesCol().findOne({ code: req.params.code.toUpperCase(), isAffiliate: true });
  if (!promo) throw new AppError('RESOURCE_NOT_FOUND', 'Affiliate code not found', 404);

  const agg = await redemptionsCol().aggregate([
    { $match: { codeId: promo._id } },
    { $group: {
      _id: null,
      redemptions: { $sum: 1 },
      totalDiscount: { $sum: '$discount' },
    }},
  ]).toArray();

  const stats = agg[0] || { redemptions: 0, totalDiscount: 0 };
  const commissionEarned = Math.round((stats.totalDiscount * (promo.commissionPct || 0)) / 100);

  res.json({ success: true, data: {
    code: promo.code,
    ownerId: promo.ownerId,
    commissionPct: promo.commissionPct,
    redemptions: stats.redemptions,
    totalDiscount: stats.totalDiscount,
    commissionEarned,
  }});
}));

r.use('/affiliate', affiliateRouter);

export default r;
