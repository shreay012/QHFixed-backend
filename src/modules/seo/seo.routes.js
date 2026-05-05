import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { roleGuard } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { getDb } from '../../config/db.js';
import { AppError } from '../../utils/AppError.js';

const r = Router();
const pagesCol  = () => getDb().collection('seo_pages');
const globalCol = () => getDb().collection('seo_global');
const redirsCol = () => getDb().collection('seo_redirects');

const SEO_ROLES = ['admin', 'super_admin', 'seo'];

// ── I18n string (optional per locale) ───────────────────────────────────────
const I18n = z.object({
  en: z.string().optional().default(''),
  hi: z.string().optional().default(''),
  ar: z.string().optional().default(''),
  de: z.string().optional().default(''),
}).default({});

// ── Per-page SEO schema ──────────────────────────────────────────────────────
const PageSchema = z.object({
  metaTitle:       I18n,
  metaDescription: I18n,
  ogTitle:         z.string().optional().default(''),
  ogDescription:   z.string().optional().default(''),
  ogImage:         z.string().optional().default(''),
  twitterTitle:    z.string().optional().default(''),
  twitterImage:    z.string().optional().default(''),
  canonical:       z.string().optional().default(''),
  noindex:         z.boolean().optional().default(false),
  nofollow:        z.boolean().optional().default(false),
  focusKeyword:    z.string().optional().default(''),
  customSchema:    z.string().optional().default(''), // raw JSON-LD string
  robots:          z.string().optional().default(''),
});

// ── Global SEO schema ────────────────────────────────────────────────────────
const GlobalSchema = z.object({
  titleTemplate:       z.string().optional().default('%s | QuickHire'),
  defaultOgImage:      z.string().optional().default(''),
  defaultDescription:  z.string().optional().default(''),
  organizationName:    z.string().optional().default('QuickHire'),
  organizationUrl:     z.string().optional().default('https://qhfixed.vercel.app'),
  organizationLogo:    z.string().optional().default(''),
  twitterHandle:       z.string().optional().default(''),
  facebookAppId:       z.string().optional().default(''),
  googleVerification:  z.string().optional().default(''),
  bingVerification:    z.string().optional().default(''),
  robotsTxt:           z.string().optional().default('User-agent: *\nAllow: /\n\nSitemap: https://qhfixed.vercel.app/sitemap.xml'),
  socialProfiles:      z.array(z.string()).optional().default([]),
});

// ── Redirect schema ──────────────────────────────────────────────────────────
const RedirectSchema = z.object({
  source:      z.string().min(1),
  destination: z.string().min(1),
  type:        z.enum(['301', '302']).default('301'),
  active:      z.boolean().default(true),
});

// ────────────────────────────────────────────────────────────────────────────
// PAGE SEO  GET /admin/seo/pages          — list all pages with SEO status
// ────────────────────────────────────────────────────────────────────────────
const KNOWN_PAGES = [
  { key: 'home',              label: 'Homepage',               path: '/' },
  { key: 'how-it-works',      label: 'How It Works',           path: '/how-it-works' },
  { key: 'book-your-resource',label: 'Book a Resource',        path: '/book-your-resource' },
  { key: 'contact-us',        label: 'Contact Us',             path: '/contact-us' },
  { key: 'faq',               label: 'FAQ',                    path: '/faq' },
  { key: 'industry-perspectives', label: 'Industry Perspectives', path: '/industry-perspectives' },
  { key: 'privacy-policy',    label: 'Privacy Policy',         path: '/privacy-policy' },
  { key: 'terms',             label: 'Terms & Conditions',     path: '/terms-and-conditions' },
  { key: 'cancellation',      label: 'Cancellation Policy',    path: '/cancellation-and-refund-policy' },
];

r.get('/pages', roleGuard(SEO_ROLES), asyncHandler(async (_req, res) => {
  const docs = await pagesCol().find({}).toArray();
  const map = Object.fromEntries(docs.map((d) => [d.pageKey, d]));

  // Also include dynamic service pages
  const services = await getDb().collection('services')
    .find({ active: { $ne: false } }, { projection: { slug: 1, name: 1 } })
    .sort({ sortOrder: 1 })
    .limit(100)
    .toArray();

  const servicePages = services.map((s) => {
    const nameEn = typeof s.name === 'object' ? (s.name.en || '') : (s.name || '');
    const key = `service:${s.slug || s._id}`;
    return { key, label: `Service: ${nameEn}`, path: `/service-details/${s.slug || s._id}`, dynamic: true };
  });

  const allPages = [...KNOWN_PAGES, ...servicePages];
  const result = allPages.map((p) => {
    const doc = map[p.key] || {};
    const hasTitle = !!(doc.metaTitle?.en);
    const hasDesc  = !!(doc.metaDescription?.en);
    const hasOg    = !!(doc.ogImage);
    const score    = Math.round(([hasTitle, hasDesc, hasOg].filter(Boolean).length / 3) * 100);
    return {
      ...p,
      metaTitle:       doc.metaTitle       || { en: '' },
      metaDescription: doc.metaDescription || { en: '' },
      ogImage:         doc.ogImage         || '',
      noindex:         doc.noindex         || false,
      focusKeyword:    doc.focusKeyword    || '',
      score,
      hasTitle, hasDesc, hasOg,
      updatedAt: doc.updatedAt || null,
      updatedBy: doc.updatedBy || null,
    };
  });

  res.json({ success: true, data: result });
}));

