/**
 * Geo-detection middleware
 *
 * Priority order for country detection:
 *  1. Cloudflare CF-IPCountry header
 *  2. X-Country override header (set by frontend from cookie / user profile)
 *  3. Query param _country (admin testing only — stripped in production)
 *  4. Default: IN
 *
 * Attaches req.geo to every request:
 *   req.geo = {
 *     country,       // ISO 3166-1 alpha-2 (e.g. 'IN')
 *     currency,      // ISO 4217 (e.g. 'INR')
 *     lang,          // BCP 47 tag (e.g. 'en')
 *     timezone,      // IANA (e.g. 'Asia/Kolkata')
 *     rtl,           // boolean — true for Arabic locales
 *     gateways,      // ordered gateway IDs (first = primary)
 *     bnpl,          // boolean
 *     tax,           // tax rule object
 *     locale,        // BCP 47 locale (e.g. 'en-IN')
 *     countryConfig, // full CountryConfig object
 *   }
 *
 * The `countries` MongoDB collection is loaded once every 5 minutes and merged
 * on top of the canonical COUNTRY_CONFIG (so admin overrides via DB win).
 */
import { getDb } from '../../config/db.js';
import { logger } from '../../config/logger.js';
import { getCountryConfig, DEFAULT_COUNTRY_CODE } from '../../config/country.config.js';

let countryConfigCache = null;
let cacheExpiry = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Load country configs from the DB (in-memory cached).
 * Merges DB records on top of canonical config so DB overrides win.
 * Falls back to canonical config silently when DB is unavailable.
 */
async function loadCountryConfigs() {
  const now = Date.now();
  if (countryConfigCache && now < cacheExpiry) return countryConfigCache;

  try {
    const docs = await getDb().collection('countries').find({ active: true }).toArray();
    if (docs.length > 0) {
      const map = {};
      for (const d of docs) map[d.code] = d;
      countryConfigCache = map;
      cacheExpiry = now + CACHE_TTL_MS;
    }
  } catch (err) {
    logger.warn({ err: err.message }, 'geo: failed to load country configs from DB, using canonical defaults');
  }

  return countryConfigCache || {};
}

function extractLangFromAcceptLanguage(header = '') {
  // 'ar-AE,ar;q=0.9,en;q=0.8' → 'ar'
  const first = header.split(',')[0]?.split(';')[0]?.trim();
  return first ? first.slice(0, 2).toLowerCase() : 'en';
}

export async function geoMiddleware(req, _res, next) {
  try {
    // ── 1. Detect country ──────────────────────────────────────────────
    // GEO_DETECT_V2: detection chain (highest priority first):
    //   1. X-Country header / dev _country query  — explicit frontend choice
    //      forwarded from the qh_country cookie or user profile.
    //   2. CF-IPCountry header                     — Cloudflare IP geo.
    //   3. Default: India.
    let country = null;

    const override = req.header('X-Country') ||
      (process.env.NODE_ENV !== 'production' ? req.query._country : null);
    if (override && /^[A-Z]{2}$/i.test(override)) {
      country = override.toUpperCase();
    }

    if (!country) {
      const cfCountry = req.header('CF-IPCountry');
      if (cfCountry && /^[A-Z]{2}$/i.test(cfCountry) && cfCountry !== 'XX') {
        country = cfCountry.toUpperCase();
      }
    }

    if (!country || country === 'XX') country = DEFAULT_COUNTRY_CODE;
    country = country.toUpperCase();

    // ── 2. Resolve config: DB override > canonical COUNTRY_CONFIG ──────
    const dbConfigs = await loadCountryConfigs();
    const resolved = dbConfigs[country] ?? getCountryConfig(country);

    // ── 3. Resolve language ───────────────────────────────────────────
    const langOverride = req.header('X-Lang');
    const lang = langOverride ||
      extractLangFromAcceptLanguage(req.header('Accept-Language')) ||
      resolved.lang ||
      resolved.supportedLangs?.[0] ||
      'en';

    // ── 4. Attach to request ──────────────────────────────────────────
    req.geo = {
      country,
      currency: resolved.currency || 'INR',
      lang,
      timezone: resolved.timezone || 'Asia/Kolkata',
      locale: resolved.locale || 'en-IN',
      rtl: resolved.rtl === true,
      gateways: resolved.gateways || ['razorpay'],
      bnpl: resolved.bnpl === true,
      tax: resolved.tax || { type: 'none', rate: 0, inclusive: false, name: '', registrationLabel: '' },
      countryConfig: resolved,
    };
  } catch (err) {
    logger.warn({ err: err.message }, 'geo middleware error, using IN defaults');
    req.geo = {
      country: DEFAULT_COUNTRY_CODE,
      currency: 'INR',
      lang: 'en',
      timezone: 'Asia/Kolkata',
      locale: 'en-IN',
      rtl: false,
      gateways: ['razorpay'],
      bnpl: false,
      tax: { type: 'gst', rate: 0.18, inclusive: true, name: 'GST', registrationLabel: 'GSTIN' },
      countryConfig: getCountryConfig(DEFAULT_COUNTRY_CODE),
    };
  }

  next();
}
