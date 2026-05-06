import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { getQueue, QUEUES } from './index.js';
import { logger } from '../config/logger.js';

/**
 * Bull Board Dashboard Setup
 * 
 * Provides a web UI for monitoring queues:
 * - Active jobs, pending, completed, failed
 * - Job details, logs, retry options
 * - Manual job control (pause, resume, clear)
 * 
 * Access at: http://localhost:4000/admin/queues
 */

export function setupQueueDashboard(app) {
  try {
    // Wait a moment for queues to be created
    setTimeout(() => {
      const adapters = Object.values(QUEUES).map((queueName) => {
        try {
          const queue = getQueue(queueName);
          return new BullMQAdapter(queue);
        } catch (err) {
          logger.warn({ queue: queueName, err }, 'queue not ready for dashboard');
          return null;
        }
      }).filter(Boolean);

      if (adapters.length === 0) {
        logger.warn('no queues available for dashboard');
        return;
      }

      const serverAdapter = new ExpressAdapter();
      serverAdapter.setBasePath('/admin/queues');

      createBullBoard({
        queues: adapters,
        serverAdapter,
      });

      app.use('/admin/queues', serverAdapter.getRouter());
      logger.info({ queues: adapters.length }, 'queue dashboard mounted at /admin/queues');
    }, 1000);
  } catch (err) {
    logger.error({ err }, 'failed to setup queue dashboard');
    // Non-fatal: dashboard is for monitoring only
  }
}
