/**
 * CMS Expansion  (Phase 3)
 *
 * Adds:
 *  - Pages (slug-based, country-aware, versioned, SEO meta)
 *  - Banners (A/B variants, country-aware, scheduled, segment)
 *  - Notification templates (per event/channel/lang/country)
 *  - Blog / help-center articles (basic)
 *
 * All admin writes require growth or above role.
 */
import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { nanoid } from 'nanoid';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { adminGuard, permGuard } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getDb } from '../../config/db.js';
import { ObjectId } from 'mongodb';
import { AppError } from '../../utils/AppError.js';
import { toObjectId } from '../../utils/oid.js';
import { paginate, buildMeta } from '../../utils/pagination.js';
import { PERMS } from '../../config/rbac.js';
import { redis } from '../../config/redis.js';
import { s3 } from '../../config/aws.js';
import { env } from '../../config/env.js';

const r = Router();

const pagesCol = () => getDb().collection('cms_pages');
const bannersCol = () => getDb().collection('cms_banners');
const templatesCol = () => getDb().collection('notification_templates');
const articlesCol = () => getDb().collection('cms_articles');

/* ═══════════════════════════════════════════════════════════════
   PAGES
═══════════════════════════════════════════════════════════════ */

const pageSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-/]+$/),
  title: z.string().min(1).max(200),
  blocks: z.array(z.any()).default([]),
  seo: z.object({
    metaTitle: z.string().max(70).optional(),
    metaDescription: z.string().max(160).optional(),
    keywords: z.array(z.string()).optional().default([]),
  }).optional().default({}),
  country: z.string().optional(),
  lang: z.string().default('en'),
  status: z.enum(['draft', 'published']).default('draft'),
});

// Public: GET /api/cms-x/pages/:slug?lang=en&country=IN
r.get('/pages/:slug', asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const country = req.query.country;
  const lang = req.query.lang || 'en';

  const cacheKey = `cms:page:${slug}:${lang}:${country || 'all'}`;
  const cached = await redis.get(cacheKey).catch(() => null);
  if (cached) return res.json({ success: true, data: JSON.parse(cached) });

  // Try country-specific first, then fallback to generic
  const page = await pagesCol().findOne({
    slug,
    lang,
    status: 'published',
    $or: [{ country }, { country: { $exists: false } }],
  }) || await pagesCol().findOne({ slug, lang: 'en', status: 'published', country: { $exists: false } });

  if (!page) throw new AppError('RESOURCE_NOT_FOUND', 'Page not found', 404);

  await redis.set(cacheKey, JSON.stringify(page), 'EX', 300).catch(() => {});
  res.json({ success: true, data: page });
}));

// Admin: list pages
r.get('/pages', adminGuard, permGuard(PERMS.CMS_READ), asyncHandler(async (req, res) => {
  const p = paginate(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.lang) filter.lang = req.query.lang;
  const [items, total] = await Promise.all([
    pagesCol().find(filter).sort({ updatedAt: -1 }).skip(p.skip).limit(p.limit).toArray(),
    pagesCol().countDocuments(filter),
  ]);
  res.json({ success: true, data: items, meta: buildMeta({ page: p.page, pageSize: p.pageSize, total }) });
}));

// Admin: create page
r.post('/pages', adminGuard, permGuard(PERMS.CMS_WRITE), validate(pageSchema), asyncHandler(async (req, res) => {
  const now = new Date();
  const doc = { ...req.body, version: 1, createdBy: new ObjectId(req.user.id), createdAt: now, updatedAt: now, publishedAt: req.body.status === 'published' ? now : null };
  const ins = await pagesCol().insertOne(doc);
  res.status(201).json({ success: true, data: { _id: ins.insertedId, ...doc } });
}));

// Admin: update page
r.put('/pages/:id', adminGuard, permGuard(PERMS.CMS_WRITE), validate(pageSchema.partial()), asyncHandler(async (req, res) => {
  const id = toObjectId(req.params.id);
  const $set = { ...req.body, updatedAt: new Date() };
  if ($set.status === 'published') $set.publishedAt = new Date();
  delete $set._id;
  await pagesCol().updateOne({ _id: id }, { $set, $inc: { version: 1 } });
  // Invalidate cache for this page
  const page = await pagesCol().findOne({ _id: id });
  if (page) await redis.del(`cms:page:${page.slug}:${page.lang}:${page.country || 'all'}`).catch(() => {});
  res.json({ success: true, data: page });
}));

