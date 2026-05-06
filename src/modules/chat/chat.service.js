import { ObjectId } from 'mongodb';
import { getDb } from '../../config/db.js';
import { AppError } from '../../utils/AppError.js';
import { emitTo } from '../../socket/index.js';
import { enqueueNotification } from '../notification/notification.service.js';

// COLLECTION_UNIFIED_FIX_V1: align with admin/pm/resource which all use 'chat'.
const col = () => getDb().collection('chat');
const usersCol = () => getDb().collection('users');

async function attachSender(messages) {
  if (!messages || !messages.length) return messages;
  const ids = [...new Set(messages.map((m) => String(m.senderId)).filter(Boolean))];
  if (!ids.length) return messages;
  const users = await usersCol()
    .find({ _id: { $in: ids.map((id) => new ObjectId(id)) } }, { projection: { name: 1, role: 1 } })
    .toArray();
  const byId = new Map(users.map((u) => [String(u._id), u]));
  return messages.map((m) => {
    const u = byId.get(String(m.senderId));
    return {
      ...m,
      msg_from: u ? { _id: String(u._id), name: u.name || 'User', role: u.role } : { _id: String(m.senderId), name: 'User' },
    };
  });
}

/**
 * Build the canonical room id for a chat.
 * If pmId provided: ${pmId}_service_${serviceId}
 * Else (pre-assignment): service_${serviceId}_pending_${userId}
 */
export function roomIdFor({ pmId, serviceId, userId }) {
  if (pmId) return `${pmId}_service_${serviceId}`;
  return `service_${serviceId}_pending_${userId}`;
}

// GROUP_CHAT_FIX_V1: booking-scoped rooms — all 4 roles converge on `booking_<id>`.
export async function canJoinRoom(user, roomId) {
  if (!roomId) return false;
  if (user.role === 'admin') return true;

  // NEW canonical group room: booking_<bookingId>
  // Membership = customer (userId) OR assigned PM (pmId) OR assigned resource (resourceId).
  if (roomId.startsWith('booking_')) {
    const bookingId = roomId.slice('booking_'.length);
    if (!/^[0-9a-f]{24}$/i.test(bookingId)) return false;
    const booking = await getDb().collection('bookings').findOne(
      { _id: new ObjectId(bookingId) },
      { projection: { userId: 1, pmId: 1, resourceId: 1 } },
    );
    if (!booking) return false;
    const uid = String(user.id);
    return [booking.userId, booking.pmId, booking.resourceId]
      .filter(Boolean).map(String).includes(uid);
  }

  // ── Legacy pairwise rooms (kept for backward compatibility) ────────────
  if (roomId.startsWith('service_') && roomId.includes('_pending_')) {
    return roomId.endsWith(`_pending_${user.id}`) || user.role === 'pm';
  }
  const [pmId] = roomId.split('_service_');
  if (user.role === 'pm') return pmId === user.id;
  if (user.role === 'user') return true; // ownership enforced via message persistence
  return false;
}

export async function getHistory({ user, customerId, serviceId, bookingId, before, limit = 50 }) {
  // BOOKING_ROOM_HISTORY_FIX_V1: prefer booking-scoped room when bookingId provided.
  let roomId;
  if (bookingId && /^[0-9a-f]{24}$/i.test(String(bookingId))) {
    roomId = `booking_${bookingId}`;
  } else if (customerId === serviceId) {
    roomId = roomIdFor({ serviceId, userId: user.id });
  } else {
    roomId = roomIdFor({ pmId: customerId, serviceId });
  }
  const filter = { roomId };
  if (before) filter._id = { $lt: new ObjectId(before) };
  const items = await col().find(filter).sort({ createdAt: -1 }).limit(Math.min(limit, 100)).toArray();
  const enriched = await attachSender(items.reverse());
  return { roomId, items: enriched };
}