// GET /admin/seo/pages/:key — single page SEO
r.get('/pages/:key(*)', roleGuard(SEO_ROLES), asyncHandler(async (req, res) => {
  const key = req.params.key;
  const doc = await pagesCol().findOne({ pageKey: key }) || {};
  res.json({ success: true, data: { pageKey: key, ...doc } });
}));

// PUT /admin/seo/pages/:key — save page SEO
r.put('/pages/:key(*)', roleGuard(SEO_ROLES), validate(PageSchema), asyncHandler(async (req, res) => {
  const key = req.params.key;
  const update = { ...req.body, pageKey: key, updatedAt: new Date(), updatedBy: req.user?.userId };
  await pagesCol().updateOne(
    { pageKey: key },
    { $set: update },
    { upsert: true },
  );
  res.json({ success: true, data: update });
}));

// ────────────────────────────────────────────────────────────────────────────
// GLOBAL SEO  GET/PUT /admin/seo/global
// ────────────────────────────────────────────────────────────────────────────
r.get('/global', roleGuard(SEO_ROLES), asyncHandler(async (_req, res) => {
  const doc = await globalCol().findOne({ _id: 'global' }) || {};
  res.json({ success: true, data: doc });
}));

r.put('/global', roleGuard(SEO_ROLES), validate(GlobalSchema), asyncHandler(async (req, res) => {
  const update = { ...req.body, _id: 'global', updatedAt: new Date(), updatedBy: req.user?.userId };
  await globalCol().replaceOne({ _id: 'global' }, update, { upsert: true });
  res.json({ success: true, data: update });
}));

// ────────────────────────────────────────────────────────────────────────────
// REDIRECTS  GET /admin/seo/redirects
// ────────────────────────────────────────────────────────────────────────────
r.get('/redirects', roleGuard(SEO_ROLES), asyncHandler(async (_req, res) => {
  const docs = await redirsCol().find({}).sort({ createdAt: -1 }).toArray();
  res.json({ success: true, data: docs });
}));

r.post('/redirects', roleGuard(SEO_ROLES), validate(RedirectSchema), asyncHandler(async (req, res) => {
  const doc = { ...req.body, createdAt: new Date(), updatedAt: new Date(), createdBy: req.user?.userId };
  const result = await redirsCol().insertOne(doc);
  res.status(201).json({ success: true, data: { _id: result.insertedId, ...doc } });
}));

r.put('/redirects/:id', roleGuard(SEO_ROLES), validate(RedirectSchema.partial()), asyncHandler(async (req, res) => {
  const { ObjectId } = await import('mongodb');
  const id = new ObjectId(req.params.id);
  const update = { ...req.body, updatedAt: new Date() };
  await redirsCol().updateOne({ _id: id }, { $set: update });
  res.json({ success: true });
}));

r.delete('/redirects/:id', roleGuard(SEO_ROLES), asyncHandler(async (req, res) => {
  const { ObjectId } = await import('mongodb');
  const id = new ObjectId(req.params.id);
  await redirsCol().deleteOne({ _id: id });
  res.json({ success: true });
}));

// ── Public endpoint: fetch page SEO (used by Next.js generateMetadata) ──────
// No auth — called server-side during page render
r.get('/public/pages/:key(*)', asyncHandler(async (req, res) => {
  const key = req.params.key;
  const doc = await pagesCol().findOne({ pageKey: key });
  const global = await globalCol().findOne({ _id: 'global' });
  res.json({ success: true, data: doc || {}, global: global || {} });
}));

r.get('/public/global', asyncHandler(async (_req, res) => {
  const doc = await globalCol().findOne({ _id: 'global' });
  res.json({ success: true, data: doc || {} });
}));

// Public: active redirects list for Next.js middleware
r.get('/public/redirects', asyncHandler(async (_req, res) => {
  const docs = await redirsCol().find({ active: true }).toArray();
  res.json({ success: true, data: docs });
}));

export default r;
