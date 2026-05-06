import { ObjectId } from 'mongodb';
import { getDb } from '../../config/db.js';
import { sqs, sns } from '../../config/aws.js';
import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { PublishCommand } from '@aws-sdk/client-sns';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { emitTo } from '../../socket/index.js';

const col = () => getDb().collection('notifications');
const usersCol = () => getDb().collection('users');

/**
 * Enqueue a notification.
 * 
 * Phase 1b Update (2026-04-27):
 * Migrated from SQS to BullMQ for better reliability and features.
 * This function now delegates to the queue handler.
 * 
 * Backward compatible: existing code calling this function will still work.
 */
export async function enqueueNotification(payload) {
  try {
    // Import here to avoid circular dependency during startup
    const { enqueueNotification: queueEnqueue } = await import('../../queue/notification.handler.js');
    return queueEnqueue(payload);
  } catch (err) {
    logger.error({ err, payload }, 'failed to enqueue via queue, falling back to inline');
    // Fallback: dispatch inline if queue is not ready
    return dispatch(payload).catch((e) =>
      logger.error({ err: e }, 'fallback dispatch failed'),
    );
  }
}

/**
 * Persist + fan-out across in-app socket + push.
 */
export async function dispatch({ userId, type, title, body, data = {}, channels = ['in_app', 'push'] }) {
  if (!userId) return;
  const doc = {
    userId: new ObjectId(userId),
    type, title, body, data,
    channels,
    read: false,
    createdAt: new Date(),
  };
  const r = await col().insertOne(doc);
  const notification = { _id: r.insertedId, ...doc };

  if (channels.includes('in_app')) {
    // Single canonical event name. The legacy 'notification' alias was
    // dropped after auditing the FE — every consumer (SocketProvider,
    // chatSocketService, Header badge listener) listens for
    // 'notification:new'. Double-emitting was costing ~2× the
    // pub/sub fan-out bandwidth at scale for no functional benefit.
    emitTo(`user_${userId}`, 'notification:new', notification);
  }

  if (channels.includes('push')) {
    await pushToUser(userId, { title, body, data }).catch((e) =>
      logger.warn({ err: e, userId }, 'push failed'),
    );
  }
}

async function pushToUser(userId, payload) {
  const u = await usersCol().findOne({ _id: new ObjectId(userId) }, { projection: { fcmTokens: 1 } });
  if (!u?.fcmTokens?.length) return;
  // Stub: in production each device endpoint maps to an SNS endpoint ARN
  for (const t of u.fcmTokens) {
    if (!t.endpointArn) continue;
    await sns.send(new PublishCommand({
      TargetArn: t.endpointArn,
      Message: JSON.stringify({
        default: payload.title,
        GCM: JSON.stringify({ notification: { title: payload.title, body: payload.body }, data: payload.data }),
      }),
      MessageStructure: 'json',
    }));
  }
}

export async function listForUser(userId, { page = 1, pageSize = 20 } = {}) {
  const skip = (page - 1) * pageSize;
  const filter = { userId: new ObjectId(userId) };
  const [items, total, unread] = await Promise.all([
    col().find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).toArray(),
    col().countDocuments(filter),
    col().countDocuments({ ...filter, read: false }),
  ]);
  return { items, meta: { page, pageSize, total, unread } };
}

export async function markRead(userId, notificationId) {
  await col().updateOne(
    { _id: new ObjectId(notificationId), userId: new ObjectId(userId) },
    { $set: { read: true, readAt: new Date() } },
  );
}

export async function markAllRead(userId) {
  await col().updateMany(
    { userId: new ObjectId(userId), read: false },
    { $set: { read: true, readAt: new Date() } },
  );
}
