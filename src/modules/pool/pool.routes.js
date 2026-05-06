/**
 * PM / Resource Pool Management  (Phase 2)
 *
 * Manages the staff talent pool:
 *  - Skills & specializations
 *  - Capacity & availability windows
 *  - Leave requests
 *  - KYC documents
 *  - Performance scorecard read (write is in scorecard module)
 */
import { Router } from 'express';
import { z } from 'zod';
import { adminGuard, permGuard } from '../../middleware/role.middleware.js';
import { auditAdmin } from '../../middleware/audit.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getDb } from '../../config/db.js';
import { ObjectId } from 'mongodb';
import { AppError } from '../../utils/AppError.js';
import { toObjectId } from '../../utils/oid.js';
import { paginate, buildMeta } from '../../utils/pagination.js';
import { PERMS } from '../../config/rbac.js';

const r = Router();
r.use(adminGuard);
r.use(auditAdmin);

const usersCol = () => getDb().collection('users');
const leavesCol = () => getDb().collection('staff_leaves');
const kycCol = () => getDb().collection('kyc_documents');

/* ═══════════════════════════════════════════════════════════════
   STAFF PROFILE — skills + capacity
═══════════════════════════════════════════════════════════════ */

const profileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional().or(z.literal('')),
  skills: z.array(z.string()).optional(),
  specialization: z.array(z.string()).optional(),
  // Max concurrent bookings this staff can handle
  capacity: z.number().int().min(1).max(50).optional(),
  // Availability windows: [{ day: 'MON', from: '09:00', to: '18:00' }]
  availabilityWindows: z.array(z.object({
    day: z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']),
    from: z.string().regex(/^\d{2}:\d{2}$/),
    to: z.string().regex(/^\d{2}:\d{2}$/),
  })).optional(),
  bio: z.string().max(1000).optional(),
  city: z.string().optional(),
  country: z.string().optional(),
}).strict();

// GET /api/pool/staff?role=pm&city=Mumbai&skill=React&page=1
r.get('/staff', permGuard(PERMS.POOL_READ), asyncHandler(async (req, res) => {
  const { role, city, skill, status, page, pageSize } = req.query;
  const p = paginate({ page, pageSize });
  const filter = { deletedAt: { $exists: false } };
  if (role) filter.role = role;
  if (city) filter.city = city;
  if (skill) filter.skills = skill; // MongoDB exact match on array element
  if (status) filter['meta.status'] = status;

  const [items, total] = await Promise.all([
    usersCol().find(filter)
      .sort({ createdAt: -1 }).skip(p.skip).limit(p.limit)
      .project({ password: 0, fcmTokens: 0 })
      .toArray(),
    usersCol().countDocuments(filter),
  ]);
  res.json({ success: true, data: items, meta: buildMeta({ page: p.page, pageSize: p.pageSize, total }) });
}));

// GET /api/pool/staff/:id
r.get('/staff/:id', permGuard(PERMS.POOL_READ), asyncHandler(async (req, res) => {
  const u = await usersCol().findOne(
    { _id: toObjectId(req.params.id), role: { $in: ['pm', 'resource'] } },
    { projection: { password: 0, fcmTokens: 0 } },
  );
  if (!u) throw new AppError('RESOURCE_NOT_FOUND', 'Staff member not found', 404);

  // Attach active booking count
  const activeBookings = await getDb().collection('jobs').countDocuments({
    $or: [{ pmId: u._id }, { resourceId: u._id }],
    status: { $in: ['assigned_to_pm', 'in_progress'] },
  });

  res.json({ success: true, data: { ...u, activeBookings } });
}));

// PATCH /api/pool/staff/:id — update skills / capacity / availability
r.patch('/staff/:id', permGuard(PERMS.POOL_WRITE), validate(profileSchema), asyncHandler(async (req, res) => {
  const id = toObjectId(req.params.id);
  const $set = { updatedAt: new Date() };
  const allowed = ['name', 'email', 'skills', 'specialization', 'capacity', 'availabilityWindows', 'bio', 'city', 'country'];
  for (const k of allowed) {
    if (req.body[k] !== undefined) $set[k] = req.body[k];
  }
  const result = await usersCol().updateOne(
    { _id: id, role: { $in: ['pm', 'resource'] } },
    { $set },
  );
  if (!result.matchedCount) throw new AppError('RESOURCE_NOT_FOUND', 'Staff member not found', 404);
  const updated = await usersCol().findOne({ _id: id }, { projection: { password: 0, fcmTokens: 0 } });
  res.json({ success: true, data: updated });
}));