// Admin: delete page
r.delete('/pages/:id', adminGuard, permGuard(PERMS.CMS_WRITE), asyncHandler(async (req, res) => {
  await pagesCol().deleteOne({ _id: toObjectId(req.params.id) });
  res.json({ success: true });
}));

/* ═══════════════════════════════════════════════════════════════
   BANNERS
═══════════════════════════════════════════════════════════════ */

/* ───────────────── Banner schema (Phase 8 — multi-locale + slider) ────
 *
 * Every text-bearing field accepts EITHER a plain string (back-compat
 * with the original schema) OR an i18n object keyed by locale, e.g.
 *   title: { en: 'Hello', hi: 'नमस्ते', de: 'Hallo' }
 * The frontend resolves to the active locale at render time and falls
 * back to en → first available value if a locale is missing.
 *
 * Variants drive the rendering template:
 *   simple        — Title + body + CTA over an image / video (default)
 *   expert-match  — Title + body + CTA on the left, expert cards w/
 *                   experience badges on the right (the "Not sure what
 *                   you need" layout)
 *   video-hero    — Full-bleed background video with overlaid title +
 *                   CTA
 *   split         — 50/50 image-or-video left, text-with-CTA right
 *
 * Positions cover the full customer-facing surface area; staff portals
 * stay banner-free.
 */
const i18nString = z.union([z.string().max(500), z.record(z.string().max(500))]).optional();

const expertSchema = z.object({
  name:     z.string().max(100),
  role:     z.string().max(100).optional().default(''),
  imageUrl: z.string().url().optional(),
  yearsOfExperience: z.coerce.number().int().min(0).max(80).optional(),
  verified: z.boolean().optional().default(true),
});

const POSITION_ENUM = z.enum([
  'home-hero', 'home-secondary', 'home-mid', 'home-bottom',
  'services-top', 'service-detail-top',
  'booking-flow-top', 'checkout-top',
  'profile-top', 'cart-top', 'search-top',
  // Featured banners — shared across home / how-it-works / book-your-resource.
  // Single CMS record drives all three surfaces so admins change copy + image
  // (per country + per locale) in one place without a deploy.
  'featured-find-experts',
  // Legacy values kept for back-compat with existing DB records
  'hero', 'inline', 'popup', 'sidebar',
  'homepage_hero', 'homepage_mid',
]);

const bannerSchema = z.object({
  // Internal-only label shown in the admin list. NOT shown to users.
  internalName: z.string().max(200).optional(),

  // Display fields — all accept plain string OR { locale: value } map.
  title:     i18nString,
  body:      i18nString,
  ctaLabel:  i18nString,
  ctaUrl:    z.string().max(500).optional(),

  // Media: one mediaUrl + mediaType. Optional per-locale override map.
  mediaType:       z.enum(['image', 'video']).optional().default('image'),
  mediaUrl:        z.string().max(2000).optional(),
  mediaUrlByLocale: z.record(z.string().max(2000)).optional(),

  // Layout / behaviour
  variant:         z.enum(['simple', 'expert-match', 'video-hero', 'split']).optional().default('simple'),
  experts:         z.array(expertSchema).optional().default([]),
  order:           z.coerce.number().int().optional().default(0),
  autoplayMs:      z.coerce.number().int().min(2000).max(60000).optional(),

  // Targeting
  position:        POSITION_ENUM.optional().default('home-hero'),
  country:         z.string().length(2).optional(),
  segment:         z.array(z.string()).optional().default(['all']),
  abVariant:       z.enum(['A', 'B', 'all']).optional().default('all'),

  // Lifecycle
  validFrom:       z.string().datetime().optional(),
  validTo:         z.string().datetime().optional(),
  active:          z.boolean().optional().default(true),

  // ── Back-compat fields (original v1 schema). Old admin clients still
  //    send these; we accept and merge them into the canonical fields
  //    below in the create/update handlers.
  image:    z.string().url().optional(),
  link:     z.string().optional(),
  imageUrl: z.string().url().optional(),
  linkUrl:  z.string().optional(),
  placement: z.string().optional(),
  startsAt:  z.string().optional(),
  endsAt:    z.string().optional(),
});

/**
 * Normalise a banner doc on read so consumers always see the new shape
 * regardless of what variant of admin form created the record. Old docs
 * with `image` / `link` / `placement` / `startsAt` / `endsAt` fields are
 * mirrored into the new `mediaUrl` / `ctaUrl` / `position` / `validFrom`
 * / `validTo` slots so the frontend renderer doesn't need to know about
 * the legacy field names.
 */
