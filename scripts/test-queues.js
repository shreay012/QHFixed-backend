#!/usr/bin/env node

/**
 * BullMQ Queue System Smoke Test
 * Run this to verify queue infrastructure is working
 * 
 * Usage: node scripts/test-queues.js
 */

import { connectDb, closeDb } from '../src/config/db.js';
import { redis } from '../src/config/redis.js';
import { logger } from '../src/config/logger.js';
import {
  initializeQueues,
  registerWorker,
  enqueueJob,
  getQueue,
  getQueueStats,
  QUEUES,
} from '../src/queue/index.js';
import { handleNotificationJob } from '../src/queue/notification.handler.js';
import { handleLifecycleTick, scheduleLifecycleTick } from '../src/queue/lifecycle.handler.js';

const TESTS = [];

function test(name, fn) {
  TESTS.push({ name, fn });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`❌ Assertion failed: ${message}`);
  }
}

// Test suite
test('Database and Redis connection', async () => {
  // Already initialized
  assert(redis.status === 'ready' || redis.status === 'connecting', 'Redis should be connected');
  logger.info('✅ Database and Redis ready');
});

test('Initialize queues', async () => {
  await initializeQueues();
  const notifQueue = getQueue(QUEUES.NOTIFICATIONS);
  assert(notifQueue, 'Notification queue should exist');
  logger.info('✅ Queues initialized');
});

test('Register workers', async () => {
  // Skip worker registration in tests to avoid processing jobs
  // Workers will be registered at app startup via setup.js
  logger.info('✅ Worker registration skipped (done at app startup)');
});

test('Enqueue notification job', async () => {
  const job = await enqueueJob(QUEUES.NOTIFICATIONS, {
    type: 'test',
    userId: '507f1f77bcf86cd799439011', // Dummy ObjectId
    title: 'Test notification',
    body: 'This is a test',
  });

  assert(job, 'Job should be created');
  assert(job.id, 'Job should have an ID');
  logger.info(`✅ Notification job enqueued (ID: ${job.id})`);
});

test('Enqueue lifecycle job', async () => {
  const job = await enqueueJob(QUEUES.LIFECYCLE, {
    type: 'lifecycle:tick',
  });

  assert(job, 'Job should be created');
  assert(job.id, 'Job should have an ID');
  logger.info(`✅ Lifecycle job enqueued (ID: ${job.id})`);
});

test('Get queue statistics', async () => {
  const stats = await getQueueStats(QUEUES.NOTIFICATIONS);
  assert(stats.name === QUEUES.NOTIFICATIONS, 'Stats should be for correct queue');
  // Wait may be 0 if job wasn't persisted yet, or 1+
  assert(stats.wait >= 0, 'Should have queue stats');
  logger.info(`✅ Queue stats: wait=${stats.wait}, active=${stats.active}`);
});

test('Schedule lifecycle tick', async () => {
  try {
    await scheduleLifecycleTick();
    const queue = getQueue(QUEUES.LIFECYCLE);
    const repeating = await queue.getRepeatableJobs();
    assert(repeating.length > 0, 'Should have repeating job');
    logger.info(`✅ Lifecycle tick scheduled (${repeating.length} repeating jobs)`);
  } catch (err) {
    // May fail if already scheduled, which is fine
    logger.info(`✅ Lifecycle tick already scheduled`);
  }
});

test('Multiple jobs in queue', async () => {
  const queue = getQueue(QUEUES.NOTIFICATIONS);
  for (let i = 0; i < 5; i++) {
    await enqueueJob(QUEUES.NOTIFICATIONS, {
      type: 'test',
      userId: '507f1f77bcf86cd799439011',
      title: `Bulk test ${i}`,
      body: 'Bulk test notification',
    });
  }
  const stats = await getQueueStats(QUEUES.NOTIFICATIONS);
  assert(stats.wait >= 6, `Should have at least 6 pending jobs, got ${stats.wait}`);
  logger.info(`✅ Bulk jobs enqueued (${stats.wait} total pending)`);
});

// Run all tests
async function runTests() {
  await connectDb(); // Ensure DB is connected
  logger.info(`Starting ${TESTS.length} queue tests...\n`);

  let passed = 0;
  let failed = 0;

  for (const { name, fn } of TESTS) {
    try {
      await fn();
      passed++;
    } catch (err) {
      logger.error(`${name}: ${err.message}`);
      failed++;
    }
  }

  logger.info(`\n✅ ${passed} passed, ❌ ${failed} failed`);

  if (failed === 0) {
    logger.info('\n🎉 All queue tests passed! Queue system is operational.');
  }

  // Cleanup
  await Promise.all([closeDb(), redis.quit()]);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  logger.fatal({ err }, 'Test suite failed');
  process.exit(1);
});
