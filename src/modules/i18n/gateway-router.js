/**
 * Payment Gateway Router — backward-compat shim.
 *
 * All logic has moved to src/config/country.config.js (single source of truth).
 * This file re-exports everything so existing imports continue to work unchanged.
 * New code should import directly from country.config.js.
 */
import { getCountryConfig } from '../../config/country.config.js';

export {
  resolveGateway,
  getGatewayOptions,
  computeTax,
  buildInvoiceBreakdown,
  getCountryConfig,
} from '../../config/country.config.js';

/**
 * @deprecated  Use getGatewayOptions() from country.config.js — it includes bnpl flag.
 */
export function supportsBnpl(country = 'IN') {
  return getCountryConfig(country).bnpl === true;
}