function normaliseBannerOut(doc) {
  if (!doc) return doc;
  const out = { ...doc };
  if (!out.mediaUrl && (out.image || out.imageUrl)) out.mediaUrl = out.image || out.imageUrl;
  if (!out.ctaUrl && (out.link  || out.linkUrl))    out.ctaUrl = out.link || out.linkUrl;
  if (!out.position && out.placement) {
    // Map legacy placement strings to the new enum values.
    const map = { homepage_hero: 'home-hero', homepage_mid: 'home-mid', services_top: 'services-top',
                  checkout: 'checkout-top', sidebar: 'home-secondary' };
    out.position = map[out.placement] || out.placement;
  }
  if (!out.validFrom && out.startsAt) out.validFrom = out.startsAt;
  if (!out.validTo   && out.endsAt)   out.validTo   = out.endsAt;
  if (!out.mediaType) out.mediaType = 'image';
  if (!out.variant)   out.variant   = 'simple';
  return out;
}

/**
 * Normalise an incoming write so we always store the canonical shape.
 * Drops legacy aliases after copying their values into the new fields,
 * which keeps the DB clean even if the client uses old field names.
 */
function normaliseBannerIn(body) {
  const doc = { ...body };
  if (!doc.mediaUrl && (doc.image || doc.imageUrl)) doc.mediaUrl = doc.image || doc.imageUrl;
  if (!doc.ctaUrl && (doc.link || doc.linkUrl)) doc.ctaUrl = doc.link || doc.linkUrl;
  if (!doc.position && doc.placement) {
    const map = { homepage_hero: 'home-hero', homepage_mid: 'home-mid', services_top: 'services-top',
                  checkout: 'checkout-top', sidebar: 'home-secondary' };
    doc.position = map[doc.placement] || doc.placement;
  }
  if (!doc.validFrom && doc.startsAt) doc.validFrom = doc.startsAt;
  if (!doc.validTo && doc.endsAt) doc.validTo = doc.endsAt;
  // Drop legacy aliases — they're already mirrored.
  delete doc.image; delete doc.imageUrl;
  delete doc.link;  delete doc.linkUrl;
  delete doc.placement;
  delete doc.startsAt; delete doc.endsAt;
  return doc;
}

// Public: GET /api/cms-x/banners?country=IN&position=home-hero
r.get('/banners', asyncHandler(async (req, res) => {
  const now = new Date();
  const filter = { active: true };
  // Lifecycle window — if validFrom/validTo are unset on a record we
  // don't filter on them (treat the banner as always-valid).
  filter.$and = [
    { $or: [{ validFrom: { $lte: now } }, { validFrom: { $exists: false } }] },
    { $or: [{ validTo:   { $gte: now } }, { validTo:   { $exists: false } }] },
  ];
  if (req.query.country) {
    filter.$and.push({ $or: [{ country: req.query.country }, { country: { $exists: false } }, { country: '' }] });
  }
  if (req.query.position) {
    // Match canonical + legacy placement aliases for the same surface.
    const reverseMap = {
      'home-hero': ['home-hero', 'hero', 'homepage_hero'],
      'home-mid':  ['home-mid', 'homepage_mid'],
      'services-top': ['services-top', 'services_top'],
      'checkout-top': ['checkout-top', 'checkout'],
      'home-secondary': ['home-secondary', 'sidebar'],
    };
    const want = String(req.query.position);
    const aliases = reverseMap[want] || [want];
    filter.$and.push({ position: { $in: aliases } });
  }

  // Ordering: explicit `order` ascending, then newest first within same
  // order so admins can promote a banner to the top by setting order: 0.
  const items = await bannersCol()
    .find(filter)
    .sort({ order: 1, createdAt: -1 })
    .limit(20)
    .toArray();
  res.json({ success: true, data: items.map(normaliseBannerOut) });
}));

// Admin: list all
r.get('/banners/all', adminGuard, permGuard(PERMS.CMS_READ), asyncHandler(async (req, res) => {
  const p = paginate(req.query);
  const [items, total] = await Promise.all([
    bannersCol().find({}).sort({ position: 1, order: 1, createdAt: -1 }).skip(p.skip).limit(p.limit).toArray(),
    bannersCol().countDocuments({}),
  ]);
  res.json({ success: true, data: items.map(normaliseBannerOut), meta: buildMeta({ page: p.page, pageSize: p.pageSize, total }) });
}));

