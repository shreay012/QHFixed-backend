/**
 * Blog Module
 *
 * Public:
 *   GET /blog/posts              – paginated list (country, lang, category, tag, search, featured)
 *   GET /blog/posts/:slug        – single post (cached 5 min, increments viewCount)
 *   GET /blog/categories         – active categories (cached 10 min)
 *
 * Admin (adminGuard required):
 *   GET    /blog/admin/posts            – all posts (any status)
 *   POST   /blog/admin/posts            – create post
 *   GET    /blog/admin/posts/:id        – get post by ID
 *   PUT    /blog/admin/posts/:id        – update post
 *   DELETE /blog/admin/posts/:id        – delete post
 *   POST   /blog/admin/posts/:id/publish   – quick publish
 *   POST   /blog/admin/posts/:id/unpublish – quick unpublish
 *   POST   /blog/admin/upload           – S3 image upload
 *   GET    /blog/admin/categories       – list all categories
 *   POST   /blog/admin/categories       – create category
 *   PUT    /blog/admin/categories/:id   – update category
 *   DELETE /blog/admin/categories/:id   – delete category
 */
import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { nanoid } from 'nanoid';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { ObjectId } from 'mongodb';
import { adminGuard, notViewer } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getDb } from '../../config/db.js';
import { AppError } from '../../utils/AppError.js';
import { toObjectId } from '../../utils/oid.js';
import { paginate, buildMeta } from '../../utils/pagination.js';
import { redis } from '../../config/redis.js';
import { s3 } from '../../config/aws.js';
import { env } from '../../config/env.js';

const r = Router();

const postsCol = () => getDb().collection('blog_posts');
const catsCol  = () => getDb().collection('blog_categories');

// ── Schemas ────────────────────────────────────────────────────────────────

const I18nField = z.object({
  en:       z.string().default(''),
  hi:       z.string().optional().default(''),
  ar:       z.string().optional().default(''),
  de:       z.string().optional().default(''),
  es:       z.string().optional().default(''),
  fr:       z.string().optional().default(''),
  ja:       z.string().optional().default(''),
  'zh-CN':  z.string().optional().default(''),
}).default({ en: '' });

const SeoLocaleSchema = z.object({
  metaTitle:       z.string().max(70).optional().default(''),
  metaDescription: z.string().max(160).optional().default(''),
  keywords:        z.array(z.string()).optional().default([]),
  ogTitle:         z.string().max(100).optional().default(''),
  ogDescription:   z.string().max(200).optional().default(''),
  ogImage:         z.string().optional().default(''),
  canonicalUrl:    z.string().optional().default(''),
}).default({});

const LOCALE_KEYS = ['en', 'hi', 'ar', 'de', 'es', 'fr', 'ja', 'zh-CN'];

const PostSchema = z.object({
  slug:         z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
  status:       z.enum(['draft', 'published', 'scheduled', 'archived']).default('draft'),
  scheduledAt:  z.string().datetime({ offset: true }).optional().nullable(),
  featured:     z.boolean().default(false),

  title:   I18nField,
  excerpt: I18nField,
  body:    I18nField, // HTML from TipTap per locale

  seo: z.record(z.enum(['en', 'hi', 'ar', 'de', 'es', 'fr', 'ja', 'zh-CN']), SeoLocaleSchema)
         .optional().default({}),

  coverImage:          z.string().optional().default(''),
  coverImageByCountry: z.record(z.string(), z.string()).optional().default({}),

  categories: z.array(z.string()).optional().default([]),
  tags:       z.array(z.string()).optional().default([]),

  authorName:   z.string().optional().default('QuickHire Team'),
  authorAvatar: z.string().optional().default(''),
  authorBio:    I18nField,

  readingTimeMinutes: z.number().int().min(1).optional(),
});

const CategorySchema = z.object({
  slug:        z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  name:        I18nField,
  description: I18nField,
  coverImage:  z.string().optional().default(''),
  order:       z.number().int().default(0),
  active:      z.boolean().default(true),
});

// ── Helpers ────────────────────────────────────────────────────────────────

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 120);
}

