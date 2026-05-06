import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import jwt from 'jsonwebtoken';
import { pubClient, subClient, redis } from '../config/redis.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { registerChatHandlers } from '../modules/chat/chat.socket.js';
import { connectedSockets } from '../config/metrics.js';

let io;

/**
 * Per-IP socket connect throttle. Without this, a single misbehaving
 * client (or a connection storm during a deploy) can DoS the auth
 * middleware via repeated handshake attempts. 30 connects/min/IP is
 * generous for legitimate use (a real user reconnects on tab focus
 * / network blip, not 30 times a minute) and tight enough to stop a
 * runaway loop. Counter lives in Redis so the limit is shared across
 * all backend nodes.
 */
const SOCKET_CONNECT_LIMIT_PER_MIN = 30;
async function isSocketConnectAllowed(ip) {
  if (!ip) return true;
  try {
    const key = `rl:sockconn:${ip}`;
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, 60);
    return count <= SOCKET_CONNECT_LIMIT_PER_MIN;
  } catch {
    // fail-open on Redis hiccup — same policy as HTTP rate limiter
    return true;
  }
}

export function attachSocketIO(httpServer) {
  io = new Server(httpServer, {
    path: '/api/socket.io',
    cors: {
      origin: env.ALLOWED_ORIGINS === '*' ? true : env.ALLOWED_ORIGINS.split(','),
      credentials: true,
    },
    // websocket-only — long-polling fallback would have required sticky
    // sessions on the load balancer (because each polling request lands
    // on a fresh node and must hit the same one that holds the session).
    // At 1M-user scale we'd rather bounce the rare client that can't do
    // websockets than complicate the LB config. Modern browsers + the
    // io-client library upgrade to ws within a single round-trip anyway.
    transports: ['websocket'],
    pingTimeout: 30000,
    pingInterval: 25000,
  });

  io.adapter(createAdapter(pubClient, subClient));

  io.use(async (socket, next) => {
    // Per-IP connect-rate guard runs BEFORE jwt.verify so a flood of
    // bad-token handshakes can't burn CPU on JWT crypto.
    const ip = socket.handshake.address || socket.conn?.remoteAddress || null;
    const allowed = await isSocketConnectAllowed(ip);
    if (!allowed) {
      logger.warn({ ip }, 'socket connect rate-limited');
      return next(new Error('RATE_LIMITED'));
    }

    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('UNAUTHORIZED'));
      const claims = jwt.verify(token, env.JWT_PUBLIC_KEY, {
        algorithms: [env.JWT_ALGORITHM],
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE,
      });
      socket.data.user = { id: claims.sub, role: claims.role, sessionId: claims.sessionId };
      next();
    } catch (e) {
      next(new Error('UNAUTHORIZED'));
    }
  });

  io.on('connection', (socket) => {
    const { id: userId, role } = socket.data.user;
    socket.join(`user_${userId}`);
    if (role === 'admin') socket.join('role_admin');

    connectedSockets.inc();
    socket.emit('connected', { userId, role, serverTime: new Date().toISOString() });
    logger.info({ userId, role, sid: socket.id }, 'socket connected');

    registerChatHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      connectedSockets.dec();
      logger.info({ userId, sid: socket.id, reason }, 'socket disconnected');
    });
  });

  return io;
}

export function getIO() {
  return io;
}

/** Helper for HTTP handlers to emit to a user/room. */
export function emitTo(target, event, payload) {
  if (!io) return;
  io.to(target).emit(event, payload);
}