// Admin: create banner
r.post('/banners', adminGuard, permGuard(PERMS.CMS_WRITE), validate(bannerSchema), asyncHandler(async (req, res) => {
  const now = new Date();
  const body = normaliseBannerIn(req.body);
  const doc = {
    ...body,
    validFrom: body.validFrom ? new Date(body.validFrom) : undefined,
    validTo:   body.validTo   ? new Date(body.validTo)   : undefined,
    createdBy: new ObjectId(req.user.id),
    createdAt: now,
    updatedAt: now,
  };
  const ins = await bannersCol().insertOne(doc);
  res.status(201).json({ success: true, data: normaliseBannerOut({ _id: ins.insertedId, ...doc }) });
}));

// Admin: update banner
r.put('/banners/:id', adminGuard, permGuard(PERMS.CMS_WRITE), validate(bannerSchema.partial()), asyncHandler(async (req, res) => {
  const id = toObjectId(req.params.id);
  const body = normaliseBannerIn(req.body);
  const $set = { ...body, updatedAt: new Date() };
  if ($set.validFrom) $set.validFrom = new Date($set.validFrom);
  if ($set.validTo)   $set.validTo   = new Date($set.validTo);
  delete $set._id;
  await bannersCol().updateOne({ _id: id }, { $set });
  res.json({ success: true });
}));

r.delete('/banners/:id', adminGuard, permGuard(PERMS.CMS_WRITE), asyncHandler(async (req, res) => {
  await bannersCol().deleteOne({ _id: toObjectId(req.params.id) });
  res.json({ success: true });
}));

/**
 * Admin: upload a banner image directly from the file picker. Sends to
 * S3 if configured, otherwise returns 501 so the admin falls back to the
 * URL-paste field. Limit 5 MB; PNG / JPG / WEBP / SVG only.
 *
 * The returned URL is dropped straight into the form's mediaUrl field —
 * country-specific banners just upload their own image per record, no
 * extra wiring needed.
 */
const bannerUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(png|jpe?g|webp|svg\+xml)$/.test(file.mimetype || '');
    cb(ok ? null : new AppError('VALIDATION_ERROR', 'Only PNG/JPG/WEBP/SVG up to 5 MB', 400), ok);
  },
});

