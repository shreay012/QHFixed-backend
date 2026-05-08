// Structured audit-log writer — one row per admin write op.
// Use this from controllers when the request mutates business state and
// you want a typed, queryable audit row. The legacy auditAdmin
// middleware (request envelope) still runs for blanket coverage; this
// service is for explicit, intent-rich entries (action, before, after).
//
// Storage: writes directly to the structured `audit_logs_v2` Postgres
// table via Drizzle. We bypass the generic dualCollection layer because
// audit_logs_v2 has a typed schema (actor_id, action, resource_type,
// before, after, …) that doesn't fit the generic _id/data/JSONB mirror.
import { ObjectId } from 'mongodb';
import { getPg } from '../../db/postgres.js';
import { auditLogsV2 } from '../../db/schema.js';
import { getDb as getMongo } from '../../config/db.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

function mongoIsDisabled() {
  const u = String(env.MONGO_URI || '').trim().toLowerCase();
  return !u || u === 'disabled' || u === 'skip' || u === 'none';
}

/**
 * recordAudit — fire-and-forget structured audit entry.
 *
 *   await recordAudit(req, {
 *     action: 'BOOKING_REASSIGNED',
 *     resourceType: 'booking',
 *     resourceId: booking._id,
 *     before: { resourceId: oldRes },
 *     after:  { resourceId: newRes },
 *   });
 *
 * Never throws — audit failures must not break the request. We log a
 * warning and move on.
 */
export async function recordAudit(req, entry) {
  const doc = {
    _id:          new ObjectId().toHexString(),
    actorId:      req?.user?.id || null,
    actorRole:    req?.user?.role || null,
    action:       entry.action,
    resourceType: entry.resourceType,
    resourceId:   entry.resourceId ? String(entry.resourceId) : null,
    country:      entry.country || req?.user?.country || null,
    before:       entry.before ?? null,
    after:        entry.after  ?? null,
    ip:           req?.ip || null,
    ua:           typeof req?.header === 'function' ? (req.header('user-agent') || null) : null,
    requestId:    req?.id || null,
    createdAt:    new Date(),
  };

  const pg = getPg();
  if (pg) {
    try {
      await pg.insert(auditLogsV2).values(doc);
      return;
    } catch (err) {
      logger.warn({ err, action: entry?.action }, 'recordAudit pg insert failed');
      // fall through to mongo if available
    }
  }

  if (!mongoIsDisabled()) {
    try {
      await getMongo().collection('audit_logs_v2').insertOne(doc);
    } catch (err) {
      logger.warn({ err, action: entry?.action }, 'recordAudit mongo insert failed');
    }
  }
}