function calcReadingTime(html = '') {
  const words = html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

async function tryObjId(id) {
  try { return new ObjectId(id); } catch { return null; }
}

async function invalidatePostCache(slug) {
  try {
    const keys = await redis.keys(`blog:post:${slug}:*`);
    if (keys.length) await redis.del(...keys);
  } catch {}
}

async function invalidateCatCache() {
  try {
    const keys = await redis.keys('blog:cats:*');
    if (keys.length) await redis.del(...keys);
  } catch {}
}

async function populateCategories(posts) {
  const catIds = [...new Set(posts.flatMap(p => p.categories || []))];
  if (!catIds.length) return posts.map(p => ({ ...p, categoriesData: [] }));
  const objIds = catIds.map(id => tryObjId(id)).filter(Boolean);
  const cats   = await catsCol().find({ _id: { $in: await Promise.all(objIds) } }).toArray();
  const map    = Object.fromEntries(cats.map(c => [String(c._id), c]));
  return posts.map(p => ({
    ...p,
    categoriesData: (p.categories || []).map(id => map[id]).filter(Boolean),
  }));
}

// ══════════════════════════════════════════════════════════════════════════
//  PUBLIC ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════

// GET /blog/posts
r.get('/posts', asyncHandler(async (req, res) => {
  const { country, lang = 'en', category, tag, featured, search } = req.query;
  const p = paginate(req.query);

  const filter = { status: 'published' };
  if (featured === 'true') filter.featured = true;
  if (tag) filter.tags = tag;
  if (search) {
    const rx = new RegExp(search.substring(0, 100), 'i');
    filter.$or = [{ [`title.${lang}`]: rx }, { [`excerpt.${lang}`]: rx }, { tags: rx }];
  }
  if (category) {
    const cat = await catsCol().findOne({ slug: category, active: true });
    if (cat) filter.categories = String(cat._id);
  }

  // Exclude heavy body fields from list view
  const bodyExclude = Object.fromEntries(LOCALE_KEYS.map(l => [`body.${l}`, 0]));

  const [raw, total] = await Promise.all([
    postsCol()
      .find(filter)
      .project(bodyExclude)
      .sort({ featured: -1, publishedAt: -1 })
      .skip(p.skip)
      .limit(p.limit)
      .toArray(),
    postsCol().countDocuments(filter),
  ]);

  const items = (await populateCategories(raw)).map(post => ({
    ...post,
    coverImage: (country && post.coverImageByCountry?.[country]) || post.coverImage || '',
  }));

  res.json({ success: true, data: items, meta: buildMeta({ page: p.page, pageSize: p.pageSize, total }) });
}));

// GET /blog/posts/:slug
r.get('/posts/:slug', asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const country  = req.query.country || req.headers['x-country'] || '';
  const lang     = req.query.lang    || 'en';
  const cacheKey = `blog:post:${slug}:${lang}:${country || 'all'}`;

  const cached = await redis.get(cacheKey).catch(() => null);
  if (cached) {
    postsCol().updateOne({ slug }, { $inc: { viewCount: 1 } }).catch(() => {});
    return res.json({ success: true, data: JSON.parse(cached) });
  }

  const post = await postsCol().findOne({ slug, status: 'published' });
  if (!post) throw new AppError('RESOURCE_NOT_FOUND', 'Post not found', 404);

  const catObjIds = (post.categories || []).map(id => { try { return new ObjectId(id); } catch { return null; } }).filter(Boolean);
  const cats = catObjIds.length ? await catsCol().find({ _id: { $in: catObjIds } }).toArray() : [];

  const data = {
    ...post,
    coverImage:     (country && post.coverImageByCountry?.[country]) || post.coverImage || '',
    categoriesData: cats,
  };

  await redis.set(cacheKey, JSON.stringify(data), 'EX', 300).catch(() => {});
  postsCol().updateOne({ slug }, { $inc: { viewCount: 1 } }).catch(() => {});
  res.json({ success: true, data });
}));

