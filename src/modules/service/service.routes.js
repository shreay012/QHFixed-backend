import { Router } from 'express';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import multer from 'multer';
import { parse as csvParse } from 'csv-parse/sync';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { roleGuard } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { getDb } from '../../config/db.js';
import { publish } from '../../config/redis.js';
import { AppError } from '../../utils/AppError.js';
import { toObjectId } from '../../utils/oid.js';
import { getCacheValue, setCacheValue, deleteCacheValue, clearCachePattern } from '../../utils/cache.js';
import { CACHE_KEYS, CACHE_TTL } from '../../utils/cache.keys.js';
import {
  ServiceUpsertSchema,
  COUNTRIES,
  LOCALE_TO_COUNTRY,
  getPricingForCountry,
  listSupportedCountries,
} from './service.model.js';
import { computeQuote } from './pricing.service.js';

const r = Router();
const col = () => getDb().collection('services');

const CACHE_ALL = CACHE_KEYS.SERVICES_LIST;
const CACHE_ONE = CACHE_KEYS.SERVICES_DETAIL;
const TTL = CACHE_TTL.SHORT;

/**
 * Resolve the request's target country.
 *
 * Priority (highest first):
 *   1. `?country=` query param  — explicit per-request override (admin/dev)
 *   2. `req.geo.country`        — set by geo.middleware.js; authoritative for
 *      normal requests (reads CF-IPCountry, qh_country cookie, X-Country header)
 *   3. X-Country / CF-IPCountry request headers  — fallback when geo middleware
 *      is not mounted (e.g. direct API calls from the frontend test harness)
 *   4. Locale-to-country mapping on the qh_locale cookie / Accept-Language
 *   5. Default: 'IN'
 */
function resolveCountry(req) {
  const fromQuery = String(req.query.country || '').toUpperCase();
  if (COUNTRIES.includes(fromQuery)) return fromQuery;
  const fromGeo = String(req.geo?.country || '').toUpperCase();
  if (COUNTRIES.includes(fromGeo)) return fromGeo;
  const fromHeader = String(req.headers['x-country'] || req.headers['cf-ipcountry'] || '').toUpperCase();
  if (COUNTRIES.includes(fromHeader)) return fromHeader;
  const locale = String(req.cookies?.qh_locale || req.headers['accept-language'] || '').split(',')[0].split('-')[0];
  if (LOCALE_TO_COUNTRY[locale]) return LOCALE_TO_COUNTRY[locale];
  return 'IN';
}

/**
 * Resolve locale for the request, preferring geo middleware values.
 */
function resolveLocale(req) {
  return String(req.geo?.lang || req.cookies?.qh_locale || 'en');
}

// Strip pricing[] entries that don't apply to the resolved country, while
// keeping the legacy flat fields untouched. Also flatten an i18n name/desc
// down to the request's locale so the wire stays small.
// Helper: pick a locale string from a value that may be a plain string or
// an i18n object {en, hi, ar, de, ...}.
function pickLocale(v, locale) {
  if (!v) return v;
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && !Array.isArray(v)) {
    return v[locale] || v.en || Object.values(v).find(Boolean) || '';
  }
  return v;
}

function projectForCountry(service, country, locale = 'en') {
  if (!service) return service;
  const out = { ...service };

  // Localise i18n name / description / tagline to a flat string for the
  // requested locale. The original i18n object is preserved under the *I18n
  // key so clients that need all translations (e.g. admin edit) can still
  // access them.
  for (const f of ['name', 'description', 'tagline']) {
    const v = out[f];
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[`${f}I18n`] = v;
      out[f] = pickLocale(v, locale);
    }
  }

  // Localise technology names.  Each technology may be a plain string (legacy)
  // or a rich object { name, en, hi, ... } created by the new admin form.
  if (Array.isArray(out.technologies)) {
    out.technologies = out.technologies.map((t) => {
      if (!t || typeof t === 'string') return t;
      // Rich object — flatten to the locale string
      return pickLocale(t, locale) || t.name || t.en || '';
    });
  }

  // Localise notIncluded items if they ever become i18n-shaped
  if (Array.isArray(out.notIncluded)) {
    out.notIncluded = out.notIncluded.map((item) => pickLocale(item, locale));
  }

  if (Array.isArray(out.pricing)) {
    const match = getPricingForCountry(out, country);
    out.activePricing = match || null;
    out.supportedCountries = listSupportedCountries(out);
  }

  // Attach country-specific hourly rate from the geo_pricing collection so
  // the customer-facing service object already contains the right price.
  // This is done asynchronously only when serving the detail endpoint; for
  // the list endpoint it's done inline below.

  return out;
}

