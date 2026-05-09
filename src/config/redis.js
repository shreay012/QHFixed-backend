import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

/**
 * Three Redis clients, one per concern:
 *
 *   • redis      — general cache, rate-limit counters, idempotency
 *                  ledger, JWT blocklist, OTP store. The hot read
 *                  client. Shared via REDIS_URL.
 *   • pubClient  — Socket.IO Redis adapter publish + business pub/sub
 *                  (publish() helper below). Dedicated so a slow
 *                  KEYS / SCAN on the cache instance doesn't pause
 *                  realtime fan-out. Falls through to REDIS_URL_PUBSUB
 *                  → REDIS_URL.
 *   • subClient  — paired sub for pubClient — must be the same
 *                  underlying Redis as pubClient for adapter routing
 *                  to work, hence .duplicate().
 *
 * The BullMQ queue connection lives in queue/index.js and uses
 * REDIS_URL_QUEUE → REDIS_URL with maxRetriesPerRequest: null (BullMQ
 * requirement). At 1M-user scale you'd point each of the three URLs at
 * a separate Redis instance — single-Redis deploys keep working
 * because every URL falls back to REDIS_URL.
 *
 * fail-fast on the cache client (maxRetriesPerRequest: 3) so a Redis
 * outage surfaces quickly to callers; pub/sub clients use the ioredis
 * default retry to keep the socket adapter trying to reconnect.
 */

const PUBSUB_URL = env.REDIS_URL_PUBSUB || env.REDIS_URL;

// Quota-exceeded / auth-rejected errors look like transient connection
// failures to ioredis, so the client retries forever, drowning the API
// in cascading rejections (Upstash 500K/day cap is the typical trigger).
// `reconnectOnError` returns false for these so the client stays in an
// errored state and `redis.<cmd>()` rejects fast — callers fall back to
// in-memory or skip the cache write. Recovers automatically once the
// Redis host is healthy again (next process boot or manual reconnect).
function reconnectOnError(err) {
  const msg = String(err?.message || err);
  if (/max requests limit|NOAUTH|WRONGPASS|invalid password/i.test(msg)) return false;
  return 1;
}

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: false,
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false,
  reconnectOnError,
});
export const pubClient = new Redis(PUBSUB_URL, { reconnectOnError });
export const subClient = pubClient.duplicate();

redis.on('error',     (e) => logger.error({ err: e.message, role: 'cache'  }, 'redis error'));
redis.on('connect',   () => logger.info({ role: 'cache' }, 'redis connected'));
pubClient.on('error', (e) => logger.error({ err: e.message, role: 'pubsub' }, 'redis error'));
pubClient.on('connect', () => logger.info({ role: 'pubsub' }, 'redis connected'));
subClient.on('error', (e) => logger.error({ err: e.message, role: 'sub'    }, 'redis error'));

export async function publish(channel, payload) {
  await pubClient.publish(channel, JSON.stringify(payload)).catch((e) => {
    // pubsub failures should not crash the request handler that triggered
    // them — fan-out is best-effort.
    logger.warn({ err: e.message, channel }, 'redis publish failed (continuing)');
  });
}

export async function closeRedis() {
  await Promise.allSettled([redis.quit(), pubClient.quit(), subClient.quit()]);
}
