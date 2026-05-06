import { ObjectId } from 'mongodb';
import { getDb } from '../../config/db.js';
import { logger } from '../../config/logger.js';
import { enqueueNotification } from '../notification/notification.service.js';
import { emitTo } from '../../socket/index.js';

const jobsCol = () => getDb().collection('jobs');
const usersCol = () => getDb().collection('users');

/**
 * Notify every admin user with an in-app + push notification.
 * Also emits a generic 'role_admin' socket room event for live admin UIs.
 */
export async function notifyAdmins({ type = 'admin_alert', title, body, data = {} }) {
  try {
    emitTo('role_admin', 'notification:new', { type, title, body, data, createdAt: new Date() });
  } catch (e) {
    logger.warn({ err: e }, 'admin room emit failed');
  }
  const admins = await usersCol().find({ role: 'admin' }, { projection: { _id: 1 } }).toArray();
  await Promise.all(admins.map((a) =>
    enqueueNotification({ userId: String(a._id), type, title, body, data }).catch(() => {}),
  ));
}

/**
 * Pick the PM with the fewest active assignments (round-robin by load).
 * Active = jobs with status assigned_to_pm | in_progress | paused.
 */
async function pickAvailablePm() {
  const pms = await usersCol().find(
    { role: 'pm', 'meta.status': { $ne: 'inactive' } },
    { projection: { name: 1, mobile: 1, _id: 1 } },
  ).toArray();
  if (!pms.length) return null;

  const ACTIVE = ['assigned_to_pm', 'in_progress', 'paused'];
  const counts = await Promise.all(pms.map((p) =>
    jobsCol().countDocuments({ pmId: p._id, status: { $in: ACTIVE } }),
  ));
  let best = 0;
  for (let i = 1; i < pms.length; i++) if (counts[i] < counts[best]) best = i;
  return pms[best];
}

/**
 * Auto-assign a PM to a freshly paid job.
 * - No-op if job already has a PM.
 * - Sets pmId / projectManager / status='assigned_to_pm'.
 * - Notifies the assigned PM and all admins.
 * Returns the assignment result or null if no PM available.
 */
export async function autoAssignPm(jobIdLike) {
  let jobId;
  try { jobId = new ObjectId(String(jobIdLike)); } catch { return null; }

  const job = await jobsCol().findOne({ _id: jobId });
  if (!job) return null;
  if (job.pmId) return { jobId: String(job._id), pmId: String(job.pmId), already: true };

  const pm = await pickAvailablePm();
  if (!pm) {
    logger.warn({ jobId: String(jobId) }, 'auto-assign: no PM available');
    await notifyAdmins({
      type: 'pm_unavailable',
      title: 'New paid booking — needs PM',
      body: `Booking ${String(jobId).slice(-8)} is paid but no PM is available. Please assign manually.`,
      data: { bookingId: String(jobId) },
    });
    return null;
  }

  const now = new Date();
  const result = await jobsCol().updateOne(
    { _id: jobId, pmId: { $exists: false } },
    {
      $set: {
        pmId: pm._id,
        projectManager: { _id: pm._id, name: pm.name || 'PM', mobile: pm.mobile || '' },
        status: 'assigned_to_pm',
        autoAssignedAt: now,
        updatedAt: now,
      },
      $push: {
        history: {
          at: now, actorRole: 'system', event: 'auto_assigned_pm',
          note: `Auto-assigned to PM ${pm.name || pm._id}`,
        },
      },
    },
  );

  // Another concurrent call already assigned a PM — skip notifications.
  if (result.modifiedCount === 0) {
    logger.info({ jobId: String(jobId) }, 'auto-assign: already assigned by concurrent request, skipping');
    return { jobId: String(jobId), skipped: true };
  }

  // Live socket events
  try {
    emitTo(`user_${pm._id}`, 'booking:assigned', { bookingId: String(jobId) });
    emitTo('role_admin', 'booking:assigned', { bookingId: String(jobId), pmId: String(pm._id) });
    if (job.userId) emitTo(`user_${job.userId}`, 'booking:status', { bookingId: String(jobId), status: 'assigned_to_pm' });
  } catch (e) { logger.warn({ err: e }, 'auto-assign socket emit failed'); }

  // PM notification
  enqueueNotification({
    userId: String(pm._id),
    type: 'booking_assigned',
    title: 'New booking assigned',
    body: `You have been assigned booking ${String(jobId).slice(-8)}. Please start the work when ready.`,
    data: { bookingId: String(jobId) },
  }).catch(() => {});

  // Admin fan-out
  await notifyAdmins({
    type: 'booking_paid',
    title: 'Booking paid & PM assigned',
    body: `Booking ${String(jobId).slice(-8)} paid. Auto-assigned to ${pm.name || 'PM'}.`,
    data: { bookingId: String(jobId), pmId: String(pm._id) },
  });

  // Customer notification
  if (job.userId) {
    enqueueNotification({
      userId: String(job.userId),
      type: 'booking_assigned',
      title: 'Project Manager assigned',
      body: `${pm.name || 'A project manager'} has been assigned to your booking.`,
      data: { bookingId: String(jobId) },
    }).catch(() => {});
  }

  return { jobId: String(jobId), pmId: String(pm._id), pmName: pm.name };
}
