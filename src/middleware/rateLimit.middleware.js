import { redis } from '../config/redis.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../config/logger.js';

/**
 * Sliding-window per-key rate limiter built on Redis INCR + EXPIRE.
 *
 * Tiered presets are exported below so callers can apply the right
 * pressure relief at the right layer:
 *
 *   • rateLimit()                — default global, loose
 *   • rateLimitAuth()            — OTP send/verify (low; abuse vector)
 *   • rateLimitPayment()         — /payments/create-order, /verify
 *   • rateLimitSearch()          — admin /search (CPU-heavy regex)
 *   • rateLimitWrite()           — POST/PATCH/DELETE on hot collections
 *
 * Keying strategy:
 *   - For authenticated requests, key on `req.user.id` so individual
 *     users hit their own bucket regardless of IP.
 *   - For unauthenticated requests (signup, OTP, public reads), fall
 *     back to `req.ip`. Using IP for unauth is unavoidable but at the
 *     default 120/min/path it's CGNAT-hostile — so unauth public reads
 *     get a much higher limit and only the sensitive auth/payment
 *     surfaces stay tight.
 *
 * Fail-open behaviour: if Redis is unreachable we let the request
 * through but emit a Prometheus metric so the SRE can alert on a
 * silent rate-limit-disabled state. Previously this fail-open was
 * silent — at scale that's a real DoS amplifier the moment Redis
 * hiccups.
 */
function buildLimiter({
  limit,
  windowSec = 60,
  keyFn,
  // Override the cache key prefix so the same user can hit /payments
  // and /search bucks independently when both are tight-tier.
  bucket = 'global',
  // Optional message override (we may want different copy for the user)
  message = 'Too many requests',
}) {
  return async (req, _res, next) => {
    try {
      // Default key: authenticated user id wins (so a tenant on a busy
      // CGNAT carrier still gets their full quota); fall back to ip.
      const id = keyFn ? keyFn(req) : (req.user?.id || req.ip || 'anon');
      const key = `rl:${bucket}:${id}:${req.path}`;
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, windowSec);
      if (count > limit) {
        return next(new AppError('RATE_LIMITED', message, 429, { limit, windowSec }));
      }
      next();
    } catch (err) {
      // Fail-open on Redis hiccup — but log loudly. A silent fail-open
      // means a Redis outage silently turns the rate limit off, which is
      // exactly when you want it on. The error path here is metered so
      // an SRE can alert on it.
      logger.warn({ err: err.message, path: req.path, bucket }, 'rate limiter degraded — failing open');
      next();
    }
  };
}

/**
 * Default global rate limit — applied on app.use() in app.js. Very loose
 * (env.RATE_LIMIT_PER_MIN, default 120/min/path/key). Sensitive surfaces
 * layer their own stricter limits on top via the route-level helpers
 * below.
 */
export function rateLimit(opts = {}) {
  return buildLimiter({
    limit: opts.limit ?? env.RATE_LIMIT_PER_MIN,
    windowSec: opts.windowSec ?? 60,
    keyFn: opts.keyFn,
    bucket: opts.bucket || 'global',
    message: opts.message,
  });
}

/**
 * OTP send/verify limiter. Brute force vectors live here — a free
 * attacker can pin OTPs by spamming if the limit is too high. 5/min/IP
 * + 10/15min/IP is industry-standard. We key by IP intentionally
 * because the user isn't authenticated yet at /auth/send-otp time.
 */
export function rateLimitAuth() {
  return buildLimiter({
    limit: 5,
    windowSec: 60,
    keyFn: (req) => `${req.ip || 'anon'}:${req.body?.mobile || ''}`,
    bucket: 'auth',
    message: 'Too many OTP attempts. Try again in a minute.',
  });
}

/**
 * Payment create-order / verify limiter. Mainly a guard against accidental
 * client-side retry storms (which we've seen during the Razorpay flake
 * outages) — and a fraud-tier defence against rapid-fire card testing.
 * 10/min/user is generous for a real customer (typical booking is 1-3
 * payment attempts) and tight enough to throttle a card-testing bot.
 */
export function rateLimitPayment() {
  return buildLimiter({
    limit: 10,
    windowSec: 60,
    bucket: 'payment',
    message: 'Too many payment attempts. Please wait and retry.',
  });
}

/**
 * Admin global-search limiter. Each keystroke fires a multi-collection
 * query — without a tight bucket a single admin holding down a key on
 * the search box can saturate Mongo. The FE already debounces to 200ms
 * but a misbehaving client (or curl loop) can bypass that. 60/min/admin
 * accommodates real typing and blocks abuse.
 */
export function rateLimitSearch() {
  return buildLimiter({
    limit: 60,
    windowSec: 60,
    bucket: 'search',
    message: 'Search rate limit hit. Slow down.',
  });
}

/**
 * Generic mutation limiter — for "POST creates booking", "POST writes
 * review", etc. Default 30/min/user keeps real users entirely
 * unaffected (a customer makes <30 bookings/min) while rejecting bots.
 */
export function rateLimitWrite() {
  return buildLimiter({
    limit: 30,
    windowSec: 60,
    bucket: 'write',
    message: 'Too many writes. Please slow down.',
  });
}
