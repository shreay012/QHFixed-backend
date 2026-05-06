import { ObjectId } from 'mongodb';
import { getDb, getDualDb } from '../../config/db.js';
import { logger } from '../../config/logger.js';
import { enqueueNotification } from '../notification/notification.service.js';
import { emitTo } from '../../socket/index.js';

const jobsCol = () => getDualDb().collection('jobs');
const usersCol = () => getDualDb().collection('users');

/**
 * Notify admin users with an in-app + push notification + role_admin socket event.
 *
 * Country-aware fan-out:
 *   - super_admin always gets notified (global oversight)
 *   - admin (legacy) — global, all of them get it (preserves existing behaviour)
 *   - country_admin — only the one(s) for the booking's country (when `country`
 *     is passed). When country is null/undefined, all country_admins get it
 *     (legacy behaviour, e.g. for bootstrap notifications).
 *
 * @param {object} opts
 * @param {string} opts.type
 * @param {string} opts.title
 * @param {string} opts.body
 * @param {object} [opts.data]
 * @param {string|null} [opts.country]  Restrict country_admin recipients
 */
export async function notifyAdmins({ type = 'admin_alert', title, body, data = {}, country = null }) {
  try {
    emitTo('role_admin', 'notification:new', { type, title, body, data, createdAt: new Date() });
    if (country) emitTo(`role_country_admin_${country}`, 'notification:new', { type, title, body, data, createdAt: new Date() });
  } catch (e) {
    logger.warn({ err: e }, 'admin room emit failed');
  }

  // Recipients: super_admin (always) + legacy admin (always) +
  // country_admin filtered by country if provided.
  const orFilters = [
    { role: 'super_admin' },
    { role: 'admin' },
    country
      ? { role: 'country_admin', country }
      : { role: 'country_admin' },
  ];
  const recipients = await usersCol()
    .find({ $or: orFilters }, { projection: { _id: 1 } })
    .toArray();

  await Promise.all(recipients.map((a) =>
    enqueueNotification({ userId: String(a._id), type, title, body, data }).catch(() => {}),
  ));
}

/**
 * Pick the PM with the fewest active assignments (round-robin by load),
 * scoped to a country if provided. Active = jobs with status
 * assigned_to_pm | in_progress | paused.
 *
 * @param {string|null} country  ISO 2-letter country code; when provided,
 *   only PMs whose `country` field matches are considered. If no PM in
 *   that country, returns null (caller falls back to admin-notify).
 *   Pass null/undefined for the legacy country-agnostic selection.
 */
async function pickAvailablePm(country) {
  const filter = { role: 'pm', 'meta.status': { $ne: 'inactive' } };
  if (country) filter.country = country;
  const pms = await usersCol().find(
    filter,
    { projection: { name: 1, mobile: 1, _id: 1, country: 1 } },
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

  // Country-aware PM picker — restrict candidates to the booking's country.
  // If no PM in that country, log + notify admins so they can assign manually
  // or onboard a PM for the market.
  const pm = await pickAvailablePm(job.country);
  if (!pm) {
    logger.warn({ jobId: String(jobId), country: job.country }, 'auto-assign: no PM available in country');
    await notifyAdmins({
      type: 'pm_unavailable',
      title: 'New paid booking — needs PM',
      body: `Booking ${String(jobId).slice(-8)} (${job.country || '—'}) is paid but no PM is available in that country. Please assign manually.`,
      data: { bookingId: String(jobId), country: job.country },
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

  // Admin fan-out — country-scoped: only the booking's country_admin
  // (plus all super_admins) gets the notification.
  await notifyAdmins({
    type: 'booking_paid',
    title: 'Booking paid & PM assigned',
    body: `Booking ${String(jobId).slice(-8)} paid. Auto-assigned to ${pm.name || 'PM'}.`,
    data: { bookingId: String(jobId), pmId: String(pm._id), country: job.country },
    country: job.country,
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
