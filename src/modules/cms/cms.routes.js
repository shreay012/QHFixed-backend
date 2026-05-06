import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middleware/validate.middleware.js';
import { adminGuard, permGuard } from '../../middleware/role.middleware.js';
import { PERMS } from '../../config/rbac.js';
import { getDb } from '../../config/db.js';
import { redis } from '../../config/redis.js';
import { logger } from '../../config/logger.js';
import { AppError } from '../../utils/AppError.js';
import { CMS_DEFAULTS } from './cms.defaults.js';

const r = Router();
const col = () => getDb().collection('cms_content');

const CACHE_KEY = (key) => `cache:cms:${key}`;
const CACHE_TTL = 300; // 5 min

const VALID_KEYS = Object.keys(CMS_DEFAULTS);

async function readKey(key) {
  let doc = await col().findOne({ key });
  if (!doc) {
    const seed = CMS_DEFAULTS[key];
    if (!seed) return null;
    doc = { key, items: seed, updatedAt: new Date() };
    try { await col().insertOne(doc); } catch (_) { /* race-safe */ }
  }
  return doc;
}

// Public: list all keys (lightweight)
r.get('/', asyncHandler(async (_req, res) => {
  res.json({ success: true, data: { keys: VALID_KEYS } });
}));

// Public: get content by key (Redis-cached, 5 min)
r.get('/:key', asyncHandler(async (req, res) => {
  const key = req.params.key;
  if (!VALID_KEYS.includes(key)) throw new AppError('RESOURCE_NOT_FOUND', `Unknown CMS key: ${key}`, 404);
  try {
    const cached = await redis.get(CACHE_KEY(key));
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json({ success: true, data: { key, items: JSON.parse(cached) } });
    }
  } catch (e) { logger.warn({ err: e, key }, 'cms cache read failed'); }
  const doc = await readKey(key);
  const items = doc?.items || [];
  try { await redis.set(CACHE_KEY(key), JSON.stringify(items), 'EX', CACHE_TTL); } catch {}
  res.setHeader('X-Cache', 'MISS');
  res.json({ success: true, data: { key, items } });
}));

// Admin: replace content for a key (invalidates cache)
const updateSchema = z.object({ items: z.array(z.any()) });
r.put('/:key', adminGuard, permGuard(PERMS.CMS_WRITE), validate(updateSchema), asyncHandler(async (req, res) => {
  const key = req.params.key;
  if (!VALID_KEYS.includes(key)) throw new AppError('RESOURCE_NOT_FOUND', `Unknown CMS key: ${key}`, 404);
  await col().updateOne(
    { key },
    { $set: { key, items: req.body.items, updatedAt: new Date() } },
    { upsert: true },
  );
  try { await redis.del(CACHE_KEY(key)); } catch {}
  res.json({ success: true, message: 'Updated' });
}));

export default r;
