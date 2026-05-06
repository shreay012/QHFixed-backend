/**
 * Bulk Actions  (Phase 2)
 *
 * Endpoints for ops team to act on multiple bookings / users at once:
 *  - POST /bulk/reassign      — reassign multiple bookings to a new PM
 *  - POST /bulk/notify        — send notification to a list of users
 *  - POST /bulk/cancel        — cancel multiple bookings (with reason)
 *  - POST /bulk/import-staff  — CSV upload to create PM/resource accounts
 *  - POST /bulk/refund-trigger — queue refunds for multiple bookings
 *
 * All writes are audit-logged and permission-gated.
 */
import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { adminGuard, permGuard } from '../../middleware/role.middleware.js';
import { auditAdmin } from '../../middleware/audit.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getDb } from '../../config/db.js';
import { ObjectId } from 'mongodb';
import { AppError } from '../../utils/AppError.js';
import { toObjectId } from '../../utils/oid.js';
import { PERMS } from '../../config/rbac.js';
import { enqueueJob, QUEUES } from '../../queue/index.js';

const r = Router();
r.use(adminGuard);
r.use(auditAdmin);

const jobsCol = () => getDb().collection('jobs');
const usersCol = () => getDb().collection('users');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (_req, file, cb) => {
    if (!file.originalname.endsWith('.csv')) return cb(new AppError('VALIDATION_ERROR', 'Only CSV files accepted', 400));
    cb(null, true);
  },
});

/* ─── Bulk Reassign ──────────────────────────────────────────── */
const reassignSchema = z.object({
  bookingIds: z.array(z.string().regex(/^[0-9a-f]{24}$/)).min(1).max(200),
  pmId: z.string().regex(/^[0-9a-f]{24}$/),
  reason: z.string().max(500).optional().default('Bulk reassignment'),
});

r.post('/reassign', permGuard(PERMS.BOOKING_WRITE), validate(reassignSchema), asyncHandler(async (req, res) => {
  const { bookingIds, pmId, reason } = req.body;

  const pm = await usersCol().findOne({ _id: toObjectId(pmId), role: 'pm' });
  if (!pm) throw new AppError('RESOURCE_NOT_FOUND', 'PM not found', 404);

  const oids = bookingIds.map((id) => toObjectId(id));
  const result = await jobsCol().updateMany(
    { _id: { $in: oids }, status: { $nin: ['completed', 'cancelled'] } },
    { $set: {
      pmId: pm._id,
      projectManager: { _id: pm._id, name: pm.name, mobile: pm.mobile },
      status: 'assigned_to_pm',
      reassignReason: reason,
      reassignedBy: new ObjectId(req.user.id),
      reassignedAt: new Date(),
      updatedAt: new Date(),
    }},
  );

  // Notify PM about new assignments
  await enqueueJob(QUEUES.NOTIFICATIONS, {
    type: 'booking_bulk_assigned',
    userId: pmId,
    title: 'Bookings assigned to you',
    body: `${result.modifiedCount} booking(s) have been assigned to you.`,
    data: { count: result.modifiedCount },
  }).catch(() => {});

  res.json({ success: true, data: { matched: result.matchedCount, modified: result.modifiedCount } });
}));

/* ─── Bulk Notify ────────────────────────────────────────────── */
const notifySchema = z.object({
  userIds: z.array(z.string().regex(/^[0-9a-f]{24}$/)).min(1).max(1000),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(1000),
  type: z.string().default('admin_message'),
  data: z.record(z.string()).optional().default({}),
});

r.post('/notify', permGuard(PERMS.BOOKING_WRITE), validate(notifySchema), asyncHandler(async (req, res) => {
  const { userIds, title, body, type, data } = req.body;

  // Batch-enqueue one notification job per user
  const jobs = userIds.map((userId) =>
    enqueueJob(QUEUES.NOTIFICATIONS, { type, userId, title, body, data }).catch(() => null),
  );
  await Promise.all(jobs);

  res.json({ success: true, data: { enqueued: userIds.length } });
}));

/* ─── Bulk Cancel ────────────────────────────────────────────── */
const cancelSchema = z.object({
  bookingIds: z.array(z.string().regex(/^[0-9a-f]{24}$/)).min(1).max(200),
  reason: z.string().min(5).max(500),
});

r.post('/cancel', permGuard(PERMS.BOOKING_WRITE), validate(cancelSchema), asyncHandler(async (req, res) => {
  const { bookingIds, reason } = req.body;
  const oids = bookingIds.map((id) => toObjectId(id));

  const result = await jobsCol().updateMany(
    { _id: { $in: oids }, status: { $nin: ['completed', 'cancelled'] } },
    { $set: {
      status: 'cancelled',
      cancelReason: reason,
      cancelledBy: new ObjectId(req.user.id),
      cancelledAt: new Date(),
      updatedAt: new Date(),
    }},
  );

  res.json({ success: true, data: { matched: result.matchedCount, modified: result.modifiedCount } });
}));

/* ─── Bulk Refund Trigger ────────────────────────────────────── */
r.post('/refund-trigger', permGuard(PERMS.REFUND_APPROVE), validate(z.object({
  bookingIds: z.array(z.string().regex(/^[0-9a-f]{24}$/)).min(1).max(100),
  reason: z.string().min(5).max(500),
})), asyncHandler(async (req, res) => {
  const { bookingIds, reason } = req.body;
  const refundsCol = getDb().collection('refunds');
  const now = new Date();

  const docs = bookingIds.map((bookingId) => ({
    bookingId: toObjectId(bookingId),
    reason,
    status: 'pending',
    requestedBy: new ObjectId(req.user.id),
    createdAt: now,
    updatedAt: now,
  }));

  await refundsCol.insertMany(docs, { ordered: false }).catch(() => {});

  // Queue a refund job per booking
  await Promise.all(
    bookingIds.map((bookingId) =>
      enqueueJob(QUEUES.ANALYTICS, { type: 'process_refund', bookingId, reason }).catch(() => null),
    ),
  );

  res.json({ success: true, data: { queued: bookingIds.length } });
}));

/* ─── CSV Import: Staff ──────────────────────────────────────── */
// Expected CSV columns: name, mobile, email, role (pm|resource), skills (comma-sep), city
r.post('/import-staff', permGuard(PERMS.POOL_WRITE), upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('VALIDATION_ERROR', 'CSV file required', 400);

  let rows;
  try {
    rows = parse(req.file.buffer.toString('utf8'), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch {
    throw new AppError('VALIDATION_ERROR', 'Failed to parse CSV', 400);
  }

  const results = { created: 0, skipped: 0, errors: [] };
  const now = new Date();

  for (const row of rows) {
    const mobile = String(row.mobile || '').replace(/\D/g, '');
    const role = (row.role || '').toLowerCase();

    if (!mobile || !['pm', 'resource'].includes(role)) {
      results.errors.push({ row, reason: 'missing mobile or invalid role' });
      results.skipped++;
      continue;
    }

    const exists = await usersCol().findOne({ mobile });
    if (exists) { results.skipped++; continue; }

    try {
      await usersCol().insertOne({
        role,
        name: row.name || '',
        mobile,
        email: row.email || '',
        skills: row.skills ? row.skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
        city: row.city || '',
        meta: { isProfileComplete: true, status: 'active' },
        createdAt: now,
        updatedAt: now,
      });
      results.created++;
    } catch (err) {
      results.errors.push({ row, reason: err.message });
      results.skipped++;
    }
  }

  res.json({ success: true, data: results });
}));

export default r;
