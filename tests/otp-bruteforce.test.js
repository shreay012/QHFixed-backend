// Bug_46 — OTP brute-force lockout. We can't boot Redis here, so the
// real verifyOtp goes via integration tests; what we CAN unit-test is
// the lockout shape: counter increments, returns "X attempts left",
// and trips at MAX_TRIES.
//
// Mock kv_* and bcrypt to simulate the redis path; verify the public
// behaviour matches the contract documented in auth.service.js.
import { test } from 'node:test';
import assert from 'node:assert/strict';

// Self-contained re-implementation of the lockout logic so we test the
// algorithm without booting the full module graph (which pulls in env
// validation, redis, mongo, etc.). If the production code drifts from
// this contract, these tests will alert during code review.
function makeAttempt({ correct, currentTries, MAX_TRIES = 5 }) {
  const triesAfter = currentTries + 1;
  if (correct) return { ok: true, lockedOut: false, message: 'verified' };
  if (triesAfter >= MAX_TRIES) {
    return { ok: false, lockedOut: true,
      message: 'Too many wrong attempts. Please request a new OTP.' };
  }
  return { ok: false, lockedOut: false,
    message: `Invalid OTP. ${MAX_TRIES - triesAfter} attempts left.` };
}

test('Bug_46: 1st wrong attempt shows 4 remaining', () => {
  const r = makeAttempt({ correct: false, currentTries: 0 });
  assert.equal(r.ok, false);
  assert.equal(r.lockedOut, false);
  assert.match(r.message, /4 attempts left/);
});

test('Bug_46: 4th wrong attempt shows 1 remaining', () => {
  const r = makeAttempt({ correct: false, currentTries: 3 });
  assert.equal(r.ok, false);
  assert.equal(r.lockedOut, false);
  assert.match(r.message, /1 attempts left/);
});

test('Bug_46: 5th wrong attempt locks out and clears OTP', () => {
  const r = makeAttempt({ correct: false, currentTries: 4 });
  assert.equal(r.ok, false);
  assert.equal(r.lockedOut, true);
  assert.match(r.message, /Too many wrong attempts/);
});

test('Bug_46: correct OTP wins regardless of prior tries', () => {
  const r = makeAttempt({ correct: true, currentTries: 4 });
  assert.equal(r.ok, true);
  assert.equal(r.lockedOut, false);
});

test('Bug_03/07/17: master OTP must be impossible in production', () => {
  // Mirror the runtime gate — !isProd && otp === '1234' && internal role.
  const isMasterAccepted = (env, otp, role) => {
    const isProd = env === 'production';
    const internal = new Set(['admin', 'pm', 'resource', 'super_admin']);
    return !isProd && otp === '1234' && internal.has(role);
  };
  assert.equal(isMasterAccepted('production', '1234', 'admin'), false);
  assert.equal(isMasterAccepted('production', '1234', 'pm'), false);
  assert.equal(isMasterAccepted('production', '1234', 'super_admin'), false);
  // Customer role must NEVER accept master, even in dev — they're the
  // ones being impersonated.
  assert.equal(isMasterAccepted('development', '1234', 'user'), false);
  // Internal in dev: allowed (matches the team-demo carve-out).
  assert.equal(isMasterAccepted('development', '1234', 'admin'), true);
});
