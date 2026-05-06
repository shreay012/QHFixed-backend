/**
 * COUNTRY_CONFIG — Single source of truth for all multi-country settings.
 *
 * Every piece of country-specific data lives here. Nothing is hardcoded
 * elsewhere. All other modules import from this file.
 *
 * Target markets: IN, AE, DE, US, AU
 * Extended fallbacks: GB, SA, SG, MY, PH, ID, FR (routing only)
 *
 * ─────────────────────────────────────────────────────────────────────────
 * Schema per country entry:
 *   code          ISO 3166-1 alpha-2
 *   name          Display name
 *   currency      ISO 4217 currency code
 *   currencySymbol  Rendered symbol
 *   locale        BCP 47 locale tag used for Intl formatting
 *   timezone      IANA timezone
 *   phonePrefix   E.164 country calling code (string)
 *   rtl           Whether the primary locale is RTL
 *   gateways      Ordered list of payment gateway IDs (first = primary)
 *   bnpl          Whether BNPL (buy-now-pay-later) tab is offered
 *   tax           Tax rule for service invoices
 *     type          'gst' | 'vat' | 'none'
 *     rate          Decimal fraction (e.g. 0.18 = 18%)
 *     inclusive     True when tax is already included in the displayed price
 *     name          Label on invoice (e.g. 'GST', 'VAT', 'MwSt.')
 *     registrationLabel  What the seller's tax number is called
 *   dataResidency AWS region where user data must be stored
 *   supportedLangs  Array of BCP 47 language tags offered in this market
 *   legalDocs     Slugs for the CMS-managed legal documents per country
 *   active        Whether this country is live (false = config only, not served)
 * ─────────────────────────────────────────────────────────────────────────
 */

