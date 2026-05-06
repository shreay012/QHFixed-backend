import { redis } from '../config/redis.js';

/**
 * Try to acquire a distributed lock. Returns true if acquired.
 */
export async function acquireLock(key, ttlSeconds = 60) {
  const r = await redis.set(`lock:${key}`, '1', 'EX', ttlSeconds, 'NX');
  return r === 'OK';
}

export async function releaseLock(key) {
  await redis.del(`lock:${key}`);
}

/**
 * Idempotency cache: returns previously stored result if any.
 * If `value` provided, stores it (with TTL) and returns it.
 */
export async function idempotencyGetOrSet(key, value = null, ttlSeconds = 86400) {
  const k = `idem:${key}`;
  if (value === null) {
    const cached = await redis.get(k);
    return cached ? JSON.parse(cached) : null;
  }
  await redis.set(k, JSON.stringify(value), 'EX', ttlSeconds);
  return value;
}
