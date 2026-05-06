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

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: false,
  maxRetriesPerRequest: 3,
});
export const pubClient = new Redis(PUBSUB_URL);
export const subClient = pubClient.duplicate();

redis.on('error',     (e) => logger.error({ err: e, role: 'cache'  }, 'redis error'));
redis.on('connect',   () => logger.info({ role: 'cache' }, 'redis connected'));
pubClient.on('error', (e) => logger.error({ err: e, role: 'pubsub' }, 'redis error'));
pubClient.on('connect', () => logger.info({ role: 'pubsub' }, 'redis connected'));
subClient.on('error', (e) => logger.error({ err: e, role: 'sub'    }, 'redis error'));

export async function publish(channel, payload) {
  await pubClient.publish(channel, JSON.stringify(payload));
}

export async function closeRedis() {
  await Promise.allSettled([redis.quit(), pubClient.quit(), subClient.quit()]);
}