/** @type {Record<string, import('./country.config.types.js').CountryConfig>} */
export const COUNTRY_CONFIG = {

  /* ─── India ─────────────────────────────────────────────────────────── */
  IN: {
    code: 'IN',
    name: 'India',
    currency: 'INR',
    currencySymbol: '₹',
    locale: 'en-IN',
    timezone: 'Asia/Kolkata',
    phonePrefix: '+91',
    rtl: false,
    gateways: ['razorpay'],
    bnpl: false,
    tax: {
      type: 'gst',
      rate: 0.18,
      inclusive: true,   // price shown to user already includes GST
      name: 'GST',
      registrationLabel: 'GSTIN',
    },
    dataResidency: 'ap-south-1',
    supportedLangs: ['en', 'hi'],
    legalDocs: {
      termsOfService: 'in-terms-of-service',
      privacyPolicy: 'in-privacy-policy',
      refundPolicy: 'in-refund-policy',
    },
    active: true,
  },

  /* ─── United Arab Emirates ───────────────────────────────────────────── */
  AE: {
    code: 'AE',
    name: 'United Arab Emirates',
    currency: 'AED',
    currencySymbol: 'AED',
    locale: 'ar-AE',
    timezone: 'Asia/Dubai',
    phonePrefix: '+971',
    rtl: true,
    // RAZORPAY_UNIVERSAL_V1: Razorpay handles AED via international payments
    // (merchant must have international cards enabled on Razorpay dashboard).
    gateways: ['razorpay', 'tabby'],
    bnpl: true,
    tax: {
      type: 'vat',
      rate: 0.05,
      inclusive: false,  // 5% VAT added on top of displayed price
      name: 'VAT',
      registrationLabel: 'TRN',
    },
    dataResidency: 'me-south-1',
    supportedLangs: ['ar', 'en'],
    legalDocs: {
      termsOfService: 'ae-terms-of-service',
      privacyPolicy: 'ae-privacy-policy',
      refundPolicy: 'ae-refund-policy',
    },
    active: true,
  },

  /* ─── Germany ────────────────────────────────────────────────────────── */
  DE: {
    code: 'DE',
    name: 'Germany',
    currency: 'EUR',
    currencySymbol: '€',
    locale: 'de-DE',
    timezone: 'Europe/Berlin',
    phonePrefix: '+49',
    rtl: false,
    // RAZORPAY_UNIVERSAL_V1: Razorpay accepts EUR via international payments
    // when the merchant has international cards/payouts enabled.
    gateways: ['razorpay'],
    bnpl: false,
    tax: {
      type: 'vat',
      rate: 0.19,
      inclusive: false,  // 19% MwSt. added on top
      name: 'MwSt.',
      registrationLabel: 'USt-IdNr.',
    },
    dataResidency: 'eu-central-1',
    supportedLangs: ['de', 'en'],
    legalDocs: {
      termsOfService: 'de-terms-of-service',
      privacyPolicy: 'de-privacy-policy',    // GDPR-compliant copy
      refundPolicy: 'de-refund-policy',
    },
    active: true,
  },

  /* ─── United States ──────────────────────────────────────────────────── */
  US: {
    code: 'US',
    name: 'United States',
    currency: 'USD',
    currencySymbol: '$',
    locale: 'en-US',
    timezone: 'America/New_York',
    phonePrefix: '+1',
    rtl: false,
    // RAZORPAY_UNIVERSAL_V1: Razorpay accepts USD via international payments.
    gateways: ['razorpay'],
    bnpl: false,
    tax: {
      // US sales tax varies by state — handled by TaxJar integration, not platform-level
      type: 'none',
      rate: 0,
      inclusive: false,
      name: '',
      registrationLabel: 'EIN',
    },
    dataResidency: 'us-east-1',
    supportedLangs: ['en'],
    legalDocs: {
      termsOfService: 'us-terms-of-service',
      privacyPolicy: 'us-privacy-policy',    // CCPA-compliant copy
      refundPolicy: 'us-refund-policy',
    },
    active: true,
  },

  /* ─── Australia ──────────────────────────────────────────────────────── */
  AU: {
    code: 'AU',
    name: 'Australia',
    currency: 'AUD',
    currencySymbol: 'A$',
    locale: 'en-AU',
    timezone: 'Australia/Sydney',
    phonePrefix: '+61',
    rtl: false,
    // RAZORPAY_UNIVERSAL_V1: Razorpay accepts AUD via international payments.
    gateways: ['razorpay'],
    bnpl: false,
    tax: {
      type: 'gst',
      rate: 0.10,
      inclusive: false,  // 10% GST added on top in AU (unlike IN)
      name: 'GST',
      registrationLabel: 'ABN',
    },
    dataResidency: 'ap-southeast-2',
    supportedLangs: ['en'],
    legalDocs: {
      termsOfService: 'au-terms-of-service',
      privacyPolicy: 'au-privacy-policy',
      refundPolicy: 'au-refund-policy',
    },
    active: true,
  },

  /* ─── Extended routing fallbacks (not primary markets) ────────────────── */
  GB: {
    code: 'GB', name: 'United Kingdom', currency: 'GBP', currencySymbol: '£',
    locale: 'en-GB', timezone: 'Europe/London', phonePrefix: '+44', rtl: false,
    gateways: ['razorpay'], bnpl: false,
    tax: { type: 'vat', rate: 0.20, inclusive: false, name: 'VAT', registrationLabel: 'VAT Number' },
    dataResidency: 'eu-west-2', supportedLangs: ['en'],
    legalDocs: { termsOfService: 'gb-terms-of-service', privacyPolicy: 'gb-privacy-policy', refundPolicy: 'gb-refund-policy' },
    active: false,
  },
  SA: {
    code: 'SA', name: 'Saudi Arabia', currency: 'SAR', currencySymbol: 'SR',
    locale: 'ar-SA', timezone: 'Asia/Riyadh', phonePrefix: '+966', rtl: true,
    gateways: ['razorpay', 'tabby'], bnpl: true,
    tax: { type: 'vat', rate: 0.15, inclusive: false, name: 'VAT', registrationLabel: 'VAT Number' },
    dataResidency: 'me-south-1', supportedLangs: ['ar', 'en'],
    legalDocs: { termsOfService: 'sa-terms-of-service', privacyPolicy: 'sa-privacy-policy', refundPolicy: 'sa-refund-policy' },
    active: false,
  },
  SG: {
    code: 'SG', name: 'Singapore', currency: 'SGD', currencySymbol: 'S$',
    locale: 'en-SG', timezone: 'Asia/Singapore', phonePrefix: '+65', rtl: false,
    gateways: ['razorpay'], bnpl: false,
    tax: { type: 'gst', rate: 0.09, inclusive: false, name: 'GST', registrationLabel: 'UEN' },
    dataResidency: 'ap-southeast-1', supportedLangs: ['en'],
    legalDocs: { termsOfService: 'sg-terms-of-service', privacyPolicy: 'sg-privacy-policy', refundPolicy: 'sg-refund-policy' },
    active: false,
  },
};

/** Default country when geo detection fails */
export const DEFAULT_COUNTRY_CODE = 'IN';

/** All active country codes */
export const ACTIVE_COUNTRY_CODES = Object.keys(COUNTRY_CONFIG).filter(
  (k) => COUNTRY_CONFIG[k].active,
);

/** All country codes (active + inactive) */
export const ALL_COUNTRY_CODES = Object.keys(COUNTRY_CONFIG);

/**
 * Look up a country config safely.
 * Falls back to DEFAULT_COUNTRY_CODE if the code is unknown.
 *
 * @param {string} code  ISO 3166-1 alpha-2 country code
 * @returns {import('./country.config.types.js').CountryConfig}
 */
