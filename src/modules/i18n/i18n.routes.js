/**
 * Internationalization API  (Phase 4)
 *
 * Endpoints:
 *  - GET /api/i18n/countries       — list active countries
 *  - GET /api/i18n/currencies      — list currencies with live FX rates
 *  - GET /api/i18n/translations    — fetch translation keys for a lang+namespace
 *  - GET /api/i18n/geo             — detect caller's country/currency/lang
 *
 * Admin endpoints:
 *  - CRUD on countries collection
 *  - CRUD on currencies collection
 *  - CRUD on translations (namespace, lang, key, value)
 *  - Trigger FX rate refresh
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
import { enqueueJob, QUEUES } from '../../queue/index.js';

const r = Router();

const countriesCol = () => getDb().collection('countries');
const currenciesCol = () => getDb().collection('currencies');
const translationsCol = () => getDb().collection('translations');

/* ─── Public endpoints ───────────────────────────────────────── */

// GET /api/i18n/geo — what country/lang/currency did we detect?
r.get('/geo', asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.geo || { country: 'IN', currency: 'INR', lang: 'en' } });
}));

// GET /api/i18n/countries
r.get('/countries', asyncHandler(async (_req, res) => {
  const cached = await redis.get('i18n:countries').catch(() => null);
  if (cached) return res.json({ success: true, data: JSON.parse(cached) });

  const items = await countriesCol().find({ active: true })
    .project({ code: 1, name: 1, currency: 1, defaultLang: 1, supportedLangs: 1, phoneFormat: 1 })
    .toArray();
  await redis.set('i18n:countries', JSON.stringify(items), 'EX', 3600).catch(() => {});
  res.json({ success: true, data: items });
}));

// GET /api/i18n/currencies
r.get('/currencies', asyncHandler(async (_req, res) => {
  const cached = await redis.get('i18n:currencies').catch(() => null);
  if (cached) return res.json({ success: true, data: JSON.parse(cached) });

  const items = await currenciesCol().find({}).toArray();
  await redis.set('i18n:currencies', JSON.stringify(items), 'EX', 3600).catch(() => {});
  res.json({ success: true, data: items });
}));

// GET /api/i18n/translations?lang=ar&namespace=common
r.get('/translations', asyncHandler(async (req, res) => {
  const lang = req.query.lang || 'en';
  const namespace = req.query.namespace || 'common';
  const country = req.query.country;

  const cacheKey = `i18n:translations:${lang}:${namespace}:${country || 'all'}`;
  const cached = await redis.get(cacheKey).catch(() => null);
  if (cached) return res.json({ success: true, data: JSON.parse(cached) });

  const filter = { lang, namespace };
  if (country) filter.$or = [{ country }, { country: { $exists: false } }];

  const rows = await translationsCol().find(filter).toArray();

  // Build key-value map, country-specific overrides generic
  const map = {};
  // First pass: generic (no country)
  for (const r of rows.filter((x) => !x.country)) map[r.key] = r.value;
  // Second pass: country-specific overrides
  for (const r of rows.filter((x) => x.country)) map[r.key] = r.value;

  await redis.set(cacheKey, JSON.stringify(map), 'EX', 600).catch(() => {});
  res.json({ success: true, data: map });
}));

/* ─── Admin: Countries ───────────────────────────────────────── */
const countrySchema = z.object({
  code: z.string().length(2).toUpperCase(),
  name: z.string().min(1),
  currency: z.string().length(3).toUpperCase(),
  defaultLang: z.string().default('en'),
  supportedLangs: z.array(z.string()).default(['en']),
  taxRules: z.object({
    type: z.enum(['gst', 'vat', 'sales_tax', 'none']).default('none'),
    rate: z.number().min(0).max(1).default(0),
    inclusive: z.boolean().default(false),
  }).optional().default({}),
  gateways: z.array(z.string()).default([]),
  phoneFormat: z.string().optional(),
  addressSchema: z.record(z.any()).optional().default({}),
  active: z.boolean().default(true),
});

