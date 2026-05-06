// Audit-log middleware for admin writes.
// Captures POST/PUT/PATCH/DELETE on /api/admin/* with actor, path, params,
// status code, and a sanitized request body. Stored in `audit_logs`.
import { getDb } from '../config/db.js';
import { logger } from '../config/logger.js';

const SENSITIVE_KEYS = ['password', 'token', 'otp', 'refreshToken', 'fcmToken', 'razorpay_signature'];

function sanitize(obj, depth = 0) {
  if (depth > 4 || obj == null) return obj;
  if (Array.isArray(obj)) return obj.map((x) => sanitize(x, depth + 1));
  if (typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (SENSITIVE_KEYS.includes(k)) out[k] = '[REDACTED]';
      else if (typeof v === 'string' && v.length > 500) out[k] = v.slice(0, 500) + '…';
      else out[k] = sanitize(v, depth + 1);
    }
    return out;
  }
  return obj;
}

export function auditAdmin(req, res, next) {
  const writeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!writeMethods.includes(req.method)) return next();

  const startedAt = new Date();
  res.on('finish', () => {
    // Don't audit failures the auth middleware blocked.
    if (res.statusCode === 401 || res.statusCode === 403) return;
    const entry = {
      at: startedAt,
      actor: req.user
        ? { id: req.user.id, role: req.user.role, sessionId: req.user.sessionId }
        : { id: 'anonymous', role: 'unknown' },
      method: req.method,
      path: req.originalUrl || req.url,
      params: sanitize(req.params || {}),
      query: sanitize(req.query || {}),
      body: sanitize(req.body || {}),
      statusCode: res.statusCode,
      ip: req.ip,
      ua: req.header('user-agent') || '',
      durationMs: Date.now() - startedAt.getTime(),
    };
    getDb().collection('audit_logs').insertOne(entry).catch((e) => {
      logger.warn({ err: e }, 'audit insert failed');
    });
  });
  next();
}
