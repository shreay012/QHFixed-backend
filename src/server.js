// Sentry must init before any other imports that could throw
import { initSentry } from './config/sentry.js';
initSentry();

import http from 'http';
import { buildApp } from './app.js';
import { connectDb, closeDb } from './config/db.js';
import { closeRedis } from './config/redis.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { attachSocketIO, getIO } from './socket/index.js';
import { startQueueWorkers, stopQueueWorkers } from './queue/setup.js';
import { setupQueueDashboard } from './queue/dashboard.js';
import { initMeilisearch } from './config/meilisearch.js';

async function main() {
  await connectDb();
  const app = buildApp();
  const server = http.createServer(app);
  attachSocketIO(server);

  // Make io available app-wide for emitting from HTTP handlers
  app.set('io', getIO());

  // Phase 6: Meilisearch — non-blocking, search degrades to MongoDB fallback if unavailable
  initMeilisearch().catch((e) => logger.warn({ err: e.message }, 'meilisearch init skipped'));

  // Phase 1b: Start BullMQ queue workers (replacing in-process workers)
  await startQueueWorkers();

  // Setup queue monitoring dashboard
  setupQueueDashboard(app);

  server.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'quickhire api started');
  });

  const shutdown = async (sig) => {
    logger.warn({ sig }, 'graceful shutdown initiated');

    // Stop accepting new connections immediately
    server.close();

    // Notify connected clients so they can reconnect to another pod
    try {
      const io = getIO();
      io?.emit('server:shutdown', { at: new Date().toISOString() });
      // Give clients 2s to gracefully disconnect before forcing close
      await new Promise((r) => setTimeout(r, 2000));
      io?.close();
    } catch {}

    // Phase 1b: Stop queue workers (waits for in-progress jobs to finish, up to 30s)
    await Promise.race([
      stopQueueWorkers(),
      new Promise((r) => setTimeout(r, 30_000)),
    ]);

    await closeDb();
    await closeRedis();

    logger.info('shutdown complete');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => logger.error({ reason }, 'unhandledRejection'));
  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'uncaughtException');
    shutdown('uncaughtException');
  });
}

main().catch((e) => {
  logger.fatal({ err: e }, 'failed to start');
  process.exit(1);
});
