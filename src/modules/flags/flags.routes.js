/**
 * Feature Flags  (Phase 3)
 *
 * Simple percentage-based + segment-based feature flag system.
 *
 * Collection: feature_flags
 * Schema: { key, enabled, rolloutPct, segments[], description, updatedBy, updatedAt }
 *
 * Client usage:
 *   GET /api/flags?userId=xxx  → { key: enabled }  map for all flags
 *   GET /api/flags/:key?userId=xxx
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
import { PERMS } from '../../config/rbac.js';
import { redis } from '../../config/redis.js';

const r = Router();
const flagsCol = () => getDb().collection('feature_flags');

function isEnabledForUser(flag, userId) {
  if (!flag.enabled) return false;
  if (flag.rolloutPct >= 100) return true;
  if (flag.rolloutPct <= 0) return false;
  // Deterministic hash so same user always gets same result
  let hash = 0;
  const str = `${flag.key}:${userId || ''}`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const pct = Math.abs(hash) % 100;
  return pct < flag.rolloutPct;
}

/* ─── Public evaluation ──────────────────────────────────────── */

// GET /api/flags — all flag states for the current user
r.get('/', asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.query.userId || '';

  const cacheKey = `flags:all`;
  let flags = null;
  const cachedRaw = await redis.get(cacheKey).catch(() => null);
  if (cachedRaw) {
    flags = JSON.parse(cachedRaw);
  } else {
    flags = await flagsCol().find({}).toArray();
    await redis.set(cacheKey, JSON.stringify(flags), 'EX', 60).catch(() => {});
  }

  const result = {};
  for (const f of flags) {
    result[f.key] = isEnabledForUser(f, userId);
  }

  res.json({ success: true, data: result });
}));

// GET /api/flags/:key
r.get('/:key', asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.query.userId || '';
  const flag = await flagsCol().findOne({ key: req.params.key });
  if (!flag) return res.json({ success: true, data: { key: req.params.key, enabled: false } });
  res.json({ success: true, data: { key: flag.key, enabled: isEnabledForUser(flag, userId) } });
}));

/* ─── Admin management ───────────────────────────────────────── */
const adminRouter = Router();
adminRouter.use(adminGuard);
adminRouter.use(auditAdmin);

const flagSchema = z.object({
  key: z.string().min(1).max(100).regex(/^[a-z0-9_]+$/),
  enabled: z.boolean().default(false),
  rolloutPct: z.number().min(0).max(100).default(100),
  segments: z.array(z.string()).default([]),
  description: z.string().max(500).optional().default(''),
});

// List all flags
adminRouter.get('/', permGuard(PERMS.FLAG_READ), asyncHandler(async (_req, res) => {
  const items = await flagsCol().find({}).sort({ key: 1 }).toArray();
  res.json({ success: true, data: items });
}));

// Create flag
adminRouter.post('/', permGuard(PERMS.FLAG_WRITE), validate(flagSchema), asyncHandler(async (req, res) => {
  const exists = await flagsCol().findOne({ key: req.body.key });
  if (exists) throw new AppError('RESOURCE_CONFLICT', 'Flag key already exists', 409);

  const now = new Date();
  const doc = { ...req.body, updatedBy: new ObjectId(req.user.id), createdAt: now, updatedAt: now };
  const ins = await flagsCol().insertOne(doc);
  await redis.del('flags:all').catch(() => {});
  res.status(201).json({ success: true, data: { _id: ins.insertedId, ...doc } });
}));

// Update flag
adminRouter.put('/:key', permGuard(PERMS.FLAG_WRITE), validate(flagSchema.partial()), asyncHandler(async (req, res) => {
  const $set = { ...req.body, updatedBy: new ObjectId(req.user.id), updatedAt: new Date() };
  delete $set._id;
  const result = await flagsCol().updateOne({ key: req.params.key }, { $set });
  if (!result.matchedCount) throw new AppError('RESOURCE_NOT_FOUND', 'Flag not found', 404);
  await redis.del('flags:all').catch(() => {});
  res.json({ success: true });
}));

// Toggle enabled
adminRouter.patch('/:key/toggle', permGuard(PERMS.FLAG_WRITE), asyncHandler(async (req, res) => {
  const flag = await flagsCol().findOne({ key: req.params.key });
  if (!flag) throw new AppError('RESOURCE_NOT_FOUND', 'Flag not found', 404);
  await flagsCol().updateOne({ key: req.params.key }, { $set: { enabled: !flag.enabled, updatedBy: new ObjectId(req.user.id), updatedAt: new Date() } });
  await redis.del('flags:all').catch(() => {});
  res.json({ success: true, data: { enabled: !flag.enabled } });
}));

// Delete flag
adminRouter.delete('/:key', permGuard(PERMS.FLAG_WRITE), asyncHandler(async (req, res) => {
  await flagsCol().deleteOne({ key: req.params.key });
  await redis.del('flags:all').catch(() => {});
  res.json({ success: true });
}));

r.use('/admin', adminRouter);

export default r;
