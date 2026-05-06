// In-process booking lifecycle ticker.
// Runs every minute; transitions confirmed/scheduled jobs into in_progress
// once their schedule has started, and into completed once it has ended.
// Idempotent: only updates jobs whose status doesn't already match.
import { ObjectId } from 'mongodb';
import { getDb } from '../config/db.js';
import { logger } from '../config/logger.js';
import { emitTo } from '../socket/index.js';
import { enqueueNotification } from '../modules/notification/notification.service.js';

const TICK_MS = 60 * 1000;
let _timer = null;

// Compute the actual start/end Date for a job that may have either:
//  - schedule:{date,start,end}
//  - services[0].{preferredStartDate, durationTime, startTime, endTime}
//  - top-level startTime/endTime (legacy)
function resolveWindow(job) {
  if (job.schedule?.date && job.schedule?.start) {
    const d = new Date(`${job.schedule.date}T${job.schedule.start}:00.000Z`);
    const e = job.schedule.end
      ? new Date(`${job.schedule.date}T${job.schedule.end}:00.000Z`)
      : new Date(d.getTime() + (job.durationTime || 1) * 3600_000);
    return { start: d, end: e };
  }
  const s0 = job.services?.[0];
  if (s0?.preferredStartDate) {
    const baseDate = new Date(s0.preferredStartDate);
    if (Number.isNaN(baseDate.getTime())) return null;
    const ymd = baseDate.toISOString().slice(0, 10);
    const startStr = s0.startTime || '09:00';
    const endStr = s0.endTime;
    const start = new Date(`${ymd}T${startStr}:00.000Z`);
    const end = endStr
      ? new Date(`${ymd}T${endStr}:00.000Z`)
      : new Date(start.getTime() + (Number(s0.durationTime) || 1) * 3600_000);
    return { start, end };
  }
  if (job.startTime && job.endTime) {
    return { start: new Date(job.startTime), end: new Date(job.endTime) };
  }
  return null;
}

async function tick() {
  const now = new Date();
  const jobs = getDb().collection('jobs');
  const histories = getDb().collection('booking_histories');

  // Pull recent candidates (cap to avoid scanning the whole collection).
  const candidates = await jobs.find({
    status: { $in: ['paid', 'scheduled', 'confirmed', 'assigned_to_pm', 'in_progress', 'paused'] },
  }).limit(500).toArray();

  for (const job of candidates) {
    const win = resolveWindow(job);
    if (!win) continue;

    // 30-minute pre-end reminder: nudge customer + PM to extend if needed.
    const minsToEnd = (win.end - now) / 60000;
    if (
      job.status === 'in_progress'
      && minsToEnd > 0 && minsToEnd <= 30
      && !job.endReminderSentAt
    ) {
      try {
        await jobs.updateOne(
          { _id: job._id },
          { $set: { endReminderSentAt: now } },
        );
        const userId = job.userId ? String(job.userId) : null;
        const pmId = job.pmId ? String(job.pmId) : null;
        const minsLeft = Math.max(1, Math.round(minsToEnd));
        if (userId) {
          await enqueueNotification({
            userId,
            type: 'BOOKING_END_REMINDER',
            title: 'Booking ending soon',
            body: `Your booking ends in ~${minsLeft} min. Want to extend?`,
            data: { bookingId: String(job._id), action: 'extend', minutesLeft: minsLeft },
          }).catch(() => {});
          emitTo(`user_${userId}`, 'booking:end-reminder', {
            bookingId: String(job._id), minutesLeft: minsLeft,
          });
        }
        if (pmId) {
          await enqueueNotification({
            userId: pmId,
            type: 'BOOKING_END_REMINDER',
            title: 'Booking ending soon',
            body: `Booking ${String(job._id).slice(-8)} ends in ~${minsLeft} min.`,
            data: { bookingId: String(job._id), minutesLeft: minsLeft },
          }).catch(() => {});
        }
        logger.info({ jobId: String(job._id), minsLeft }, 'end-reminder sent');
      } catch (e) {
        logger.warn({ err: e, jobId: String(job._id) }, 'end-reminder failed');
      }
    }

    let next = null;
    if (
      ['paid', 'scheduled', 'confirmed', 'assigned_to_pm'].includes(job.status)
      && now >= win.start && now < win.end
    ) {
      next = 'in_progress';
    } else if (job.status === 'in_progress' && now >= win.end) {
      next = 'completed';
    }
    if (!next) continue;

    try {
      await jobs.updateOne(
        { _id: job._id, status: job.status },
        { $set: { status: next, updatedAt: now } },
      );
      await histories.insertOne({
        bookingId: job._id,
        serviceId: job.serviceId || job.services?.[0]?.serviceId || null,
        fromStatus: job.status,
        toStatus: next,
        actor: { id: 'system', role: 'system' },
        note: 'lifecycle worker',
        at: now,
      });
      const userId = String(job.userId);
      emitTo(`user_${userId}`, 'booking:status', {
        bookingId: String(job._id),
        status: next,
        updatedAt: now,
      });
      await enqueueNotification({
        userId,
        type: `BOOKING_${next.toUpperCase()}`,
        title: 'Booking update',
        body: next === 'in_progress'
          ? 'Your booking has started.'
          : 'Your booking is complete.',
        data: { bookingId: String(job._id) },
      }).catch(() => {});
      logger.info({ jobId: String(job._id), from: job.status, to: next }, 'lifecycle transition');
    } catch (e) {
      logger.error({ err: e, jobId: String(job._id) }, 'lifecycle transition failed');
    }
  }
}

export function startLifecycleWorker() {
  if (_timer) return;
  _timer = setInterval(() => {
    tick().catch((e) => logger.error({ err: e }, 'lifecycle tick failed'));
  }, TICK_MS);
  // Run once shortly after boot.
  setTimeout(() => tick().catch(() => {}), 5000);
  logger.info({ everyMs: TICK_MS }, 'lifecycle worker started');
}

export function stopLifecycleWorker() {
  if (_timer) clearInterval(_timer);
  _timer = null;
}
