/**
 * Payment Gateway Factory
 *
 * Returns the correct gateway instance for a country code.
 * Uses COUNTRY_CONFIG as the single source of truth for gateway selection.
 *
 * Usage:
 *   const gateway = PaymentGatewayFactory.forCountry(req.geo.country, req.geo.currency);
 *   const order   = await gateway.createOrder({ jobId, amount, currency, userId });
 *
 * Gateway mapping (from COUNTRY_CONFIG, RAZORPAY_UNIVERSAL_V1):
 *   IN  → RazorpayGateway  (INR)
 *   AE  → RazorpayGateway  (AED, international payments enabled)
 *   DE  → RazorpayGateway  (EUR, international payments enabled)
 *   US  → RazorpayGateway  (USD, international payments enabled)
 *   AU  → RazorpayGateway  (AUD, international payments enabled)
 *   *   → RazorpayGateway  (fallback)
 *
 * Razorpay handles every active country via its International Payments
 * product. The merchant must enable international cards / multi-currency
 * payouts on the Razorpay dashboard for non-INR currencies to clear.
 */
import { resolveGateway, getCountryConfig, DEFAULT_COUNTRY_CODE, COUNTRY_CONFIG } from '../../../config/country.config.js';
import { RazorpayGateway } from './razorpay.gateway.js';
import { StripeGateway } from './stripe.gateway.js';
import { MockGateway } from './mock.gateway.js';
import { env } from '../../../config/env.js';

export class PaymentGatewayFactory {
  /**
   * Get the appropriate gateway for a given country.
   *
   * In development, if neither Razorpay nor Stripe keys are configured,
   * falls back to MockGateway automatically.
   *
   * @param {string} countryCode  ISO 3166-1 alpha-2 (e.g. 'IN', 'AE')
   * @param {string} [currency]   Override currency (defaults to country's currency)
   * @returns {RazorpayGateway | StripeGateway | MockGateway}
   */
  static forCountry(countryCode = DEFAULT_COUNTRY_CODE, currency) {
    const code = countryCode.toUpperCase();
    const cfg = getCountryConfig(code);
    const resolvedCurrency = currency || cfg.currency;
    const gatewayName = resolveGateway(code);

    // Auto-fallback to mock in dev when no real keys are present
    if (env.NODE_ENV !== 'production') {
      const hasRzpKeys = !!(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
      const hasStripeKeys = !!env.STRIPE_SECRET_KEY;

      if (gatewayName === 'razorpay' && !hasRzpKeys) {
        return new MockGateway({ currency: resolvedCurrency });
      }
      if (gatewayName === 'stripe' && !hasStripeKeys) {
        return new MockGateway({ currency: resolvedCurrency });
      }
    }

    switch (gatewayName) {
      case 'razorpay':
        return new RazorpayGateway({ currency: resolvedCurrency });
      case 'stripe':
        return new StripeGateway({ currency: resolvedCurrency });
      default:
        // Unknown gateway (tabby/xendit/etc. not yet implemented) — fall back
        // to Razorpay since it now serves every active country universally.
        return new RazorpayGateway({ currency: resolvedCurrency });
    }
  }

  /**
   * List all gateway names configured across active countries.
   * Useful for health checks and admin dashboards.
   *
   * @returns {string[]}  Unique gateway names
   */
  static availableGateways() {
    const gateways = new Set();
    for (const cfg of Object.values(COUNTRY_CONFIG)) {
      if (cfg.active) cfg.gateways.forEach((g) => gateways.add(g));
    }
    return [...gateways];
  }
}