r.get('/admin/countries', adminGuard, permGuard(PERMS.SERVICE_READ), asyncHandler(async (_req, res) => {
  const items = await countriesCol().find({}).sort({ code: 1 }).toArray();
  res.json({ success: true, data: items });
}));

r.post('/admin/countries', adminGuard, permGuard(PERMS.SERVICE_WRITE), auditAdmin, validate(countrySchema), asyncHandler(async (req, res) => {
  const exists = await countriesCol().findOne({ code: req.body.code });
  if (exists) throw new AppError('RESOURCE_CONFLICT', 'Country already exists', 409);
  const now = new Date();
  const doc = { ...req.body, createdAt: now, updatedAt: now };
  const ins = await countriesCol().insertOne(doc);
  await redis.del('i18n:countries').catch(() => {});
  res.status(201).json({ success: true, data: { _id: ins.insertedId, ...doc } });
}));

r.put('/admin/countries/:code', adminGuard, permGuard(PERMS.SERVICE_WRITE), auditAdmin, validate(countrySchema.partial()), asyncHandler(async (req, res) => {
  await countriesCol().updateOne({ code: req.params.code.toUpperCase() }, { $set: { ...req.body, updatedAt: new Date() } });
  await redis.del('i18n:countries').catch(() => {});
  res.json({ success: true });
}));

/* ─── Admin: Currencies ──────────────────────────────────────── */
r.get('/admin/currencies', adminGuard, permGuard(PERMS.SERVICE_READ), asyncHandler(async (_req, res) => {
  const items = await currenciesCol().find({}).sort({ code: 1 }).toArray();
  res.json({ success: true, data: items });
}));

r.put('/admin/currencies/:code', adminGuard, permGuard(PERMS.FINANCE), auditAdmin, validate(z.object({
  symbol: z.string().optional(),
  fxToBase: z.number().positive().optional(),
})), asyncHandler(async (req, res) => {
  await currenciesCol().updateOne(
    { code: req.params.code.toUpperCase() },
    { $set: { ...req.body, updatedAt: new Date() } },
    { upsert: true },
  );
  await redis.del('i18n:currencies').catch(() => {});
  res.json({ success: true });
}));

// Trigger FX rate refresh via queue
r.post('/admin/currencies/refresh', adminGuard, permGuard(PERMS.PAYOUT_WRITE), auditAdmin, asyncHandler(async (_req, res) => {
  await enqueueJob(QUEUES.ANALYTICS, { type: 'refresh_fx_rates' });
  res.json({ success: true, message: 'FX rate refresh queued' });
}));

/* ─── Admin: Translations ────────────────────────────────────── */
r.get('/admin/translations', adminGuard, permGuard(PERMS.CMS_READ), asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.lang) filter.lang = req.query.lang;
  if (req.query.namespace) filter.namespace = req.query.namespace;
  const items = await translationsCol().find(filter).sort({ namespace: 1, key: 1 }).limit(500).toArray();
  res.json({ success: true, data: items });
}));

r.post('/admin/translations', adminGuard, permGuard(PERMS.CMS_WRITE), auditAdmin, validate(z.object({
  lang: z.string().min(2).max(5),
  namespace: z.string().min(1),
  key: z.string().min(1),
  value: z.string(),
  country: z.string().optional(),
})), asyncHandler(async (req, res) => {
  const { lang, namespace, key, value, country } = req.body;
  const filter = { lang, namespace, key };
  if (country) filter.country = country;

  await translationsCol().updateOne(filter, { $set: { value, updatedAt: new Date() } }, { upsert: true });

  // Invalidate cache for this lang+namespace combo
  await redis.del(`i18n:translations:${lang}:${namespace}:${country || 'all'}`).catch(() => {});
  res.json({ success: true });
}));

export default r;