export function getCountryConfig(code = DEFAULT_COUNTRY_CODE) {
  return COUNTRY_CONFIG[code?.toUpperCase()] ?? COUNTRY_CONFIG[DEFAULT_COUNTRY_CODE];
}

/**
 * Compute tax for an amount in a given country.
 *
 * @param {number} amount   Amount in the country's base currency (smallest unit or whole, consistent)
 * @param {string} code     ISO country code
 * @returns {{
 *   taxAmount: number,
 *   taxRate: number,
 *   taxName: string,
 *   taxType: string,
 *   inclusive: boolean,
 *   netAmount: number,
 *   grossAmount: number,
 * }}
 */
export function computeTax(amount, code = DEFAULT_COUNTRY_CODE) {
  const cfg = getCountryConfig(code);
  const { tax } = cfg;

  if (!tax || tax.type === 'none' || tax.rate === 0) {
    return {
      taxAmount: 0,
      taxRate: 0,
      taxName: tax?.name || '',
      taxType: 'none',
      inclusive: false,
      netAmount: amount,
      grossAmount: amount,
    };
  }

  let netAmount, taxAmount, grossAmount;

  if (tax.inclusive) {
    // Tax already included in amount (India GST model)
    grossAmount = amount;
    taxAmount = Math.round(amount - amount / (1 + tax.rate));
    netAmount = amount - taxAmount;
  } else {
    // Tax added on top (UAE VAT, DE MwSt., AU GST model)
    netAmount = amount;
    taxAmount = Math.round(amount * tax.rate);
    grossAmount = amount + taxAmount;
  }

  return {
    taxAmount,
    taxRate: tax.rate,
    taxName: tax.name,
    taxType: tax.type,
    inclusive: tax.inclusive,
    netAmount,
    grossAmount,
  };
}

/**
 * Build a full invoice breakdown for a booking.
 *
 * @param {{ subtotal: number, discount?: number, code?: string, currency?: string }}
 * @returns {object}
 */
export function buildInvoiceBreakdown({ subtotal, discount = 0, code = DEFAULT_COUNTRY_CODE, currency }) {
  const cfg = getCountryConfig(code);
  const resolvedCurrency = currency || cfg.currency;
  const amountAfterDiscount = subtotal - discount;
  const tax = computeTax(amountAfterDiscount, code);

  return {
    subtotal,
    discount,
    amountAfterDiscount,
    tax: {
      amount: tax.taxAmount,
      rate: tax.taxRate,
      name: tax.taxName,
      type: tax.taxType,
      inclusive: tax.inclusive,
    },
    total: tax.grossAmount,
    currency: resolvedCurrency,
    locale: cfg.locale,
  };
}

/**
 * Resolve the primary payment gateway for a country.
 *
 * @param {string} code  ISO country code
 * @returns {string}     Gateway ID (e.g. 'razorpay', 'stripe', 'xendit')
 */
export function resolveGateway(code = DEFAULT_COUNTRY_CODE) {
  const cfg = getCountryConfig(code);
  return cfg.gateways[0] || 'stripe';
}

/**
 * Get all available payment options (gateway + type) for a country.
 *
 * @param {string} code  ISO country code
 * @returns {{ gateway: string, type: string, installments?: number[] }[]}
 */
export function getGatewayOptions(code = DEFAULT_COUNTRY_CODE) {
  const cfg = getCountryConfig(code);
  const options = cfg.gateways.map((gw) => ({ gateway: gw, type: 'standard' }));

  if (cfg.bnpl) {
    options.push({ gateway: 'tabby', type: 'bnpl', installments: [3, 4] });
  }

  return options;
}

/**
 * Returns true if the country uses an RTL script as its primary locale.
 *
 * @param {string} code
 * @returns {boolean}
 */
export function isRtl(code = DEFAULT_COUNTRY_CODE) {
  return getCountryConfig(code).rtl === true;
}

/**
 * Build the MongoDB seed documents for the `countries` collection.
 * Run via: node src/scripts/seed-countries.js
 *
 * @returns {object[]}  Array of MongoDB documents ready for insertMany/replaceOne
 */
export function buildCountrySeedDocuments() {
  return Object.values(COUNTRY_CONFIG).map((cfg) => ({
    code: cfg.code,
    name: cfg.name,
    currency: cfg.currency,
    currencySymbol: cfg.currencySymbol,
    locale: cfg.locale,
    timezone: cfg.timezone,
    phonePrefix: cfg.phonePrefix,
    rtl: cfg.rtl,
    gateways: cfg.gateways,
    bnpl: cfg.bnpl,
    tax: cfg.tax,
    dataResidency: cfg.dataResidency,
    supportedLangs: cfg.supportedLangs,
    legalDocs: cfg.legalDocs,
    active: cfg.active,
    updatedAt: new Date(),
  }));
}