r.get('/', asyncHandler(async (req, res) => {
  const country = resolveCountry(req);
  const locale  = resolveLocale(req);

  // Admin/internal callers can pass ?includeUnavailable=true to see services
  // that have no active pricing for the resolved country (e.g. for content admin).
  const includeUnavailable = req.query.includeUnavailable === 'true';

  // Cache key encodes country, locale, and the availability filter so each
  // variant is cached independently.
  const cacheKey = `${CACHE_ALL}:${country}:${locale}${includeUnavailable ? ':all' : ''}`;

  const cached = await getCacheValue(cacheKey);
  if (cached) return res.json({ success: true, data: cached, country, cached: true });

  const items = await col().find({ active: { $ne: false } }).sort({ sortOrder: 1, createdAt: -1 }).toArray();

  // GEO_LIST_OVERLAY_V1: bulk-load every geo_pricing override for the
  // resolved country in a single query so each card/row carries the right
  // hourlyRate + currency. Without this, customers in non-IN markets saw
  // the legacy IN base rate on the homepage / catalog grids — only the
  // /services/:id detail endpoint was doing the overlay.
  const ids = items.map((s) => s._id);
  let geoMap = new Map();
  if (ids.length > 0) {
    try {
      const geoRows = await getDb().collection('geo_pricing')
        .find({ serviceId: { $in: ids }, country }, { projection: { serviceId: 1, basePrice: 1, currency: 1 } })
        .toArray();
      geoMap = new Map(geoRows.map((g) => [String(g.serviceId), g]));
    } catch { /* geo_pricing read failure must not break the list */ }
  }

  // Project each service for the resolved country/locale — adds activePricing,
  // supportedCountries, localised name/description fields, and overlays the
  // per-country hourly rate when an override exists.
  let projected = items.map((s) => {
    const out = projectForCountry(s, country, locale);
    const geo = geoMap.get(String(s._id));
    if (geo && geo.basePrice > 0) {
      out.geoPrice    = geo.basePrice;
      out.geoCurrency = geo.currency;
      out.pricing     = { ...(out.pricing || {}), hourly: geo.basePrice, currency: geo.currency };
      out.hourlyRate  = geo.basePrice;
    }
    return out;
  });

  // Drop services with no active pricing for this country unless explicitly
  // requested.  Services with legacy flat pricing (no pricing[]) are kept as-is.
  if (!includeUnavailable) {
    projected = projected.filter((s) => {
      if (!Array.isArray(s.pricing)) return true; // legacy flat-pricing service — keep
      return s.activePricing !== null;
    });
  }

  await setCacheValue(cacheKey, projected, TTL);
  res.json({ success: true, data: projected, country, total: projected.length });
}));

r.get('/:id', asyncHandler(async (req, res) => {
  const raw = req.params.id;
  const country = resolveCountry(req);
  const locale  = resolveLocale(req);
  const cacheKey = `${CACHE_ONE(raw)}:${country}:${locale}`;

  const cached = await getCacheValue(cacheKey);
  if (cached) return res.json({ success: true, data: cached, country, cached: true });

  // Accept Mongo ObjectId, slug, or slugified name (e.g. "React-Developer").
  let svc = null;
  if (/^[0-9a-fA-F]{24}$/.test(raw)) {
    svc = await col().findOne({ _id: new ObjectId(raw) });
  }
  if (!svc) {
    const variants = Array.from(new Set([
      raw,
      raw.toLowerCase(),
      raw.replace(/-/g, ' '),
      raw.replace(/-/g, ' ').toLowerCase(),
    ]));
    svc = await col().findOne({
      $or: [
        { slug: { $in: variants } },
        { name: { $in: variants } },
        { name: { $regex: `^${raw.replace(/-/g, '[ -]')}$`, $options: 'i' } },
      ],
    });
  }
  if (!svc) throw new AppError('RESOURCE_NOT_FOUND', 'Service not found', 404);

  const projected = projectForCountry(svc, country, locale);

  // Overlay country-specific hourly rate from the geo_pricing collection.
  // This ensures HoursStep and SummaryStep see the correct price without a
  // second round-trip to /geo-pricing/price/:id.
  try {
    const geo = await getDb().collection('geo_pricing').findOne(
      { serviceId: svc._id, country },
      { projection: { basePrice: 1, currency: 1 } },
    );
    if (geo?.basePrice > 0) {
      projected.geoPrice     = geo.basePrice;
      projected.geoCurrency  = geo.currency;
      // Also update the embedded pricing object so existing code paths that
      // read service.pricing.hourly automatically get the right rate.
      projected.pricing = { ...(projected.pricing || {}), hourly: geo.basePrice, currency: geo.currency };
      projected.hourlyRate = geo.basePrice;
    }
  } catch { /* geo_pricing lookup failure must never break the main response */ }

  await setCacheValue(cacheKey, projected, TTL);
  res.json({ success: true, data: projected, country });
}));

// Compute a country-specific quote. Useful for the booking stepper after
// the customer picks duration / start time.
const quoteSchema = z.object({
  country: z.string().length(2).optional(),
  durationMinutes: z.coerce.number().int().positive(),
  when: z.string().datetime().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  city: z.string().optional(),
});

