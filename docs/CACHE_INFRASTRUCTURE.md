# Redis Cache Infrastructure

## Overview

Phase 1, Step 1a: Redis Cache Infrastructure implementation provides a production-safe caching layer on top of Redis with:

✅ **Automatic fallback** - If Redis is down, queries still work (graceful degradation)  
✅ **Type-safe cache keys** - Predefined constants prevent key typos  
✅ **TTL management** - Per-resource TTL recommendations  
✅ **Error handling** - All cache operations include try-catch  
✅ **Logging** - Cache hits/misses for debugging  

## Architecture

```
Request
  ↓
Cache Middleware (optional)
  ├─ Try cache hit → return JSON
  └─ Cache miss → query DB → cache result
  ↓
Response

OR

Manual caching in routes:
  getCacheValue(key) → if null, query DB → setCacheValue()
```

## Files Added

| File | Purpose |
|---|---|
| `src/utils/cache.js` | Core cache abstraction (set, get, delete, getOrSet) |
| `src/utils/cache.keys.js` | Typed cache key constants and TTL values |
| `src/middleware/cache.middleware.js` | Express middleware for automatic caching |
| `scripts/test-cache.js` | Smoke test suite for cache operations |

## Usage Guide

### 1. Manual Caching in Routes

```javascript
import { getCacheValue, setCacheValue } from '../../utils/cache.js';
import { CACHE_KEYS, CACHE_TTL } from '../../utils/cache.keys.js';

// In your route handler
router.get('/:id', asyncHandler(async (req, res) => {
  const cacheKey = CACHE_KEYS.SERVICES_DETAIL(req.params.id);
  
  // Try cache first
  let data = await getCacheValue(cacheKey);
  if (!data) {
    // Cache miss - query DB
    data = await collection.findOne({ _id: req.params.id });
    // Cache the result
    await setCacheValue(cacheKey, data, CACHE_TTL.MEDIUM);
  }
  
  res.json(data);
}));
```

### 2. Get-or-Set Pattern

```javascript
import { getOrSet } from '../../utils/cache.js';
import { CACHE_KEYS, CACHE_TTL } from '../../utils/cache.keys.js';

// Automatically handles cache miss logic
const services = await getOrSet(
  CACHE_KEYS.SERVICES_LIST,
  () => collection.find({ active: true }).toArray(),
  CACHE_TTL.MEDIUM
);
```

### 3. Using Cache Middleware

```javascript
import { cacheMiddleware } from '../../middleware/cache.middleware.js';
import { CACHE_KEYS, CACHE_TTL } from '../../utils/cache.keys.js';

// Cache static routes (5 min)
router.get(
  '/:id',
  cacheMiddleware(CACHE_KEYS.SERVICES_DETAIL(':id'), CACHE_TTL.SHORT),
  handler
);

// Cache with dynamic key function
router.get(
  '/by-category/:cat',
  cacheMiddleware(req => CACHE_KEYS.SERVICES_BY_CATEGORY(req.params.cat), CACHE_TTL.SHORT),
  handler
);
```

### 4. Invalidating Cache

**Manual invalidation:**
```javascript
import { deleteCacheValue, clearCachePattern } from '../../utils/cache.js';
import { CACHE_KEYS } from '../../utils/cache.keys.js';

// After creating/updating a service
await deleteCacheValue([
  CACHE_KEYS.SERVICES_LIST,
  CACHE_KEYS.SERVICES_DETAIL(serviceId)
]);

// Clear all service-related cache
await clearCachePattern(CACHE_KEYS.SERVICES_PATTERN);
```

## Cache Key Patterns

Cache keys follow a consistent naming convention: `{module}:{resource}:{identifier}`

Examples:
- `services:list` - All services
- `services:detail:123` - Service with ID 123
- `booking:list:user:456` - All bookings for user 456
- `pm:availability:789` - PM availability

See [cache.keys.js](../src/utils/cache.keys.js) for complete list.

## TTL Strategy

