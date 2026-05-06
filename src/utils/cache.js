import { redis } from '../config/redis.js';
import { logger } from '../config/logger.js';

/**
 * Cache layer abstraction over Redis
 * Handles all cache operations with proper error handling and fallback
 * 
 * Design: If Redis is down, queries still work (no Redis errors bubble up)
 * This makes it safe to add caching without breaking existing functionality
 */

/**
 * Set a cache value
 * @param {string} key - Cache key
 * @param {*} value - Value to cache (will be JSON stringified)
 * @param {number} ttl - TTL in seconds (default: 1 hour)
 */
export async function setCacheValue(key, value, ttl = 3600) {
  if (!redis.status || redis.status === 'reconnecting') {
    // Redis is down/reconnecting - silently skip caching
    logger.debug({ key }, 'redis unavailable, skipping cache write');
    return false;
  }

  try {
    const serialized = JSON.stringify(value);
    if (ttl > 0) {
      await redis.setex(key, ttl, serialized);
    } else {
      await redis.set(key, serialized);
    }
    return true;
  } catch (err) {
    logger.warn({ err, key }, 'cache set failed');
    return false;
  }
}

/**
 * Get a cache value
 * @param {string} key - Cache key
 * @returns {*} Parsed cached value or null
 */
export async function getCacheValue(key) {
  if (!redis.status || redis.status === 'reconnecting') {
    logger.debug({ key }, 'redis unavailable, skipping cache read');
    return null;
  }

  try {
    const cached = await redis.get(key);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        logger.warn({ key }, 'cache parse failed, returning null');
        return null;
      }
    }
    return null;
  } catch (err) {
    logger.warn({ err, key }, 'cache get failed');
    return null;
  }
}

/**
 * Delete a cache value
 * @param {string|string[]} keys - Key(s) to delete
 */
export async function deleteCacheValue(keys) {
  if (!redis.status || redis.status === 'reconnecting') {
    return false;
  }

  try {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    if (keysArray.length === 0) return true;
    await redis.del(...keysArray);
    return true;
  } catch (err) {
    logger.warn({ err, keys }, 'cache delete failed');
    return false;
  }
}

/**
 * Clear all keys matching a pattern using a non-blocking SCAN cursor.
 *
 * The previous implementation used `redis.keys(pattern)` which is a single
 * O(N) command that blocks the Redis main thread for the entire scan. At
 * 1M users with hundreds of thousands of cache entries, every service
 * edit would have frozen the queue/pubsub/auth-blocklist subsystems for
 * tens of milliseconds while it scanned. SCAN walks the keyspace in
 * cursor-paged chunks, yielding between batches, so other commands stay
 * responsive while we delete.
 *
 * @param {string} pattern  Redis key pattern (e.g. "services:*")
 */
export async function clearCachePattern(pattern) {
  if (!redis.status || redis.status === 'reconnecting') {
    return false;
  }

  try {
    let cursor = '0';
    let deleted = 0;
    do {
      // COUNT is a hint, not a hard cap. 200 keys per round-trip keeps
      // each SCAN call well under 1ms even on a busy Redis.
      const [next, batch] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 200);
      cursor = next;
      if (batch.length > 0) {
        await redis.unlink(...batch); // UNLINK is async-free in Redis ≥4
        deleted += batch.length;
      }
    } while (cursor !== '0');
    if (deleted > 0) logger.debug({ pattern, deleted }, 'cache pattern cleared');
    return true;
  } catch (err) {
    logger.warn({ err, pattern }, 'cache pattern clear failed');
    return false;
  }
}

/**
 * Get or set pattern - if key not in cache, call getter and cache result
 * @param {string} key - Cache key
 * @param {Function} getter - Async function to get value if not cached
 * @param {number} ttl - TTL in seconds
 * @returns {*} Cached or fresh value
 */
export async function getOrSet(key, getter, ttl = 3600) {
  try {
    // Try cache first
    const cached = await getCacheValue(key);
    if (cached !== null) {
      logger.debug({ key }, 'cache hit');
      return cached;
    }

    logger.debug({ key }, 'cache miss, fetching');
    // Cache miss - fetch fresh value
    const value = await getter();

    // Cache the result
    await setCacheValue(key, value, ttl);
    return value;
  } catch (err) {
    logger.error({ err, key }, 'getOrSet failed');
    throw err;
  }
}

/**
 * Check if Redis is connected and ready
 */
export function isRedisReady() {
  return redis.status === 'ready';
}

/**
 * Get Redis connection status
 */
export function getRedisStatus() {
  return redis.status;
}
