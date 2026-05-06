import { getCacheValue, setCacheValue } from '../utils/cache.js';
import { logger } from '../config/logger.js';

/**
 * Express middleware to cache GET request responses
 * 
 * Usage:
 * app.get('/api/services/:id', cacheMiddleware('services:detail:id', 3600), handler);
 * 
 * Or with dynamic key:
 * app.get('/api/services', cacheMiddleware(req => 'services:list', 3600), handler);
 * 
 * @param {string|Function} keyOrFn - Cache key or function(req) => key
 * @param {number} ttl - Time to live in seconds
 * @param {Object} options - Additional options
 * @param {boolean} options.skipCacheOnError - Don't cache if response status >= 400 (default: true)
 * @returns {Function} Express middleware
 */
export function cacheMiddleware(keyOrFn, ttl = 3600, options = {}) {
  const { skipCacheOnError = true } = options;

  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Compute cache key
    let cacheKey;
    try {
      if (typeof keyOrFn === 'function') {
        cacheKey = keyOrFn(req);
      } else if (typeof keyOrFn === 'string') {
        // Replace :paramName with actual values from params
        cacheKey = keyOrFn.replace(/:(\w+)/g, (_, param) => req.params[param] || '');
      } else {
        logger.warn('invalid cache key', { keyOrFn });
        return next();
      }

      if (!cacheKey) {
        logger.warn('cache key is empty');
        return next();
      }
    } catch (err) {
      logger.warn({ err }, 'failed to compute cache key');
      return next();
    }

    // Try to get from cache
    try {
      const cached = await getCacheValue(cacheKey);
      if (cached) {
        logger.debug({ cacheKey, path: req.path }, 'serving from cache');
        res.setHeader('X-Cache', 'HIT');
        return res.json(cached);
      }
    } catch (err) {
      logger.warn({ err, cacheKey }, 'cache read failed, continuing');
    }

    // Wrap res.json to intercept and cache the response
    const originalJson = res.json.bind(res);

    res.json = async function(data) {
      // Only cache successful responses (unless skipCacheOnError is false)
      if (!skipCacheOnError || res.statusCode < 400) {
        try {
          await setCacheValue(cacheKey, data, ttl);
          res.setHeader('X-Cache', 'MISS');
        } catch (err) {
          logger.warn({ err, cacheKey }, 'cache write failed');
        }
      }

      return originalJson(data);
    };

    next();
  };
}

/**
 * Invalidate specific cache keys
 * Useful for middleware that runs after mutations
 * 
 * Usage in POST/PUT handlers:
 * onSuccess(() => invalidateCacheKeys(['services:list', 'services:detail:123']))
 */
export async function invalidateCacheKeys(keys) {
  if (!Array.isArray(keys) || keys.length === 0) return;

  try {
    const { deleteCacheValue } = await import('../utils/cache.js');
    await deleteCacheValue(keys);
    logger.debug({ keys }, 'cache invalidated');
  } catch (err) {
    logger.warn({ err, keys }, 'cache invalidation failed');
  }
}

/**
 * Clear cache by pattern
 * Usage: clearCachePattern('services:*')
 */
export async function clearCachePattern(pattern) {
  try {
    const { clearCachePattern: clearPattern } = await import('../utils/cache.js');
    await clearPattern(pattern);
    logger.debug({ pattern }, 'cache pattern cleared');
  } catch (err) {
    logger.warn({ err, pattern }, 'cache pattern clear failed');
  }
}
