import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

/**
 * BullMQ Queue Manager
 * 
 * Provides centralized queue initialization and lifecycle management.
 * Uses a dedicated Redis connection for BullMQ (requires maxRetriesPerRequest: null)
 * 
 * Queues:
 * - notifications: in-app, push, email, SMS notifications
 * - lifecycle: booking status transitions (scheduled → in_progress → completed)
 * - emails: transactional emails
 * - analytics: async analytics/reporting tasks
 */

// Create dedicated Redis connection for BullMQ (requires
// maxRetriesPerRequest: null). Uses REDIS_URL_QUEUE if set so the queue
// can run on its own Redis instance — important at scale, since one
// slow KEYS / blocked Lua script on the cache instance shouldn't pause
// notification dispatch. Falls back to the shared REDIS_URL otherwise.
const bullConnection = new Redis(env.REDIS_URL_QUEUE || env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

/**
 * Per-queue concurrency defaults. Notifications are the highest-volume
 * queue (every booking transition + every chat message + push fan-out
 * funnels through here) so it gets the biggest concurrency head-room.
 * Overridable per-process via env so a single deploy can fan out across
 * dedicated worker pods.
 *
 * At 50K live bookings × ~5 events/min/booking ≈ 4K events/sec, the
 * old default of 5 would back up jobs in seconds. 50 per worker × N
 * worker pods clears the queue in real time.
 */
const QUEUE_CONCURRENCY = {
  notifications: Number(env.QUEUE_CONCURRENCY_NOTIFICATIONS) || 50,
  lifecycle:     Number(env.QUEUE_CONCURRENCY_LIFECYCLE)     || 25,
  emails:        Number(env.QUEUE_CONCURRENCY_EMAILS)        || 20,
  analytics:     Number(env.QUEUE_CONCURRENCY_ANALYTICS)     || 10,
};

const queues = {};
const workers = {};

// Queue names
export const QUEUES = {
  NOTIFICATIONS: 'notifications',
  LIFECYCLE: 'lifecycle',
  EMAILS: 'emails',
  ANALYTICS: 'analytics',
};

/**
 * Initialize a queue with default options
 */
export function createQueue(name) {
  if (queues[name]) return queues[name];

  const queue = new Queue(name, {
    connection: bullConnection,
    defaultJobOptions: {
      attempts: 3, // Retry 3 times
      backoff: {
        type: 'exponential',
        delay: 2000, // Start with 2s, exponential backoff
      },
      removeOnComplete: {
        age: 3600, // Keep completed jobs for 1 hour
      },
      removeOnFail: {
        age: 86400, // Keep failed jobs for 24 hours
      },
    },
  });

  queues[name] = queue;
  logger.info({ queue: name }, 'queue created');

  return queue;
}

/**
 * Get existing queue (must be created first)
 */
export function getQueue(name) {
  if (!queues[name]) {
    throw new Error(`Queue "${name}" not initialized. Call createQueue(name) first.`);
  }
  return queues[name];
}

/**
 * Register a queue worker with handler
 * 
 * @param {string} name - Queue name
 * @param {Function} handler - Async function(job) handling the work
 * @param {Object} options - Worker options (concurrency, lockDuration, etc)
 */
export function registerWorker(name, handler, options = {}) {
  if (workers[name]) {
    logger.warn({ queue: name }, 'worker already registered');
    return workers[name];
  }

  // Concurrency precedence: explicit option > per-queue env override >
  // queue-name default > hard fallback of 5. The named-queue defaults
  // are tuned for 1M-user scale (notifications=50, lifecycle=25, …).
  const concurrency = options.concurrency
    || QUEUE_CONCURRENCY[name]
    || 5;

  const worker = new Worker(name, handler, {
    connection: bullConnection,
    concurrency,
    lockDuration: options.lockDuration || 30000, // 30s lock per job
    lockRenewTime: options.lockRenewTime || 15000, // Renew lock every 15s
    ...options,
    // Re-apply concurrency after the spread so options.concurrency from
    // the caller doesn't get overwritten by ...options spreading itself.
  });

  // Event listeners
  worker.on('completed', (job) => {
    logger.debug({ queue: name, jobId: job.id, duration: job.finishedOn - job.processedOn }, 'job completed');
  });

  worker.on('failed', (job, err) => {
    logger.warn(
      { queue: name, jobId: job.id, attempt: job.attemptsMade, attempts: job.opts.attempts, err },
      'job failed',
    );
  });

  worker.on('error', (err) => {
    logger.error({ queue: name, err }, 'worker error');
  });

  workers[name] = worker;
  logger.info({ queue: name, concurrency }, 'worker registered');

  return worker;
}

/**
 * Add a job to a queue
 * 
 * @param {string} queueName - Queue name
 * @param {*} data - Job data
 * @param {Object} options - Job options (delay, priority, etc)
 */
export async function enqueueJob(queueName, data, options = {}) {
  try {
    const queue = getQueue(queueName);
    // Build job options - only valid BullMQ options
    const jobOptions = {
      attempts: options.attempts || 3,
      backoff: options.backoff || {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: options.removeOnComplete || {
        age: 3600,
      },
      removeOnFail: options.removeOnFail || {
        age: 86400,
      },
    };

    // Add optional fields if provided
    if (options.jobId) jobOptions.jobId = options.jobId;
    if (options.delay) jobOptions.delay = options.delay;
    if (options.priority !== undefined) jobOptions.priority = options.priority;

    const job = await queue.add(data.type || 'default', data, jobOptions);
    logger.debug({ queue: queueName, jobId: job.id, data }, 'job enqueued');
    return job;
  } catch (err) {
    logger.error({ queue: queueName, err, data }, 'failed to enqueue job');
    throw err;
  }
}

/**
 * Get job by ID
 */
export async function getJob(queueName, jobId) {
  const queue = getQueue(queueName);
  return queue.getJob(jobId);
}

/**
 * Get queue statistics
 */
export async function getQueueStats(queueName) {
  const queue = getQueue(queueName);
  const [counts, worker] = await Promise.all([
    queue.getJobCounts(
      'wait',
      'paused',
      'active',
      'completed',
      'failed',
      'delayed',
    ),
    workers[queueName],
  ]);

  return {
    name: queueName,
    ...counts,
    isRunning: worker?.isRunning?.() || false,
    workerConcurrency: worker?.concurrency || 0,
  };
}

/**
 * Drain all queues (remove all pending/delayed jobs)
 * Use with caution - for testing/cleanup only
 */
export async function drainAllQueues() {
  const keys = Object.keys(queues);
  for (const key of keys) {
    await queues[key].drain();
    logger.warn({ queue: key }, 'queue drained');
  }
}

/**
 * Close all queues and workers gracefully
 */
export async function closeAllQueues() {
  const errors = [];

  // Close workers first
  for (const [name, worker] of Object.entries(workers)) {
    try {
      await worker.close();
      logger.info({ queue: name }, 'worker closed');
    } catch (err) {
      logger.error({ err, queue: name }, 'failed to close worker');
      errors.push(err);
    }
  }

  // Close queues
  for (const [name, queue] of Object.entries(queues)) {
    try {
      await queue.close();
      logger.info({ queue: name }, 'queue closed');
    } catch (err) {
      logger.error({ err, queue: name }, 'failed to close queue');
      errors.push(err);
    }
  }

  // Close BullMQ Redis connection
  try {
    await bullConnection.quit();
    logger.info('bullmq redis connection closed');
  } catch (err) {
    logger.error({ err }, 'failed to close bullmq redis');
    errors.push(err);
  }

  if (errors.length > 0) {
    throw new Error(`Failed to close ${errors.length} queues`);
  }
}

/**
 * Initialize all default queues and workers
 * Call once at app startup
 */
export async function initializeQueues() {
  logger.info('initializing bullmq queues');

  // Create all queues
  Object.values(QUEUES).forEach(createQueue);

  logger.info('all queues initialized');
}