| Type | TTL | Reason |
|---|---|---|
| `CACHE_TTL.SHORT` (5 min) | User data, bookings, availability | Changes frequently |
| `CACHE_TTL.MEDIUM` (1 hr) | Services, PM profiles | Relatively stable |
| `CACHE_TTL.LONG` (24 hr) | Configuration, static content | Very stable |
| `CACHE_TTL.NEVER` (0) | Never expires | Use sparingly, manual invalidation required |

## Performance Impact

### Expected Cache Hit Rates (by endpoint)

| Endpoint | Hit Rate | Improvement |
|---|---|---|
| GET /services | ~80% (popular list) | 5-10x faster |
| GET /services/:id | ~60% (mix of repeat + new) | 3-5x faster |
| GET /bookings/:id | ~40% (frequently updated) | 1-2x faster |
| GET /availability | ~30% (dynamic) | 1-2x faster |

### Database Load Reduction

At scale (50K users), cache can reduce:
- **DB queries by 50-70%** for read-heavy endpoints
- **Network latency** for cached requests (microseconds vs milliseconds)
- **Concurrent connections** to MongoDB

## Monitoring

### Check Cache Status

```javascript
import { isRedisReady, getRedisStatus } from '../../utils/cache.js';

if (isRedisReady()) {
  console.log('Cache is operational');
} else {
  console.log('Cache status:', getRedisStatus()); // 'connecting', 'reconnecting', 'error'
}
```

### Cache Headers

The cache middleware adds headers to responses:
- `X-Cache: HIT` - Response served from cache
- `X-Cache: MISS` - Response computed and cached

Check browser DevTools Network tab to monitor cache hits/misses.

### Logs

Look for log entries:
- `cache hit` - Request served from cache
- `cache miss` - Database query executed and cached
- `redis unavailable` - Redis is down (requests still work)
- `cache set failed` - Redis write failed (data still returned)

## Error Handling

**Cache is fail-safe:**

1. **Redis down** → Cache returns null, queries use DB, no errors
2. **Write fails** → Data still sent to client, logged as warning
3. **Read fails** → Database query executes instead, no errors
4. **Parse error** → Returns null, queries DB

This means **adding cache cannot break existing functionality**.

## Migration Path

### Phase 1a: Infrastructure (✅ DONE)
- Cache layer created
- Service routes refactored as example
- Smoke tests verify functionality

### Phase 1b: Gradual Adoption
- Apply caching to booking endpoints
- Apply caching to PM/resource endpoints
- Monitor performance improvements

### Phase 1c: Observability
- Add Prometheus metrics for cache hit rate
- Add dashboard to monitor cache performance
- Optimize TTLs based on real data

## Testing

Run the cache smoke test:
```bash
cd backend
node scripts/test-cache.js
```

Expected output:
```
✅ Redis connection
✅ Set/get/delete cache works
✅ TTL and expiration works
✅ Delete multiple keys works
✅ Clear cache pattern works
✅ getOrSet pattern works
✅ Cache operations don't throw on errors

✅ 7 passed, ❌ 0 failed
```

## Next Steps

After Phase 1a is validated:

1. **Phase 1b** → BullMQ queues for async jobs
2. **Phase 1c** → MongoDB indexes
3. **Phase 1d** → Observability (Sentry + Prometheus)
4. **Phase 1e** → Socket.IO Redis adapter for multi-node

## Troubleshooting

**Cache not working?**

1. Check Redis is running: `redis-cli ping` (should return PONG)
2. Check REDIS_URL in .env is correct
3. Run `node scripts/test-cache.js` to verify
4. Check backend logs for `redis unavailable` warnings

**High database load despite caching?**

1. Check TTLs are appropriate for your use case
2. Verify cache middleware is applied to high-traffic endpoints
3. Monitor cache hit rate in logs
4. Review CACHE_KEYS for missing invalidations

**Memory issues?**

1. Monitor Redis memory usage: `redis-cli INFO memory`
2. Reduce TTLs if Redis fills up
3. Implement cache eviction policy in Redis: `maxmemory-policy allkeys-lru`

## References

- Redis: https://redis.io/docs/
- ioredis: https://github.com/luin/ioredis
- Cache patterns: https://redis.io/docs/patterns/
