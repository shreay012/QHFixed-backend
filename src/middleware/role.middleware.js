import { AppError } from '../utils/AppError.js';
import { ADMIN_ROLES } from '../config/rbac.js';

/**
 * Gate access to one or more specific roles.
 * Usage: roleGuard(['ops', 'finance'])
 */
export function roleGuard(allowed) {
  const set = new Set(allowed);
  return (req, _res, next) => {
    if (!req.user) return next(new AppError('AUTH_TOKEN_MISSING', 'Auth required', 401));
    if (!set.has(req.user.role)) {
      return next(new AppError('AUTH_FORBIDDEN', 'Insufficient permissions', 403));
    }
    next();
  };
}

/**
 * Gate using a PERMS array directly.
 * Usage: permGuard(PERMS.BOOKING_WRITE)
 * Identical logic to roleGuard — separate export for clarity at call sites.
 */
export const permGuard = roleGuard;

/**
 * Gate: any admin-namespace role (super_admin, admin, ops, finance, support, growth, viewer).
 * Use this as the first layer on all /api/admin/* routes instead of roleGuard(['admin']).
 */
export function adminGuard(req, _res, next) {
  if (!req.user) return next(new AppError('AUTH_TOKEN_MISSING', 'Auth required', 401));
  if (!ADMIN_ROLES.includes(req.user.role)) {
    return next(new AppError('AUTH_FORBIDDEN', 'Insufficient permissions', 403));
  }
  next();
}

/**
 * Gate: read-only viewer cannot mutate.
 * Apply after adminGuard on write routes that should block viewers.
 */
export function notViewer(req, _res, next) {
  if (req.user?.role === 'viewer') {
    return next(new AppError('AUTH_FORBIDDEN', 'Viewers have read-only access', 403));
  }
  next();
}