r.get('/:id/quote', validate(quoteSchema, 'query'), asyncHandler(async (req, res) => {
  const raw = req.params.id;
  const country = String(req.query.country || resolveCountry(req)).toUpperCase();
  if (!COUNTRIES.includes(country)) {
    throw new AppError('VALIDATION_ERROR', `Unsupported country: ${country}`, 400);
  }

  let svc = null;
  if (/^[0-9a-fA-F]{24}$/.test(raw)) svc = await col().findOne({ _id: new ObjectId(raw) });
  if (!svc) svc = await col().findOne({ slug: raw.toLowerCase() });
  if (!svc) throw new AppError('RESOURCE_NOT_FOUND', 'Service not found', 404);

  const quote = await computeQuote({
    service: svc,
    countryCode: country,
    durationMinutes: Number(req.query.durationMinutes),
    when: req.query.when ? new Date(req.query.when) : new Date(),
    address: {
      state: req.query.state,
      zip: req.query.zip,
      city: req.query.city,
    },
  });

  res.json({ success: true, data: quote });
}));

r.post('/', roleGuard(['admin']), validate(ServiceUpsertSchema), asyncHandler(async (req, res) => {
  const r2 = await col().insertOne({ ...req.body, createdAt: new Date(), updatedAt: new Date() });
  await invalidateCache();
  res.status(201).json({ success: true, data: { _id: r2.insertedId, ...req.body } });
}));

r.put('/:id', roleGuard(['admin']), validate(ServiceUpsertSchema.partial()), asyncHandler(async (req, res) => {
  const id = toObjectId(req.params.id);
  const r2 = await col().findOneAndUpdate(
    { _id: id },
    { $set: { ...req.body, updatedAt: new Date() } },
    { returnDocument: 'after' },
  );
  await invalidateCache(req.params.id);
  res.json({ success: true, data: r2.value || r2 });
}));

r.delete('/:id', roleGuard(['admin']), asyncHandler(async (req, res) => {
  const id = toObjectId(req.params.id);
  await col().updateOne({ _id: id }, { $set: { active: false, updatedAt: new Date() } });
  await invalidateCache(req.params.id);
  res.json({ success: true });
}));

// POST /admin/services/bulk-import  — CSV upload, upsert by slug
const csvUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });
r.post('/admin/services/bulk-import', roleGuard(['admin']), csvUpload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('VALIDATION_ERROR', 'CSV file required', 400);
  const text = req.file.buffer.toString('utf-8');
  let rows;
  try {
    rows = csvParse(text, { columns: true, skip_empty_lines: true, trim: true });
  } catch (e) {
    throw new AppError('VALIDATION_ERROR', `CSV parse error: ${e.message}`, 400);
  }
  if (!rows.length) throw new AppError('VALIDATION_ERROR', 'CSV is empty', 400);

  const results = { created: 0, updated: 0, errors: [] };
  for (const row of rows) {
    try {
      const slug = (row.slug || '').trim();
      if (!slug) { results.errors.push({ row, reason: 'slug is required' }); continue; }
      const nameEn = (row.name_en || row.name || '').trim();
      if (!nameEn) { results.errors.push({ row, reason: 'name_en is required' }); continue; }

      const doc = {
        slug,
        name:        { en: nameEn, hi: row.name_hi || '', ar: row.name_ar || '', de: row.name_de || '' },
        tagline:     row.tagline ? { en: row.tagline } : undefined,
        category:    (row.category || '').trim(),
        description: row.description_en ? { en: row.description_en } : undefined,
        technologies: row.technologies
          ? row.technologies.split('|').map(t => ({ name: t.trim(), required: false })).filter(t => t.name)
          : [],
        hourlyRate:  row.hourly_rate_inr ? Number(row.hourly_rate_inr) : 0,
        imageUrl:    (row.image_url || '').trim() || undefined,
        iconUrl:     (row.icon_url || '').trim() || undefined,
        sortOrder:   row.sort_order ? Number(row.sort_order) : 999,
        active:      row.active !== undefined ? String(row.active).toLowerCase() !== 'false' : true,
        updatedAt:   new Date(),
      };
      // Remove undefined keys
      Object.keys(doc).forEach(k => doc[k] === undefined && delete doc[k]);

      const existing = await col().findOne({ slug });
      if (existing) {
        await col().updateOne({ slug }, { $set: doc });
        results.updated++;
      } else {
        await col().insertOne({ ...doc, createdAt: new Date() });
        results.created++;
      }
    } catch (e) {
      results.errors.push({ row, reason: e.message });
    }
  }
  await invalidateCache();
  res.json({ success: true, data: results });
}));

async function invalidateCache(id) {
  // Service list cache is stored under per-country/locale keys:
  //   services:list:IN:en, services:list:AE:ar, …
  // Use pattern delete to wipe all variants at once.
  await clearCachePattern(`${CACHE_ALL}:*`);

  if (id) {
    // Similarly for per-service detail keys: services:detail:<id>:IN:en, …
    await clearCachePattern(`${CACHE_ONE(id)}:*`);
    // Also clear the bare key in case it was written by older code.
    await deleteCacheValue(CACHE_ONE(id));
  }

  await publish('services.invalidated', { id });
}

export default r;
