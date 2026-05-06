import { ObjectId } from 'mongodb';
import { AppError } from '../../utils/AppError.js';
import { acquireLock, idempotencyGetOrSet } from '../../utils/idempotency.js';
import { paginate, buildMeta } from '../../utils/pagination.js';
import { publish } from '../../config/redis.js';
import { emitTo } from '../../socket/index.js';
import { enqueueNotification } from '../notification/notification.service.js';
import * as repo from './booking.repository.js';
import { releaseLock } from '../../utils/idempotency.js';

const ALLOWED = {
  pending:        ['confirmed', 'cancelled'],
  paid:           ['assigned_to_pm', 'cancelled'],
  scheduled:      ['assigned_to_pm', 'cancelled'],
  confirmed:      ['assigned_to_pm', 'cancelled'],
  assigned_to_pm: ['in_progress', 'paused', 'cancelled'],
  paused:         ['in_progress', 'cancelled'],
  in_progress:    ['completed', 'paused', 'cancelled'],
  completed:      [],
  cancelled:      [],
};

export async function create({ userId, payload, idemKey, actor }) {
  if (idemKey) {
    const cached = await idempotencyGetOrSet(`booking:${userId}:${idemKey}`);
    if (cached) return cached;
  }

  const slotKey = `slot:${payload.serviceId}:${payload.startTime}`;
  const locked = await acquireLock(slotKey, 60);
  if (!locked) {
    throw new AppError('BOOKING_SLOT_TAKEN', 'Selected slot is no longer available', 409);
  }

  const now = new Date();
  const booking = await repo.insert({
    userId: new ObjectId(userId),
    serviceId: new ObjectId(payload.serviceId),
    status: 'pending',
    startTime: new Date(payload.startTime),
    endTime: new Date(payload.endTime),
    duration: payload.duration,
    requirements: payload.requirements || '',
    technologies: payload.technologies || [],
    pricing: { subtotal: 0, tax: 0, total: 0, currency: 'INR' }, // filled by job/pricing
    createdAt: now,
    updatedAt: now,
  });
  // Release the slot lock immediately after successful insert so the slot
  // isn't needlessly blocked for the remaining TTL window.
  releaseLock(slotKey).catch(() => {});

  await repo.appendHistory({
    bookingId: booking._id,
    serviceId: booking.serviceId,
    fromStatus: null,
    toStatus: 'pending',
    actor: { id: actor.id, role: actor.role },
    at: now,
  });

  await publish('booking.created', { bookingId: String(booking._id), userId });
  emitTo('role_admin', 'booking:new', { bookingId: String(booking._id), userId });
  await enqueueNotification({
    userId,
    type: 'BOOKING_CREATED',
    title: 'Booking received',
    body: 'Your booking has been received and is awaiting confirmation.',
    data: { bookingId: String(booking._id) },
  });

  if (idemKey) await idempotencyGetOrSet(`booking:${userId}:${idemKey}`, booking, 86400);
  return booking;
}

export async function update(id, fields, user) {
  const b = await repo.findById(id);
  if (!b) throw new AppError('RESOURCE_NOT_FOUND', 'Booking not found', 404);
  ensureOwnerOrStaff(b, user);
  if (b.status !== 'pending' && b.status !== 'confirmed') {
    throw new AppError('INVALID_TRANSITION', 'Cannot edit booking in this status', 409);
  }
  return repo.updateOne(id, fields);
}