// GET /blog/categories
r.get('/categories', asyncHandler(async (req, res) => {
  const lang     = req.query.lang || 'en';
  const cacheKey = `blog:cats:${lang}`;
  const cached   = await redis.get(cacheKey).catch(() => null);
  if (cached) return res.json({ success: true, data: JSON.parse(cached) });

  const cats = await catsCol().find({ active: true }).sort({ order: 1, 'name.en': 1 }).toArray();
  await redis.set(cacheKey, JSON.stringify(cats), 'EX', 600).catch(() => {});
  res.json({ success: true, data: cats });
}));

// ══════════════════════════════════════════════════════════════════════════
//  ADMIN ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════

// Image upload → S3
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

r.post('/admin/upload', adminGuard, notViewer, upload.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('VALIDATION_ERROR', 'No file uploaded', 422);
  const ext    = (req.file.originalname.split('.').pop() || 'jpg').toLowerCase();
  const key    = `blog/${nanoid(16)}.${ext}`;
  const bucket = env.S3_BUCKET_CHAT || env.S3_BUCKET_INVOICES;
  if (!bucket) throw new AppError('CONFIG_ERROR', 'S3 bucket not configured', 500);
  await s3.send(new PutObjectCommand({
    Bucket:      bucket,
    Key:         key,
    Body:        req.file.buffer,
    ContentType: req.file.mimetype,
  }));
  const url = `https://${bucket}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
  res.json({ success: true, url });
}));

// GET /blog/admin/posts — list all posts
r.get('/admin/posts', adminGuard, asyncHandler(async (req, res) => {
  const p      = paginate(req.query);
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) {
    const rx = new RegExp(req.query.search.substring(0, 100), 'i');
    filter.$or = [{ 'title.en': rx }, { slug: rx }, { tags: rx }];
  }
  const bodyExclude = Object.fromEntries(LOCALE_KEYS.map(l => [`body.${l}`, 0]));
  const [items, total] = await Promise.all([
    postsCol().find(filter).project(bodyExclude).sort({ updatedAt: -1 }).skip(p.skip).limit(p.limit).toArray(),
    postsCol().countDocuments(filter),
  ]);
  res.json({ success: true, data: items, meta: buildMeta({ page: p.page, pageSize: p.pageSize, total }) });
}));

// GET /blog/admin/posts/:id — get full post for editing
r.get('/admin/posts/:id', adminGuard, asyncHandler(async (req, res) => {
  const post = await postsCol().findOne({ _id: toObjectId(req.params.id) });
  if (!post) throw new AppError('RESOURCE_NOT_FOUND', 'Post not found', 404);
  res.json({ success: true, data: post });
}));

// POST /blog/admin/posts — create post
r.post('/admin/posts', adminGuard, notViewer, validate(PostSchema), asyncHandler(async (req, res) => {
  const now  = new Date();
  let { slug, title, body, status, scheduledAt } = req.body;

  if (!slug) slug = slugify(title?.en || '') || nanoid(8);

  // Ensure slug uniqueness
  let finalSlug = slug;
  const existing = await postsCol().findOne({ slug: finalSlug });
  if (existing) finalSlug = `${slug}-${nanoid(6)}`;

  const readingTimeMinutes = body?.en ? calcReadingTime(body.en) : 1;
  const publishedAt =
    status === 'published'  ? now :
    status === 'scheduled' && scheduledAt ? new Date(scheduledAt) :
    null;

  const doc = {
    ...req.body,
    slug:               finalSlug,
    publishedAt,
    readingTimeMinutes,
    viewCount:          0,
    createdBy:          new ObjectId(req.user.id),
    createdAt:          now,
    updatedAt:          now,
  };

  const ins = await postsCol().insertOne(doc);
  res.status(201).json({ success: true, data: { _id: ins.insertedId, ...doc } });
}));

// PUT /blog/admin/posts/:id — update post
r.put('/admin/posts/:id', adminGuard, notViewer, validate(PostSchema.partial()), asyncHandler(async (req, res) => {
  const id       = toObjectId(req.params.id);
  const existing = await postsCol().findOne({ _id: id });
  if (!existing) throw new AppError('RESOURCE_NOT_FOUND', 'Post not found', 404);

  const $set = { ...req.body, updatedAt: new Date() };
  delete $set._id;

  if ($set.body?.en) $set.readingTimeMinutes = calcReadingTime($set.body.en);
  if ($set.status === 'published' && !existing.publishedAt) $set.publishedAt = new Date();
  if ($set.status === 'scheduled' && $set.scheduledAt)      $set.publishedAt = new Date($set.scheduledAt);

  if ($set.slug && $set.slug !== existing.slug) {
    const dupe = await postsCol().findOne({ slug: $set.slug, _id: { $ne: id } });
    if (dupe) throw new AppError('CONFLICT', 'Slug already in use', 409);
  }

  await postsCol().updateOne({ _id: id }, { $set });
  await invalidatePostCache(existing.slug);
  if ($set.slug && $set.slug !== existing.slug) await invalidatePostCache($set.slug);

  const updated = await postsCol().findOne({ _id: id });
  res.json({ success: true, data: updated });
}));

// DELETE /blog/admin/posts/:id
r.delete('/admin/posts/:id', adminGuard, notViewer, asyncHandler(async (req, res) => {
  const post = await postsCol().findOne({ _id: toObjectId(req.params.id) });
  if (!post) throw new AppError('RESOURCE_NOT_FOUND', 'Post not found', 404);
  await postsCol().deleteOne({ _id: toObjectId(req.params.id) });
  await invalidatePostCache(post.slug);
  res.json({ success: true });
}));

// POST /blog/admin/posts/:id/publish
r.post('/admin/posts/:id/publish', adminGuard, notViewer, asyncHandler(async (req, res) => {
  const id = toObjectId(req.params.id);
  await postsCol().updateOne({ _id: id }, { $set: { status: 'published', publishedAt: new Date(), updatedAt: new Date() } });
  const post = await postsCol().findOne({ _id: id });
  await invalidatePostCache(post?.slug || '');
  res.json({ success: true });
}));

// POST /blog/admin/posts/:id/unpublish
r.post('/admin/posts/:id/unpublish', adminGuard, notViewer, asyncHandler(async (req, res) => {
  const id = toObjectId(req.params.id);
  await postsCol().updateOne({ _id: id }, { $set: { status: 'draft', updatedAt: new Date() } });
  const post = await postsCol().findOne({ _id: id });
  await invalidatePostCache(post?.slug || '');
  res.json({ success: true });
}));

// ── Categories (admin) ─────────────────────────────────────────────────────

r.get('/admin/categories', adminGuard, asyncHandler(async (req, res) => {
  const cats = await catsCol().find({}).sort({ order: 1, 'name.en': 1 }).toArray();
  res.json({ success: true, data: cats });
}));

r.post('/admin/categories', adminGuard, notViewer, validate(CategorySchema), asyncHandler(async (req, res) => {
  const now = new Date();
  const doc = { ...req.body, createdAt: now, updatedAt: now };
  const dupe = await catsCol().findOne({ slug: req.body.slug });
  if (dupe) throw new AppError('CONFLICT', 'Category slug already in use', 409);
  const ins = await catsCol().insertOne(doc);
  await invalidateCatCache();
  res.status(201).json({ success: true, data: { _id: ins.insertedId, ...doc } });
}));

r.put('/admin/categories/:id', adminGuard, notViewer, validate(CategorySchema.partial()), asyncHandler(async (req, res) => {
  const id  = toObjectId(req.params.id);
  const $set = { ...req.body, updatedAt: new Date() };
  delete $set._id;
  await catsCol().updateOne({ _id: id }, { $set });
  await invalidateCatCache();
  const updated = await catsCol().findOne({ _id: id });
  res.json({ success: true, data: updated });
}));

r.delete('/admin/categories/:id', adminGuard, notViewer, asyncHandler(async (req, res) => {
  await catsCol().deleteOne({ _id: toObjectId(req.params.id) });
  await invalidateCatCache();
  res.json({ success: true });
}));

export default r;
