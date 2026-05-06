/**
 * countryScopeMiddleware — populates req.scope based on req.user.role + req.user.country.
 *
 * Sits AFTER authMiddleware so req.user is available; sits BEFORE route handlers so
 * applyScope() in handlers picks up the right filter. NOT enforcing on its own —
 * it just describes what the filter SHOULD be; route handlers consume req.scope
 * via the applyScope() helper in src/utils/scope.js.
 *
 * Behaviour gated on env.COUNTRY_SCOPE_MODE:
 *   off          → req.scope = { mode:'off', filter:{} } (no-op; safe for prod rollout)
 *   shadow       → scope set as if enforcing, but with .shadow=true so routes can log only
 *   enforce-new  → country_admin/pm/resource enforced; legacy 'admin' without country still global
 *   enforce-all  → legacy 'admin' without country → 403 (full lockdown)
 *
 * Scope shape:
 *   req.scope = {
 *     mode,                 // 'guest' | 'global' | 'global-leg' | 'country' | 'country-as'
 *                            // | 'pm' | 'resource' | 'self' | 'unknown' | 'off'
 *     filter,               // mongo filter to merge into queries (via applyScope)
 *     legacy?: true,        // for legacy admin role
 *     asCountry?: 'XX',     // when super_admin uses ?asCountry= override
 *     shadow?: true,        // when COUNTRY_SCOPE_MODE === 'shadow'
 *   }
 */

import { ObjectId } from 'mongodb';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

const COUNTRY_REQUIRED_ROLES = new Set(['country_admin', 'pm', 'resource']);

export function countryScope(req, _res, next) {
  const mode = env.COUNTRY_SCOPE_MODE || 'off';

  if (mode === 'off') {
    req.scope = { mode: 'off', filter: {} };
    return next();
  }

  // No authenticated user — guest path.
  if (!req.user) {
    req.scope = { mode: 'guest', filter: {} };
    return next();
  }

  const { role, id, country } = req.user;
  const shadow = mode === 'shadow';
  const log = { role, country, requestId: req.id, mode };

  // Validation: roles that MUST have country set are an integrity error if not.
  if (!shadow && COUNTRY_REQUIRED_ROLES.has(role) && !country) {
    return next(new AppError(
      'AUTH_INCOMPLETE_PROFILE',
      `${role} must have a country assigned in user profile`,
      403,
    ));
  }

  switch (role) {
    case 'super_admin': {
      // Optional debug override: GET /api/admin/bookings?asCountry=IN
      // simulates country_admin view; only super_admin can use it.
      const asCountry = req.query?.asCountry
        ? String(req.query.asCountry).toUpperCase()
        : null;
      if (asCountry) {
        req.scope = { mode: 'country-as', filter: { country: asCountry }, asCountry };
        logger.info({ ...log, asCountry }, 'super_admin simulating country_admin');
      } else {
        req.scope = { mode: 'global', filter: {} };
      }
      break;
    }

    case 'country_admin':
      req.scope = { mode: 'country', filter: { country } };
      break;

    case 'pm':
      req.scope = {
        mode: 'pm',
        filter: { country, pmId: new ObjectId(id) },
      };
      break;

    case 'resource':
      req.scope = {
        mode: 'resource',
        filter: { country, resourceId: new ObjectId(id) },
      };
      break;

    case 'admin': {
      // Legacy: behave as country_admin if country set, else as super_admin (BC).
      // In enforce-all mode, missing country → 403.
      if (country) {
        req.scope = { mode: 'country', filter: { country }, legacy: true };
      } else if (mode === 'enforce-all') {
        return next(new AppError(
          'AUTH_LEGACY_ADMIN_DEPRECATED',
          'Legacy admin role without country is deprecated; please assign country or upgrade to super_admin',
          403,
        ));
      } else {
        req.scope = { mode: 'global-leg', filter: {}, legacy: true };
      }
      break;
    }

    case 'customer':
    case 'user':
      req.scope = { mode: 'self', filter: { userId: new ObjectId(id) } };
      break;

    case 'ops':
    case 'finance':
    case 'support':
    case 'growth':
    case 'viewer': {
      // Other staff roles: country-scoped if country set on their profile,
      // otherwise global (current behaviour). Lets ops-team members work
      // either at HQ (global) or attached to a country.
      req.scope = country
        ? { mode: 'country', filter: { country }, legacy: true }
        : { mode: 'global-leg', filter: {}, legacy: true };
      break;
    }

    default:
      // Unknown role — fail-safe: empty result set so the user sees nothing.
      req.scope = { mode: 'unknown', filter: { _impossible_: true } };
  }

  if (shadow) req.scope.shadow = true;

  logger.debug({ ...log, scope: req.scope.mode }, 'authz scope set');
  next();
}