// PATCH /api/pool/staff/:id/status — activate / suspend
r.patch('/staff/:id/status', permGuard(PERMS.POOL_WRITE), validate(z.object({
  status: z.enum(['active', 'suspended', 'on_leave']),
})), asyncHandler(async (req, res) => {
  const id = toObjectId(req.params.id);
  await usersCol().updateOne(
    { _id: id, role: { $in: ['pm', 'resource'] } },
    { $set: { 'meta.status': req.body.status, updatedAt: new Date() } },
  );
  res.json({ success: true });
}));

/* ═══════════════════════════════════════════════════════════════
   LEAVES
═══════════════════════════════════════════════════════════════ */

const leaveSchema = z.object({
  staffId: z.string().regex(/^[0-9a-f]{24}$/),
  from: z.string().datetime(),
  to: z.string().datetime(),
  reason: z.string().max(500).optional().default(''),
  type: z.enum(['casual', 'sick', 'unpaid', 'other']).default('casual'),
});

// GET /api/pool/leaves?staffId=xxx&status=pending
r.get('/leaves', permGuard(PERMS.POOL_READ), asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.staffId) filter.staffId = toObjectId(req.query.staffId);
  if (req.query.status) filter.status = req.query.status;
  const items = await leavesCol().find(filter).sort({ from: -1 }).limit(100).toArray();
  res.json({ success: true, data: items });
}));

// POST /api/pool/leaves — admin creates/approves leave for a staff member
r.post('/leaves', permGuard(PERMS.POOL_WRITE), validate(leaveSchema), asyncHandler(async (req, res) => {
  const staffId = toObjectId(req.body.staffId, 'staffId');
  const staff = await usersCol().findOne({ _id: staffId, role: { $in: ['pm', 'resource'] } });
  if (!staff) throw new AppError('RESOURCE_NOT_FOUND', 'Staff member not found', 404);

  const from = new Date(req.body.from);
  const to = new Date(req.body.to);
  if (from >= to) throw new AppError('VALIDATION_ERROR', 'from must be before to', 400);

  // Check for conflicting active bookings during leave period
  const conflicts = await getDb().collection('jobs').countDocuments({
    $or: [{ pmId: staffId }, { resourceId: staffId }],
    status: { $in: ['assigned_to_pm', 'in_progress'] },
    'schedule.startTime': { $lte: to },
    'schedule.endTime': { $gte: from },
  });

  const doc = {
    staffId,
    staffName: staff.name || '',
    staffRole: staff.role,
    from,
    to,
    reason: req.body.reason,
    type: req.body.type,
    status: 'approved',
    approvedBy: new ObjectId(req.user.id),
    conflictingBookings: conflicts,
    createdAt: new Date(),
  };
  const ins = await leavesCol().insertOne(doc);

  // Set staff status to on_leave if leave starts now or in past
  if (from <= new Date()) {
    await usersCol().updateOne({ _id: staffId }, { $set: { 'meta.status': 'on_leave', updatedAt: new Date() } });
  }

  res.status(201).json({ success: true, data: { _id: ins.insertedId, ...doc }, conflictingBookings: conflicts });
}));

// DELETE /api/pool/leaves/:id — revoke leave
r.delete('/leaves/:id', permGuard(PERMS.POOL_WRITE), asyncHandler(async (req, res) => {
  const id = toObjectId(req.params.id);
  const leave = await leavesCol().findOne({ _id: id });
  if (!leave) throw new AppError('RESOURCE_NOT_FOUND', 'Leave not found', 404);
  await leavesCol().updateOne({ _id: id }, { $set: { status: 'revoked', updatedAt: new Date() } });
  // Restore staff status to active
  await usersCol().updateOne({ _id: leave.staffId }, { $set: { 'meta.status': 'active', updatedAt: new Date() } });
  res.json({ success: true });
}));

