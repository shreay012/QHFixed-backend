import { initializeQueues, registerWorker, QUEUES } from './index.js';
import { handleNotificationJob } from './notification.handler.js';
import { handleLifecycleTick, scheduleLifecycleTick } from './lifecycle.handler.js';
import { handleAnalyticsJob } from './analytics.handler.js';
import { handleEmailJob } from './email.handler.js';
import { logger } from '../config/logger.js';

/**
 * Queue Setup & Integration
 * 
 * Initialize all BullMQ queues and workers at app startup.
 * This replaces the old in-process worker system with a scalable queue-based system.
 */

/**
 * Start all queues and workers
 * Call this once at app startup (in server.js)
 */
export async function startQueueWorkers() {
  try {
    logger.info('starting queue workers');

    // Initialize all queues
    await initializeQueues();

    // Register notification handler
    registerWorker(QUEUES.NOTIFICATIONS, handleNotificationJob, {
      concurrency: 10, // Process up to 10 notifications in parallel
    });

    // Register lifecycle handler
    registerWorker(QUEUES.LIFECYCLE, handleLifecycleTick, {
      concurrency: 1, // Only 1 tick at a time (avoid concurrency issues)
    });

    // Register analytics handler (refunds, FX rate refresh, bulk ops)
    registerWorker(QUEUES.ANALYTICS, handleAnalyticsJob, {
      concurrency: 3, // 3 parallel analytics jobs (refunds can be slow)
    });

    // Register email handler (transactional emails via SES)
    registerWorker(QUEUES.EMAILS, handleEmailJob, {
      concurrency: 5, // 5 parallel email sends
    });

    // Schedule the recurring lifecycle tick
    await scheduleLifecycleTick();

    logger.info('all queue workers started successfully');
  } catch (err) {
    logger.error({ err }, 'failed to start queue workers');
    throw err;
  }
}

/**
 * Stop all queues and workers
 * Call this on graceful shutdown
 */
export async function stopQueueWorkers() {
  try {
    logger.info('stopping queue workers');
    const { closeAllQueues } = await import('./index.js');
    await closeAllQueues();
    logger.info('all queue workers stopped');
  } catch (err) {
    logger.error({ err }, 'error stopping queue workers');
    throw err;
  }
}

/**
 * Export for use throughout the app
 */
export { enqueueJob, getQueue, QUEUES } from './index.js';
export { enqueueNotification, handleNotificationJob } from './notification.handler.js';
export { handleLifecycleTick, scheduleLifecycleTick, getLifecycleStats } from './lifecycle.handler.js';
export { handleAnalyticsJob } from './analytics.handler.js';
export { handleEmailJob } from './email.handler.js';