r.post('/banners/upload',
  adminGuard,
  permGuard(PERMS.CMS_WRITE),
  bannerUpload.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new AppError('VALIDATION_ERROR', 'No file uploaded', 400);
    if (!env.S3_BUCKET_CHAT) {
      // S3 not configured — admin can still paste a URL into the form.
      throw new AppError('NOT_IMPLEMENTED', 'Image upload requires S3 to be configured. Paste a URL instead.', 501);
    }
    const ext = (req.file.originalname.match(/\.[a-z0-9]+$/i) || [''])[0];
    const key = `cms/banners/${nanoid(12)}${ext}`;
    await s3.send(new PutObjectCommand({
      Bucket: env.S3_BUCKET_CHAT,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      CacheControl: 'public, max-age=31536000, immutable',
    }));
    const url = `https://${env.S3_BUCKET_CHAT}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
    res.status(201).json({ success: true, data: { url, key, size: req.file.size, contentType: req.file.mimetype } });
  })
);

/**
 * Admin: drop the starter banner set into cms_banners. Same idempotent
 * upsert that runs at first boot — admins can re-trigger via the empty
 * state CTA when they wipe the collection or want to refresh the
 * starter copy. `force: true` re-runs even when banners already exist
 * (default: skip if any banner is present so we don't trample custom
 * content).
 */
r.post('/banners/seed', adminGuard, permGuard(PERMS.CMS_WRITE), asyncHandler(async (req, res) => {
  const { seedStarterBanners, seedStarterBannersIfEmpty } = await import('../../scripts/seed-banners.js');
  if (req.body?.force === true) {
    const result = await seedStarterBanners(getDb());
    return res.json({ success: true, data: { mode: 'force', ...result } });
  }
  const result = await seedStarterBannersIfEmpty(getDb());
  res.json({ success: true, data: { mode: 'if-empty', ...result } });
}));

/* ═══════════════════════════════════════════════════════════════
   NOTIFICATION TEMPLATES
═══════════════════════════════════════════════════════════════ */

const templateSchema = z.object({
  event: z.string().min(1), // e.g. 'booking_created'
  channel: z.enum(['email', 'sms', 'push', 'inapp']),
  lang: z.string().default('en'),
  country: z.string().optional(),
  subject: z.string().max(200).optional(),
  body: z.string().min(1),
  // Handlebars-style vars: {{userName}}, {{bookingId}}
  vars: z.array(z.string()).default([]),
  active: z.boolean().default(true),
});

// Public / internal: get template by event+channel+lang
r.get('/notification-templates/:event', asyncHandler(async (req, res) => {
  const { event } = req.params;
  const channel = req.query.channel || 'inapp';
  const lang = req.query.lang || 'en';
  const country = req.query.country;

  const filter = { event, channel, active: true };
  // Try country+lang, then lang, then 'en'
  const template = await templatesCol().findOne({ ...filter, lang, country }) ||
    await templatesCol().findOne({ ...filter, lang }) ||
    await templatesCol().findOne({ ...filter, lang: 'en' });

  if (!template) throw new AppError('RESOURCE_NOT_FOUND', 'Template not found', 404);
  res.json({ success: true, data: template });
}));

r.get('/notification-templates', adminGuard, permGuard(PERMS.CMS_READ), asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.event) filter.event = req.query.event;
  if (req.query.channel) filter.channel = req.query.channel;
  const items = await templatesCol().find(filter).sort({ event: 1, channel: 1, lang: 1 }).limit(200).toArray();
  res.json({ success: true, data: items });
}));

r.post('/notification-templates', adminGuard, permGuard(PERMS.CMS_WRITE), validate(templateSchema), asyncHandler(async (req, res) => {
  const now = new Date();
  const doc = { ...req.body, createdBy: new ObjectId(req.user.id), createdAt: now, updatedAt: now };
  const ins = await templatesCol().insertOne(doc);
  res.status(201).json({ success: true, data: { _id: ins.insertedId, ...doc } });
}));

r.put('/notification-templates/:id', adminGuard, permGuard(PERMS.CMS_WRITE), validate(templateSchema.partial()), asyncHandler(async (req, res) => {
  const id = toObjectId(req.params.id);
  await templatesCol().updateOne({ _id: id }, { $set: { ...req.body, updatedAt: new Date() } });
  res.json({ success: true });
}));

/* ═══════════════════════════════════════════════════════════════
   ARTICLES (blog / help center)
═══════════════════════════════════════════════════════════════ */

const articleSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  category: z.string().default('help'),
  lang: z.string().default('en'),
  country: z.string().optional(),
  tags: z.array(z.string()).default([]),
  status: z.enum(['draft', 'published']).default('draft'),
  seo: z.object({
    metaTitle: z.string().max(70).optional(),
    metaDescription: z.string().max(160).optional(),
  }).optional().default({}),
});

r.get('/articles', asyncHandler(async (req, res) => {
  const filter = { status: 'published' };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.lang) filter.lang = req.query.lang;
  const items = await articlesCol().find(filter).sort({ publishedAt: -1 }).limit(50).project({ content: 0 }).toArray();
  res.json({ success: true, data: items });
}));

r.get('/articles/:slug', asyncHandler(async (req, res) => {
  const article = await articlesCol().findOne({ slug: req.params.slug, status: 'published' });
  if (!article) throw new AppError('RESOURCE_NOT_FOUND', 'Article not found', 404);
  res.json({ success: true, data: article });
}));

r.post('/articles', adminGuard, permGuard(PERMS.CMS_WRITE), validate(articleSchema), asyncHandler(async (req, res) => {
  const now = new Date();
  const doc = { ...req.body, publishedAt: req.body.status === 'published' ? now : null, createdBy: new ObjectId(req.user.id), createdAt: now, updatedAt: now };
  const ins = await articlesCol().insertOne(doc);
  res.status(201).json({ success: true, data: { _id: ins.insertedId, ...doc } });
}));

r.put('/articles/:id', adminGuard, permGuard(PERMS.CMS_WRITE), validate(articleSchema.partial()), asyncHandler(async (req, res) => {
  const id = toObjectId(req.params.id);
  const $set = { ...req.body, updatedAt: new Date() };
  if ($set.status === 'published') $set.publishedAt = new Date();
  delete $set._id;
  await articlesCol().updateOne({ _id: id }, { $set });
  res.json({ success: true });
}));

export default r;
