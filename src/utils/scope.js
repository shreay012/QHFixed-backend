/**
 * applyScope — merge a query's base filter with the role/country scope set
 * by countryScopeMiddleware.
 *
 * Usage in route handlers:
 *
 *   import { applyScope } from '../../utils/scope.js';
 *
 *   r.get('/bookings', asyncHandler(async (req, res) => {
 *     const filter = { status: 'pending' };       // user-supplied filter
 *     const docs = await col.find(applyScope(filter, req)).toArray();
 *     res.json({ ... });
 *   }));
 *
 * Semantics:
 *   - Scope keys are merged FIRST, then user filter overrides.
 *   - This means baseFilter wins on conflict, but role-restricted keys
 *     (country, pmId, resourceId, userId) cannot be widened by the request
 *     because applyScope is the only place those are sourced from.
 *   - Scope is the SECURITY FLOOR; user filter further narrows.
 *
 * Edge cases:
 *   - Shadow mode: req.scope still has filter, but consumers may decide to
 *     skip applying — see applyScopeMaybe below.
 *   - No req.scope (pre-mount paths or guest routes that bypass middleware):
 *     returns baseFilter unchanged.
 *   - 'off' mode: scope filter is {} so nothing changes.
 */

export function applyScope(baseFilter = {}, req) {
  const scopeFilter = req?.scope?.filter || {};
  // Scope first so baseFilter can override; but role-restricted keys never
  // appear in baseFilter because callers don't construct them — only the
  // middleware does.
  return { ...scopeFilter, ...baseFilter };
}

/**
 * applyScopeMaybe — like applyScope, but returns baseFilter unchanged when
 * the middleware is in shadow mode. Use this only in routes that want to
 * EXPLICITLY skip enforcement during shadow rollout while still logging.
 *
 * In production code, prefer applyScope so behaviour is consistent.
 */
export function applyScopeMaybe(baseFilter = {}, req) {
  if (req?.scope?.shadow) {
    // Log what we WOULD have filtered for visibility.
    if (typeof req?.log?.info === 'function') {
      req.log.info({
        wouldScope: req.scope.filter,
        path: req.path,
      }, 'shadow scope (not enforced)');
    }
    return baseFilter;
  }
  return applyScope(baseFilter, req);
}

/**
 * isOutOfScope — quick check: does a single document match the current
 * request's scope? Useful for /:id endpoints that fetch first then check.
 *
 *   const doc = await col.findOne({ _id });
 *   if (!doc) throw new AppError('NOT_FOUND', ...);
 *   if (isOutOfScope(doc, req)) throw new AppError('NOT_FOUND', ...); // 404, not 403
 */
export function isOutOfScope(doc, req) {
  if (!doc) return false;
  const scope = req?.scope?.filter;
  if (!scope || Object.keys(scope).length === 0) return false;
  for (const k of Object.keys(scope)) {
    const a = doc[k];
    const b = scope[k];
    if (a == null) return true;
    // ObjectId equality is by string compare (.toString())
    if (String(a) !== String(b)) return true;
  }
  return false;
}
