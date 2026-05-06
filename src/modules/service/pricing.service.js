// Pricing & tax computation for multi-country services.
//
// Public API:
//   computeQuote({ service, countryCode, durationMinutes, when, address }) → quote
//   computeTax({ subtotal, taxConfig, address, countryCode })             → { total, breakdown }
//
// Inclusive vs. exclusive tax is honored per country. Provider-driven sales
// tax (US) is stubbed when no TaxJar credentials are present — it falls back
// to a state-flat rate so dev/seed flows still produce a usable quote.

import { getPricingForCountry } from './service.model.js';

// Indian state where the merchant is GST-registered (env-driven).
// Drives intra-state (CGST+SGST) vs inter-state (IGST) split.
export const MERCHANT_STATE_IN = process.env.MERCHANT_STATE_IN || 'DL';

// Lightweight US sales-tax fallback rates by state. Used only when TaxJar
// isn't wired. NOT a substitute for a real provider in production.
const US_FALLBACK_TAX = {
  AL: 4, AK: 0, AZ: 5.6, AR: 6.5, CA: 7.25, CO: 2.9, CT: 6.35, DE: 0,
  FL: 6, GA: 4, HI: 4, ID: 6, IL: 6.25, IN: 7, IA: 6, KS: 6.5, KY: 6,
  LA: 4.45, ME: 5.5, MD: 6, MA: 6.25, MI: 6, MN: 6.875, MS: 7, MO: 4.225,
  MT: 0, NE: 5.5, NV: 6.85, NH: 0, NJ: 6.625, NM: 5, NY: 4, NC: 4.75,
  ND: 5, OH: 5.75, OK: 4.5, OR: 0, PA: 6, RI: 7, SC: 6, SD: 4.5,
  TN: 7, TX: 6.25, UT: 6.1, VT: 6, VA: 5.3, WA: 6.5, WV: 6, WI: 5,
  WY: 4, DC: 6,
};

const round = (n) => Math.round(n * 100) / 100;

/**
 * Compute a full quote for a service in a given country.
 *
 * @param {object}  args
 * @param {object}  args.service           Mongo service document
 * @param {string}  args.countryCode       Two-letter country (IN/AE/DE/AU/US)
 * @param {number}  args.durationMinutes   Booking length
 * @param {Date}    [args.when]            When the booking starts (for surge)
 * @param {object}  [args.address]         { state, zip, city }
 * @returns {Promise<object>} quote
 */
export async function computeQuote({
  service,
  countryCode,
  durationMinutes,
  when = new Date(),
  address = {},
}) {
  const p = getPricingForCountry(service, countryCode);
  if (!p) {
    const err = new Error(`Service not available in ${countryCode}`);
    err.code = 'SERVICE_NOT_AVAILABLE_IN_COUNTRY';
    throw err;
  }

  // 1. Base subtotal (respect minDuration and minCharge floors)
  const minutes = Math.max(durationMinutes || 0, p.minDuration || 0);
  const hours = minutes / 60;
  let subtotal = Math.max(p.basePrice * hours, p.minCharge || 0);

  // 2. Surge rule: pick first matching active rule
  const surge = (p.surgeRules || []).find((r) =>
    r.active &&
    (r.daysOfWeek || []).includes(when.getDay()) &&
    when.getHours() >= (r.startHour ?? 0) &&
    when.getHours() <= (r.endHour ?? 23),
  );
  if (surge) subtotal *= surge.multiplier;
  subtotal = round(subtotal);

  // 3. Tax — country specific
  const tax = await computeTax({
    subtotal,
    taxConfig: p.tax,
    address,
    countryCode: p.country,
  });

  // 4. Total / net depending on inclusive vs exclusive
  const total = p.tax.inclusive ? subtotal : round(subtotal + tax.total);
  const net = p.tax.inclusive ? round(subtotal - tax.total) : subtotal;

  return {
    country: p.country,
    currency: p.currency,
    unit: p.unit,
    durationMinutes: minutes,
    basePrice: p.basePrice,
    subtotal,
    net,
    tax,
    total,
    surgeApplied: surge ? { name: surge.name, multiplier: surge.multiplier } : null,
    snapshot: {
      basePrice: p.basePrice,
      unit: p.unit,
      taxConfig: p.tax,
      computedAt: new Date().toISOString(),
    },
  };
}

/**
 * Country-aware tax engine.
 */
export async function computeTax({ subtotal, taxConfig, address = {}, countryCode }) {
  if (!taxConfig || taxConfig.type === 'NONE') {
    return { total: 0, inclusive: !!taxConfig?.inclusive, breakdown: [] };
  }

  // ---------- US: provider-driven (TaxJar / Avalara) ----------
  if (taxConfig.provider === 'taxjar' || countryCode === 'US') {
    const fallbackRate = US_FALLBACK_TAX[String(address.state || '').toUpperCase()];
    // If running with real credentials, swap this with a TaxJar SDK call.
    // Here we use the state-flat fallback so dev/seed flows still work.
    const rate = fallbackRate ?? 0;
    const amount = round(subtotal * rate / 100);
    return {
      total: amount,
      inclusive: !!taxConfig.inclusive,
      breakdown: [{ name: 'Sales Tax', rate, amount }],
      provider: 'fallback',
    };
  }

  // ---------- India: CGST+SGST intra-state, IGST inter-state ----------
  if (taxConfig.type === 'GST' && Array.isArray(taxConfig.split) && taxConfig.split.length) {
    const sameState = String(address.state || '').toUpperCase() === MERCHANT_STATE_IN.toUpperCase();
    if (sameState) {
      const breakdown = taxConfig.split.map((s) => ({
        name: s.name,
        rate: s.rate,
        amount: round(subtotal * s.rate / 100),
      }));
      const total = round(breakdown.reduce((acc, b) => acc + b.amount, 0));
      return { total, inclusive: !!taxConfig.inclusive, breakdown };
    }
    const igstRate = taxConfig.split.reduce((acc, s) => acc + s.rate, 0);
    const amount = round(subtotal * igstRate / 100);
    return {
      total: amount,
      inclusive: !!taxConfig.inclusive,
      breakdown: [{ name: 'IGST', rate: igstRate, amount }],
    };
  }

  // ---------- UAE / Germany / Australia: flat rate ----------
  // For inclusive prices we extract the tax from the gross subtotal:
  //   gross = net * (1 + r/100)  ⇒  tax = gross - net = gross - gross/(1 + r/100)
  const rate = taxConfig.rate ?? 0;
  const amount = taxConfig.inclusive
    ? round(subtotal - subtotal / (1 + rate / 100))
    : round(subtotal * rate / 100);

  return {
    total: amount,
    inclusive: !!taxConfig.inclusive,
    breakdown: [{ name: taxConfig.type, rate, amount }],
  };
}
