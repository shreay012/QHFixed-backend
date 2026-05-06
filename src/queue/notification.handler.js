import { ObjectId } from 'mongodb';
import { getDb } from '../config/db.js';
import { logger } from '../config/logger.js';
import { emitTo } from '../socket/index.js';
import { QUEUES, enqueueJob } from './index.js';

/**
 * Notification Queue Handler
 * 
 * Processes notification jobs:
 * - Stores in-app notifications in MongoDB
 * - Emits real-time socket.io events
 * - Sends push notifications (FCM, SNS, etc)
 * 
 * This handler is called by BullMQ worker.
 * Existing enqueueNotification() is preserved for backward compatibility.
 */

const col = () => getDb().collection('notifications');
const usersCol = () => getDb().collection('users');

/**
 * BullMQ job handler for notifications
 * Called by worker when job is dequeued
 */
export async function handleNotificationJob(job) {
  const { userId, type, title, body, data = {}, channels = ['in_app', 'push'] } = job.data;

  if (!userId) {
    logger.warn({ jobId: job.id }, 'notification job missing userId');
    return;
  }

  try {
    // Create notification document
    const doc = {
      userId: new ObjectId(userId),
      type,
      title,
      body,
      data,
      channels,
      read: false,
      createdAt: new Date(),
    };

    const result = await col().insertOne(doc);
    const notification = { _id: result.insertedId, ...doc };

    logger.debug({ jobId: job.id, userId, type }, 'notification persisted');

    // Emit in-app socket event (real-time UI update)
    if (channels.includes('in_app')) {
      emitTo(`user_${userId}`, 'notification', notification);
      emitTo(`user_${userId}`, 'notification:new', notification);
      logger.debug({ userId }, 'notification socket emitted');
    }

    // Send push notifications (async, doesn't block job completion)
    if (channels.includes('push')) {
      await sendPushNotifications(userId, { title, body, data }).catch((err) =>
        logger.warn({ err, userId }, 'push send failed (non-blocking)'),
      );
    }

    return { success: true, notificationId: result.insertedId };
  } catch (err) {
    logger.error({ err, jobId: job.id, userId }, 'notification job handler failed');
    throw err; // Let BullMQ handle retry
  }
}

/**
 * Send push notifications to user's devices
 * Stub: in production, integrate with FCM, SNS, etc
 */
async function sendPushNotifications(userId, payload) {
  const user = await usersCol().findOne(
    { _id: new ObjectId(userId) },
    { projection: { fcmTokens: 1 } },
  );

  if (!user?.fcmTokens?.length) {
    logger.debug({ userId }, 'no fcm tokens for push');
    return;
  }

  // TODO: integrate with FCM/SNS
  logger.debug({ userId, tokens: user.fcmTokens.length }, 'would send push to fcm tokens');
}

/**
 * Enqueue a notification (async via BullMQ)
 * This is the main entry point for sending notifications.
 * 
 * Previously notifications were dispatched inline + SQS.
 * Now they go through BullMQ for reliable processing + retries.
 * 
 * @param {Object} payload - Notification payload
 * @param {string} payload.userId - Target user ID
 * @param {string} payload.type - Notification type
 * @param {string} payload.title - Notification title
 * @param {string} payload.body - Notification body
 * @param {Object} payload.data - Custom data
 * @param {string[]} payload.channels - Channels (in_app, push, email, sms)
 */
export async function enqueueNotification(payload) {
  try {
    // Job ID: use userId + timestamp for idempotency within time window
    const now = Date.now();
    const jobId = `notif:${payload.userId}:${now}`;

    const job = await enqueueJob(QUEUES.NOTIFICATIONS, payload, {
      jobId,
      priority: payload.priority || 0, // Higher = earlier
    });

    logger.debug({ jobId: job.id, userId: payload.userId }, 'notification enqueued');
    return job;
  } catch (err) {
    logger.error({ err, payload }, 'failed to enqueue notification');
    // Fallback: dispatch inline for critical notifications
    // This ensures notifications don't get lost even if queue is down
    return handleNotificationJob({ data: payload, id: 'fallback' }).catch((e) =>
      logger.error({ err: e }, 'fallback notification dispatch failed'),
    );
  }
}

/**
 * Dispatch inline (legacy, kept for backward compatibility)
 * Use enqueueNotification() instead for new code.
 */
export async function dispatch({ userId, type, title, body, data = {}, channels = ['in_app', 'push'] }) {
  return handleNotificationJob({
    data: { userId, type, title, body, data, channels },
    id: 'inline',
  });
}

/**
 * Get notification by ID
 */
export async function getNotification(notificationId) {
  return col().findOne({ _id: new ObjectId(notificationId) });
}

/**
 * Get notifications for user
 */
export async function getUserNotifications(userId, options = {}) {
  const { limit = 50, skip = 0, unreadOnly = false } = options;
  const query = { userId: new ObjectId(userId) };
  if (unreadOnly) query.read = false;

  return col()
    .find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(notificationId) {
  return col().updateOne(
    { _id: new ObjectId(notificationId) },
    { $set: { read: true, readAt: new Date() } },
  );
}

/**
 * Mark all user notifications as read
 */
export async function markAllNotificationsRead(userId) {
  return col().updateMany(
    { userId: new ObjectId(userId), read: false },
    { $set: { read: true, readAt: new Date() } },
  );
}
