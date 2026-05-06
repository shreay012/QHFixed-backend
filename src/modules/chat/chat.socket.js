import { logger } from '../../config/logger.js';
import * as svc from './chat.service.js';

export function registerChatHandlers(io, socket) {
  const user = socket.data.user;

  const joinHandler = async (payload, ack) => {
    try {
      const roomId = typeof payload === 'string' ? payload : payload?.roomId;
      const ok = await svc.canJoinRoom(user, roomId);
      if (!ok) return ack?.({ ok: false, error: 'FORBIDDEN' });
      socket.join(roomId);
      ack?.({ ok: true, roomId });
    } catch (e) {
      ack?.({ ok: false, error: e.code || 'INTERNAL' });
    }
  };
  socket.on('chat:join', joinHandler);
  socket.on('join-room', joinHandler);
  socket.on('join_room', joinHandler);

  // Ticket rooms (FE emits `join-ticket-room` per 4.1)
  socket.on('join-ticket-room', (payload, ack) => {
    const ticketId = typeof payload === 'string' ? payload : payload?.ticketId;
    if (!ticketId) return ack?.({ ok: false, error: 'MISSING_TICKET_ID' });
    socket.join(`ticket_${ticketId}`);
    ack?.({ ok: true, roomId: `ticket_${ticketId}` });
  });

  socket.on('chat:leave', ({ roomId }) => roomId && socket.leave(roomId));

  // Acknowledge user_online / join_user_room (no-op, room user_<id> joined on connect)
  socket.on('user_online', () => {});
  socket.on('join_user_room', () => {});

  const sendHandler = async (payload, ack) => {
    try {
      const msg = await svc.persistAndBroadcast({ sender: user, ...payload });
      ack?.({ ok: true, messageId: String(msg._id) });
    } catch (e) {
      logger.error({ err: e, userId: user.id }, 'socket message failed');
      ack?.({ ok: false, error: e.code || 'INTERNAL' });
    }
  };
  // Canonical + FE aliases (4.1)
  socket.on('message', sendHandler);
  socket.on('send-message', sendHandler);

  // Ticket message bridge: broadcast over the ticket room
  socket.on('send-ticket-message', (payload, ack) => {
    try {
      const ticketId = payload?.ticketId;
      if (!ticketId) return ack?.({ ok: false, error: 'MISSING_TICKET_ID' });
      const room = `ticket_${ticketId}`;
      const out = {
        ticketId,
        senderId: user.id,
        senderRole: user.role,
        msg: payload.msg || '',
        createdAt: new Date().toISOString(),
      };
      io.to(room).emit('new-ticket-message', out);
      io.to(room).emit('ticket:message', out);
      ack?.({ ok: true });
    } catch (e) {
      logger.error({ err: e }, 'send-ticket-message failed');
      ack?.({ ok: false, error: 'INTERNAL' });
    }
  });

  const typingHandler = (data) => {
    if (!data) return;
    const { roomId, isTyping, serviceId, customerId } = data;
    let target = roomId;
    if (!target && serviceId) {
      target = customerId && customerId !== serviceId
        ? `${customerId}_service_${serviceId}`
        : `service_${serviceId}_pending_${user.id}`;
    }
    if (!target) return;
    const payload = { userId: user.id, senderId: user.id, isTyping: !!isTyping };
    socket.to(target).emit('typing', payload);
    socket.to(target).emit('user_typing', payload);
  };
  socket.on('typing', typingHandler);
  socket.on('user_typing', typingHandler);

  socket.on('seen', async ({ roomId, messageId }) => {
    try {
      await svc.markSeen(messageId, user.id);
      io.to(roomId).emit('seen', { messageId, userId: user.id, at: new Date().toISOString() });
    } catch (e) {
      logger.warn({ err: e, userId: user.id }, 'seen failed');
    }
  });
}
