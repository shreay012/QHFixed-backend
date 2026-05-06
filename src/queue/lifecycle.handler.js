import { ObjectId } from 'mongodb';
import { getDb } from '../config/db.js';
import { logger } from '../config/logger.js';
import { emitTo } from '../socket/index.js';
import { QUEUES, enqueueJob, getQueue } from './index.js';
import { enqueueNotification } from './notification.handler.js';

/**
 * Lifecycle Queue Handler
 * 
 * Processes booking lifecycle transitions:
 * - Transitions scheduled bookings to in_progress when time starts
 * - Transitions in_progress to completed when time ends
 * - Sends pre-end reminders (30 min before end)
 * 
 * Design: Instead of in-process ticker, use a scheduled recurring job.
 * This allows horizontal scaling across multiple nodes.
 */

const TICK_MS = 60 * 1000; // 60 seconds

/**
 * Compute the actual start/end Date for a job
 * (copied from lifecycle.worker.js for consistency)
 */
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

/**
 * Single job handler: run the lifecycle tick
 * Handles one tick of the lifecycle state machine
 */
export async function handleLifecycleTick(job) {
  const now = new Date();
  const jobs = getDb().collection('jobs');
  const histories = getDb().collection('booking_histories');

  let processed = 0;
  let errors = 0;

  // Pull candidates sorted by soonest end time so jobs near their deadline are
  // always processed even when there are >500 active bookings.
  const candidates = await jobs.find({
    status: { $in: ['paid', 'scheduled', 'confirmed', 'assigned_to_pm', 'in_progress', 'paused'] },
  }).sort({ 'schedule.endTime': 1, endTime: 1 }).limit(500).toArray();

  for (const booking of candidates) {
    try {
      const win = resolveWindow(booking);
      if (!win) continue;

      // 30-minute pre-end reminder
      const minsToEnd = (win.end - now) / 60000;
      if (
        booking.status === 'in_progress'
        && minsToEnd > 0 && minsToEnd <= 30
        && !booking.endReminderSentAt
      ) {
        try {
          await jobs.updateOne(
            { _id: booking._id },
            { $set: { endReminderSentAt: now } },
          );
          const userId = booking.userId ? String(booking.userId) : null;
          const pmId = booking.pmId ? String(booking.pmId) : null;
          const minsLeft = Math.max(1, Math.round(minsToEnd));

          if (userId) {
            await enqueueNotification({
              userId,
              type: 'BOOKING_END_REMINDER',
              title: 'Booking ending soon',
              body: `Your booking ends in ~${minsLeft} min. Want to extend?`,
              data: { bookingId: String(booking._id), action: 'extend', minutesLeft: minsLeft },
            }).catch(() => {});
            emitTo(`user_${userId}`, 'booking:end-reminder', {
              bookingId: String(booking._id), minutesLeft: minsLeft,
            });
          }
          if (pmId) {
            await enqueueNotification({
              userId: pmId,
              type: 'BOOKING_END_REMINDER',
              title: 'Booking ending soon',
              body: `Booking ${String(booking._id).slice(-8)} ends in ~${minsLeft} min.`,
              data: { bookingId: String(booking._id), minutesLeft: minsLeft },
            }).catch(() => {});
          }
          logger.debug({ bookingId: String(booking._id), minsLeft }, 'end-reminder enqueued');
        } catch (e) {
          logger.warn({ err: e, bookingId: String(booking._id) }, 'end-reminder failed');
          errors++;
        }
      }

      // Status transitions
      // NOTE: Only PM can start a booking (sets status=in_progress + startedAt).
      // The lifecycle tick must NOT auto-transition pre-start statuses to
      // in_progress on its own — doing so produced "ghost" countdowns where the
      // workspace timer started ticking before the PM actually began work.
      // We only auto-complete an in_progress booking once its actual work
      // deadline (startedAt + durationMs) has passed.
      let nextStatus = null;
      if (booking.status === 'in_progress' && booking.startedAt) {
        const startedAtMs = new Date(booking.startedAt).getTime();
        const durMs = (Number(booking.durationTime)
          || Number(booking.services?.[0]?.durationTime)
          || 0) * 3600_000;
        if (durMs > 0 && now.getTime() >= startedAtMs + durMs) {
          nextStatus = 'completed';
        }
      }

      if (!nextStatus) continue;

      try {
        const result = await jobs.updateOne(
          { _id: booking._id, status: booking.status },
          { $set: { status: nextStatus, updatedAt: now } },
        );

        if (result.modifiedCount === 0) {
          logger.debug({ bookingId: String(booking._id) }, 'booking already transitioned');
          continue;
        }

        await histories.insertOne({
          bookingId: booking._id,
          serviceId: booking.serviceId || booking.services?.[0]?.serviceId || null,
          fromStatus: booking.status,
          toStatus: nextStatus,
          actor: { id: 'system', role: 'system' },
          note: 'lifecycle queue worker',
          at: now,
        });

        const userId = String(booking.userId);
        emitTo(`user_${userId}`, 'booking:status', {
          bookingId: String(booking._id),
          status: nextStatus,
          updatedAt: now,
        });

        await enqueueNotification({
          userId,
          type: `BOOKING_${nextStatus.toUpperCase()}`,
          title: 'Booking update',
          body: nextStatus === 'in_progress'
            ? 'Your booking has started.'
            : 'Your booking is complete.',
          data: { bookingId: String(booking._id) },
        }).catch(() => {});

        logger.debug(
          { bookingId: String(booking._id), from: booking.status, to: nextStatus },
          'lifecycle transition',
        );
        processed++;
      } catch (e) {
        logger.error(
          { err: e, bookingId: String(booking._id) },
          'lifecycle transition failed',
        );
        errors++;
      }
    } catch (e) {
      logger.error({ err: e }, 'lifecycle candidate processing failed');
      errors++;
    }
  }

  logger.info(
    { processed, errors, candidates: candidates.length },
    'lifecycle tick completed',
  );

  return { processed, errors, candidates: candidates.length };
}

/**
 * Schedule recurring lifecycle tick
 * Call once at app startup
 * 
 * In BullMQ, we use a repeating job instead of setInterval.
 * This allows the job to be processed across multiple workers
 * on different nodes, with proper locking via Redis.
 */
export async function scheduleLifecycleTick() {
  try {
    const queue = getQueue(QUEUES.LIFECYCLE);

    // Check if already scheduled
    const existing = await queue.getRepeatableJobs();
    const isScheduled = existing.some(job => job.key === 'lifecycle_tick');
    
    if (isScheduled) {
      logger.debug('lifecycle tick already scheduled');
      return;
    }

    // Add new repeating job: runs every TICK_MS
    const job = await queue.add(
      'tick',
      { type: 'lifecycle_tick' },
      {
        repeat: {
          every: TICK_MS,
          key: 'lifecycle_tick',
        },
        removeOnComplete: false,
        removeOnFail: false,
      },
    );

    logger.info({ intervalMs: TICK_MS, jobId: job.id }, 'lifecycle tick scheduled');
  } catch (err) {
    logger.error({ err }, 'failed to schedule lifecycle tick');
    throw err;
  }
}

/**
 * Get lifecycle queue stats
 */
export async function getLifecycleStats() {
  const queue = getQueue(QUEUES.LIFECYCLE);
  const counts = await queue.getJobCounts(
    'wait',
    'active',
    'completed',
    'failed',
    'delayed',
  );
  const repeating = await queue.getRepeatableJobs();
  return {
    ...counts,
    repeatingJobs: repeating.length,
  };
}