/* ═══════════════════════════════════════════════════════════════
   KYC DOCUMENTS
═══════════════════════════════════════════════════════════════ */

const kycSchema = z.object({
  userId: z.string().regex(/^[0-9a-f]{24}$/),
  type: z.enum(['aadhaar', 'pan', 'passport', 'driving_license', 'other']),
  fileUrl: z.string().url(),
  notes: z.string().max(500).optional().default(''),
});

// GET /api/pool/kyc?status=pending
r.get('/kyc', permGuard(PERMS.KYC_READ), asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.userId) filter.userId = toObjectId(req.query.userId);
  const items = await kycCol().find(filter).sort({ createdAt: -1 }).limit(100).toArray();
  res.json({ success: true, data: items });
}));

// POST /api/pool/kyc — admin uploads KYC document for a staff member
r.post('/kyc', permGuard(PERMS.KYC_WRITE), validate(kycSchema), asyncHandler(async (req, res) => {
  const userId = toObjectId(req.body.userId, 'userId');
  const doc = {
    userId,
    type: req.body.type,
    fileUrl: req.body.fileUrl,
    notes: req.body.notes,
    status: 'pending',
    submittedAt: new Date(),
    reviewedBy: null,
    reviewedAt: null,
    createdAt: new Date(),
  };
  const ins = await kycCol().insertOne(doc);
  res.status(201).json({ success: true, data: { _id: ins.insertedId, ...doc } });
}));

// PATCH /api/pool/kyc/:id/review — approve or reject
r.patch('/kyc/:id/review', permGuard(PERMS.KYC_WRITE), validate(z.object({
  status: z.enum(['approved', 'rejected']),
  notes: z.string().max(500).optional().default(''),
})), asyncHandler(async (req, res) => {
  const id = toObjectId(req.params.id);
  const kyc = await kycCol().findOne({ _id: id });
  if (!kyc) throw new AppError('RESOURCE_NOT_FOUND', 'KYC record not found', 404);

  await kycCol().updateOne({ _id: id }, { $set: {
    status: req.body.status,
    notes: req.body.notes,
    reviewedBy: new ObjectId(req.user.id),
    reviewedAt: new Date(),
    updatedAt: new Date(),
  }});

  // Mark user's KYC as verified if approved
  if (req.body.status === 'approved') {
    await usersCol().updateOne({ _id: kyc.userId }, { $set: { 'meta.kycVerified': true, updatedAt: new Date() } });
  }

  res.json({ success: true });
}));

/* ═══════════════════════════════════════════════════════════════
   CAPACITY OVERVIEW — how many active jobs each PM/resource has
═══════════════════════════════════════════════════════════════ */
r.get('/capacity', permGuard(PERMS.POOL_READ), asyncHandler(async (req, res) => {
  const role = req.query.role || 'pm';
  const staff = await usersCol().find(
    { role, deletedAt: { $exists: false } },
    { projection: { _id: 1, name: 1, capacity: 1, 'meta.status': 1 } },
  ).toArray();

  const staffIds = staff.map((s) => s._id);
  const fieldKey = role === 'pm' ? 'pmId' : 'resourceId';

  const activeByStaff = await getDb().collection('jobs').aggregate([
    { $match: { [fieldKey]: { $in: staffIds }, status: { $in: ['assigned_to_pm', 'in_progress'] } } },
    { $group: { _id: `$${fieldKey}`, active: { $sum: 1 } } },
  ]).toArray();

  const activeMap = new Map(activeByStaff.map((a) => [String(a._id), a.active]));

  const result = staff.map((s) => ({
    ...s,
    activeBookings: activeMap.get(String(s._id)) || 0,
    maxCapacity: s.capacity || 5,
    utilisation: Math.round(((activeMap.get(String(s._id)) || 0) / (s.capacity || 5)) * 100),
  }));

  res.json({ success: true, data: result });
}));

export default r;
