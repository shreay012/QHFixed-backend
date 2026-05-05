// Service model — Zod schemas + helpers for embedded multi-country pricing.
//
// We use the native MongoDB driver (not Mongoose) elsewhere in this codebase,
// so the "model" here is a set of Zod validators + plain helper functions.
// Documents are stored in the `services` collection.
//
// Supported countries: IN · AE · DE · AU · US

import { z } from 'zod';

export const COUNTRIES = ['IN', 'AE', 'DE', 'AU', 'US'];
export const CURRENCIES = ['INR', 'AED', 'EUR', 'AUD', 'USD'];

// Map locale → country fallback for the quote API when client doesn't send country.
export const LOCALE_TO_COUNTRY = {
  en: 'IN',
  hi: 'IN',
  ar: 'AE',
  de: 'DE',
  es: 'US',
  fr: 'US',
  'zh-CN': 'US',
  ja: 'US',
};

// I18n string for translatable copy (name/description). Other locales optional.
export const I18nStringSchema = z.object({
  en: z.string().min(1),
  hi: z.string().optional(),
  ar: z.string().optional(),
  de: z.string().optional(),
  es: z.string().optional(),
  fr: z.string().optional(),
  ja: z.string().optional(),
  'zh-CN': z.string().optional(),
});

export const TechnologySchema = z.object({
  name: z.string().min(1),
  icon: z.string().optional(),
  required: z.boolean().default(false),
});

export const TaxSplitSchema = z.object({
  name: z.string().min(1),
  rate: z.number().min(0).max(100),
});

export const TaxSchema = z.object({
  type: z.enum(['GST', 'VAT', 'GST_AU', 'SALES_TAX', 'NONE']),
  rate: z.number().min(0).max(100).optional(),
  inclusive: z.boolean().default(false),
  split: z.array(TaxSplitSchema).optional(),
  provider: z.enum(['taxjar', 'avalara']).nullable().optional(),
  registrationNumber: z.string().optional(),
});

export const SurgeRuleSchema = z.object({
  name: z.string().min(1),
  multiplier: z.number().positive().default(1),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).default([]),
  startHour: z.number().int().min(0).max(23).default(0),
  endHour: z.number().int().min(0).max(23).default(23),
  active: z.boolean().default(true),
});

export const CountryPricingSchema = z.object({
  country: z.enum(COUNTRIES),
  currency: z.enum(CURRENCIES),
  basePrice: z.number().nonnegative(),
  unit: z.enum(['per_hour', 'per_booking', 'per_sqft', 'per_day']).default('per_hour'),
  minDuration: z.number().int().positive().default(60),
  minCharge: z.number().nonnegative().optional(),
  tax: TaxSchema,
  surgeRules: z.array(SurgeRuleSchema).default([]),
  cities: z.array(z.string()).default([]),
  active: z.boolean().default(true),
});

// Validator used by the upsert route. We accept either the legacy flat
// pricing object OR the new pricing[] array — preserves backwards
// compatibility while admins migrate.
export const ServiceUpsertSchema = z.object({
  slug: z.string().min(2),
  name: I18nStringSchema.optional(),
  title: z.string().optional(),
  category: z.string().min(2),
  description: z.union([I18nStringSchema, z.string()]).optional(),
  technologies: z.array(z.union([z.string(), TechnologySchema])).optional(),
  // New format: array per country
  pricing: z.union([
    z.array(CountryPricingSchema)
      .superRefine((arr, ctx) => {
        const seen = new Set();
        for (const p of arr) {
          if (seen.has(p.country)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Duplicate country in pricing[]: ${p.country}`,
            });
          }
          seen.add(p.country);
        }
      }),
    // Legacy: single pricing object
    z.object({
      hourly: z.number().nonnegative(),
      currency: z.string().default('INR'),
      tiers: z.array(z.object({
        duration: z.number(),
        pricePerHour: z.number(),
      })).optional(),
    }),
  ]).optional(),
  hourlyRate: z.number().nonnegative().optional(),
  currency: z.string().optional(),
  minHours: z.number().optional(),
  maxHours: z.number().optional(),
  image: z.string().url().optional(),
  imageUrl: z.string().optional(),
  images: z.array(z.string()).optional(),
  iconUrl: z.string().optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
  active: z.boolean().default(true),
});

/**
 * Pluck the pricing block for a country from a service document.
 * Returns null when the service is not offered in that country.
 */
export function getPricingForCountry(service, countryCode) {
  if (!service || !Array.isArray(service.pricing)) return null;
  const code = String(countryCode || '').toUpperCase();
  return service.pricing.find(
    (p) => p.country === code && p.active !== false,
  ) || null;
}

/**
 * List of countries where a service is currently offered.
 */
export function listSupportedCountries(service) {
  if (!Array.isArray(service?.pricing)) return [];
  return service.pricing.filter((p) => p.active !== false).map((p) => p.country);
}
