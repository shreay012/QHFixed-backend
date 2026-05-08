// Role-boundary tests for the country-scope security floor.
// Run with: npm test
//
// These exercise applyScope/isOutOfScope without booting the full app.
// The contract is: scope keys (country, pmId, resourceId, userId) ALWAYS
// override anything the caller passes in baseFilter — that's the
// security guarantee. If a country_admin in IN sends ?country=AE the
// applyScope merge must collapse it back to country=IN.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyScope, isOutOfScope } from '../src/utils/scope.js';

function reqFor(role, extras = {}) {
  return { scope: { mode: roleToMode(role), filter: extras } };
}
function roleToMode(role) {
  return ({
    super_admin: 'global', country_admin: 'country',
    pm: 'pm', resource: 'resource', customer: 'self',
  })[role] || 'unknown';
}

test('super_admin: empty filter passes through baseFilter unchanged', () => {
  const req = reqFor('super_admin', {});
  const out = applyScope({ status: 'pending' }, req);
  assert.deepEqual(out, { status: 'pending' });
});

test('country_admin: scope.country overrides baseFilter.country', () => {
  // The crux of the multi-country security model. A country_admin in IN
  // cannot widen by sending ?country=AE — the scope merge must clobber.
  const req = reqFor('country_admin', { country: 'IN' });
  const out = applyScope({ status: 'pending', country: 'AE' }, req);
  assert.equal(out.country, 'IN');
  assert.equal(out.status, 'pending');
});

test('pm: scope.pmId is enforced even with conflicting baseFilter', () => {
  const req = reqFor('pm', { country: 'IN', pmId: 'pm-1' });
  const out = applyScope({ pmId: 'pm-impostor' }, req);
  assert.equal(out.pmId, 'pm-1');
  assert.equal(out.country, 'IN');
});

test('isOutOfScope: cross-country doc returns true for country_admin', () => {
  const req = reqFor('country_admin', { country: 'IN' });
  assert.equal(isOutOfScope({ _id: 'x', country: 'AE' }, req), true);
  assert.equal(isOutOfScope({ _id: 'x', country: 'IN' }, req), false);
});

test('isOutOfScope: doc missing scoped field treated as out-of-scope', () => {
  // Defense-in-depth: if a doc doesn't have a country field at all,
  // treat it as out-of-scope rather than leaking. Callers should
  // backfill country on every record (see Phase 1 migration plan).
  const req = reqFor('country_admin', { country: 'IN' });
  assert.equal(isOutOfScope({ _id: 'x' /* no country */ }, req), true);
});

test('off mode: empty scope filter is no-op', () => {
  const req = { scope: { mode: 'off', filter: {} } };
  const out = applyScope({ status: 'pending' }, req);
  assert.deepEqual(out, { status: 'pending' });
});

test('guest mode: no req.user, no scope filter', () => {
  // Public endpoints (no auth middleware match) — applyScope should be
  // a pass-through. The route itself is responsible for ensuring guest
  // access is intended.
  const req = { scope: { mode: 'guest', filter: {} } };
  const out = applyScope({ active: true }, req);
  assert.deepEqual(out, { active: true });
});