export async function transition(id, nextStatus, actor, note = '', extra = {}) {
  const b = await repo.findById(id);
  if (!b) throw new AppError('RESOURCE_NOT_FOUND', 'Booking not found', 404);
  if (!ALLOWED[b.status]?.includes(nextStatus)) {
    throw new AppError('INVALID_TRANSITION', `Cannot transition ${b.status} → ${nextStatus}`, 409);
  }

  const set = { status: nextStatus, ...extra };
  if (nextStatus === 'cancelled') {
    set.cancellation = { reason: note || 'cancelled', by: actor.id, at: new Date() };
  }
  const updated = await repo.updateOne(id, set);

  await repo.appendHistory({
    bookingId: updated._id,
    serviceId: updated.serviceId,
    fromStatus: b.status,
    toStatus: nextStatus,
    actor: { id: actor.id, role: actor.role },
    note,
    at: new Date(),
  });

  await publish(`booking.${nextStatus}`, {
    bookingId: String(updated._id),
    userId: String(updated.userId),
    pmId: updated.pmId ? String(updated.pmId) : null,
  });

  // Emit to relevant rooms
  emitTo(`user_${updated.userId}`, 'booking:status', {
    bookingId: String(updated._id),
    status: nextStatus,
    updatedAt: updated.updatedAt,
  });
  if (updated.pmId) {
    emitTo(`user_${updated.pmId}`, 'booking:status', {
      bookingId: String(updated._id),
      status: nextStatus,
    });
  }

  await enqueueNotification({
    userId: String(updated.userId),
    type: `BOOKING_${nextStatus.toUpperCase()}`,
    title: 'Booking update',
    body: `Your booking is now ${nextStatus.replace(/_/g, ' ')}.`,
    data: { bookingId: String(updated._id) },
  });

  return updated;
}

export async function cancel(id, reason, user) {
  const b = await repo.findById(id);
  if (!b) throw new AppError('RESOURCE_NOT_FOUND', 'Booking not found', 404);
  ensureOwnerOrStaff(b, user);
  return transition(id, 'cancelled', user, reason);
}

export async function extend(id, body, user) {
  const { additionalHours, newEndTime, hourlyRate, subtotal, gst, total } = body;
  const b = await repo.findById(id);
  if (!b) throw new AppError('RESOURCE_NOT_FOUND', 'Booking not found', 404);
  ensureOwnerOrStaff(b, user);

  // Calculate new end time: use provided value or derive from current endTime
  const baseEnd = b.endTime ? new Date(b.endTime) : new Date();
  const computedEnd = newEndTime ? new Date(newEndTime) : new Date(baseEnd.getTime() + additionalHours * 3600_000);

  const updatePayload = {
    duration: (b.duration || 0) + additionalHours,
    endTime: computedEnd,
  };

  // Store extension pricing if provided
  if (total != null) {
    updatePayload['pricing.extensionTotal'] = (b.pricing?.extensionTotal || 0) + total;
    updatePayload['pricing.totalPaid'] = (b.pricing?.totalPaid || b.pricing?.total || 0) + total;
  }

  return repo.updateOne(id, updatePayload);
}

export async function getById(id, user) {
  const b = await repo.findById(id);
  if (b) {
    ensureOwnerOrStaff(b, user);
    return b;
  }
  // Fallback: id may belong to the `jobs` collection (v3 booking flow writes there).
  const { getDb } = await import('../../config/db.js');
  let jobId;
  try { jobId = new ObjectId(String(id)); } catch { return null; }
  const job = await getDb().collection('jobs').findOne({ _id: jobId });
  if (!job) return null;
  const isOwner = String(job.userId) === user.id;
  const isPm = job.pmId && String(job.pmId) === user.id;
  if (!isOwner && !isPm && user.role !== 'admin') {
    throw new AppError('AUTH_FORBIDDEN', 'Forbidden', 403);
  }
  // Populate first service for workspace UI
  let serviceDoc = null;
  const firstSvcId = job.services?.[0]?.serviceId || job.serviceId;
  if (firstSvcId) {
    try {
      serviceDoc = await getDb().collection('services').findOne({ _id: new ObjectId(String(firstSvcId)) });
    } catch {}
  }
  return {
    ...job,
    serviceId: serviceDoc || job.serviceId,
    resourceId: job.assignedResource?._id || job.resourceId || null,
    pmId: job.projectManager?._id || job.pmId || null,
  };
}