export async function persistAndBroadcast({ sender, roomId, msgType = 0, msg = '', attachment = null, serviceId, bookingId, firstMsg = 0, tempId }) {
  if (!roomId) throw new AppError('VALIDATION_ERROR', 'roomId required', 422);
  if (msgType === 0 && !msg.trim() && !attachment) {
    throw new AppError('VALIDATION_ERROR', 'message empty', 422);
  }
  const doc = {
    roomId,
    serviceId: serviceId ? new ObjectId(serviceId) : null,
    bookingId: bookingId ? new ObjectId(bookingId) : null,
    senderId: new ObjectId(sender.id),
    senderRole: sender.role,
    msgType,
    msg: msg || '',
    attachment,
    firstMsg,
    seenBy: [],
    deliveredTo: [],
    createdAt: new Date(),
  };
  const r = await col().insertOne(doc);
  const baseMessage = { ...doc, _id: r.insertedId };
  const [enriched] = await attachSender([baseMessage]);
  const message = enriched;
  const payload = { ...message, tempId };

  // Canonical: room broadcast on `new-message`; direct user push on `message:new`
  // (per PLATFORM_ARCHITECTURE 4.2). FE accepts either; we no longer spam the
  // legacy `new_message` alias to avoid duplicate UI bubbles.
  emitTo(roomId, 'new-message', payload);

  // GROUP_CHAT_FIX_V1: when a bookingId is provided, fan-out direct pushes
  // to every participant's personal room so admin / resource clients that
  // haven't explicitly joined the chat room still receive the message.
  if (bookingId) {
    try {
      const b = await getDb().collection('bookings').findOne(
        { _id: new ObjectId(bookingId) },
        { projection: { userId: 1, pmId: 1, resourceId: 1 } },
      );
      if (b) {
        const ids = [b.userId, b.pmId, b.resourceId].filter(Boolean).map(String);
        for (const uid of ids) {
          if (uid !== String(sender.id)) {
            emitTo(`user_${uid}`, 'message:new', payload);
          }
        }
        // All admins are auto-joined to `role_admin`; cc them on every chat msg.
        emitTo('role_admin', 'message:new', payload);
      }
    } catch (e) {
      // Non-fatal — primary room broadcast already delivered.
    }
  }

  // Push notification to "other" participants in the room
  // Naive: derive recipient from roomId convention; admin observer ignored
  notifyOtherParticipants(roomId, sender, message).catch(() => {});

  return message;
}

// GROUP_CHAT_FIX_V1_NOTIFY: when the room is booking-scoped, notify every
// booking participant (customer + pm + resource) plus admins. Falls back to
// the legacy pairwise logic for older room IDs.
async function notifyOtherParticipants(roomId, sender, message) {
  const targets = new Set();

  if (roomId.startsWith('booking_')) {
    const bookingIdStr = roomId.slice('booking_'.length);
    if (/^[0-9a-f]{24}$/i.test(bookingIdStr)) {
      try {
        const b = await getDb().collection('bookings').findOne(
          { _id: new ObjectId(bookingIdStr) },
          { projection: { userId: 1, pmId: 1, resourceId: 1 } },
        );
        if (b) {
          [b.userId, b.pmId, b.resourceId].filter(Boolean).forEach((id) => {
            const s = String(id);
            if (s !== String(sender.id)) targets.add(s);
          });
        }
      } catch (_) { /* ignore — best-effort */ }
    }
  } else if (roomId.includes('_pending_')) {
    const userId = roomId.split('_pending_')[1];
    if (userId !== String(sender.id)) targets.add(userId);
  } else {
    const [pmId] = roomId.split('_service_');
    if (pmId && pmId !== String(sender.id)) targets.add(pmId);
  }

  for (const t of targets) {
    emitTo(`user_${t}`, 'message:new', message);
    await enqueueNotification({
      userId: t,
      type: 'CHAT_MESSAGE',
      title: 'New message',
      body: message.msg ? message.msg.slice(0, 80) : 'Attachment',
      data: { roomId },
    }).catch(() => { /* don't break broadcast on queue failure */ });
  }
}

export async function markSeen(messageId, userId) {
  await col().updateOne(
    { _id: new ObjectId(messageId) },
    { $addToSet: { seenBy: { userId: new ObjectId(userId), at: new Date() } } },
  );
}