export async function listForCustomer({ userId, statuses, page, pageSize }) {
  const p = paginate({ page, pageSize });
  const { getDb } = await import('../../config/db.js');
  const jobsCol = getDb().collection('jobs');
  const servicesCol = getDb().collection('services');

  const filter = { userId: new ObjectId(userId) };
  if (statuses?.length) {
    // Treat 'completed' literally; treat ongoing-set as everything else not cancelled
    const ongoingAliases = new Set(['confirmed', 'in_progress', 'assigned_to_pm', 'pending']);
    const wantsCompleted = statuses.includes('completed');
    const wantsOngoing = statuses.some((s) => ongoingAliases.has(s));
    if (wantsCompleted && !wantsOngoing) filter.status = 'completed';
    else if (wantsOngoing && !wantsCompleted) filter.status = { $nin: ['completed', 'cancelled'] };
    else filter.status = { $in: statuses };
  }

  const [rawItems, total] = await Promise.all([
    jobsCol.find(filter).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit).toArray(),
    jobsCol.countDocuments(filter),
  ]);

  // Collect service IDs to populate
  const svcIdSet = new Set();
  for (const job of rawItems) {
    if (job.serviceId) svcIdSet.add(String(job.serviceId));
    for (const s of (job.services || [])) {
      if (s?.serviceId) svcIdSet.add(String(s.serviceId));
    }
  }
  const svcDocs = svcIdSet.size
    ? await servicesCol.find({
        _id: { $in: Array.from(svcIdSet).map((x) => { try { return new ObjectId(x); } catch { return null; } }).filter(Boolean) },
      }).toArray()
    : [];
  const svcMap = new Map(svcDocs.map((d) => [String(d._id), d]));

  const items = rawItems.map((job) => {
    const services = Array.isArray(job.services) && job.services.length
      ? job.services.map((s) => {
          const svc = svcMap.get(String(s.serviceId)) || null;
          const techNames = Array.isArray(svc?.technologies) ? svc.technologies : [];
          const techs = (Array.isArray(s.technologyIds) ? s.technologyIds : []).map((t) => {
            if (t && typeof t === 'object' && t.name) return t;
            const str = String(t);
            const byName = techNames.find((n) => String(n).toLowerCase() === str.toLowerCase());
            if (byName) return { name: byName };
            const idx = Number(str);
            if (!Number.isNaN(idx) && techNames[idx]) return { name: techNames[idx] };
            return { _id: str, name: str };
          });
          return {
            _id: s._id || job._id,
            bookingId: job._id,
            serviceId: svc || s.serviceId,
            technologyIds: techs,
            preferredStartDate: s.preferredStartDate || null,
            preferredEndDate: s.preferredEndDate || null,
            durationTime: s.durationTime || job.durationTime || 0,
            status: s.status || job.status || 'pending',
            assignedResource: s.assignedResource || null,
            projectManager: s.projectManager || null,
            chatSummary: s.chatSummary || {},
          };
        })
      : [{
          _id: job._id,
          bookingId: job._id,
          serviceId: svcMap.get(String(job.serviceId)) || job.serviceId,
          technologyIds: [],
          preferredStartDate: job.preferredStartDate || job.startTime || null,
          preferredEndDate: job.preferredEndDate || job.endTime || null,
          durationTime: job.durationTime || 0,
          status: job.status || 'pending',
          assignedResource: null,
          projectManager: null,
          chatSummary: {},
        }];
    return { ...job, services };
  });

  return { items, meta: buildMeta({ page: p.page, pageSize: p.pageSize, total }) };
}

export async function listAll({ status, page, pageSize }) {
  const p = paginate({ page, pageSize });
  const filter = status ? { status } : {};
  const [items, total] = await Promise.all([
    repo.find(filter, { skip: p.skip, limit: p.limit }),
    repo.count(filter),
  ]);
  return { items, meta: buildMeta({ page: p.page, pageSize: p.pageSize, total }) };
}

export async function getTimeline(bookingId, serviceId) {
  return repo.findHistory(bookingId, serviceId);
}

export async function assignPm(bookingId, pmId, actor) {
  return transition(bookingId, 'assigned_to_pm', actor, `Assigned to PM ${pmId}`, {
    pmId: new ObjectId(pmId),
  });
}

function ensureOwnerOrStaff(b, user) {
  const isOwner = String(b.userId) === user.id;
  const isPm = b.pmId && String(b.pmId) === user.id;
  if (!isOwner && !isPm && user.role !== 'admin') {
    throw new AppError('AUTH_FORBIDDEN', 'Forbidden', 403);
  }
}
