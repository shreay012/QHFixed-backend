import { ObjectId } from 'mongodb';
import { getDb } from '../../config/db.js';

// Two fixed slots per day (IST). Length is informational; capacity is per-slot.
export const FIXED_SLOTS = [
  { startTime: '09:00', endTime: '13:00', label: '9:00 AM – 1:00 PM' },
  { startTime: '14:00', endTime: '18:00', label: '2:00 PM – 6:00 PM' },
];

export const SCHEDULING_DAYS = 7;       // today + next 6
export const DEFAULT_SLOT_CAPACITY = 5; // resources per slot
export const MIN_LEAD_MINUTES = 60;     // same-day slot must have ≥ 1 hour remaining
export const INSTANT_LEAD_MINUTES = 10; // instant = next 10 min

const cfgCol = () => getDb().collection('system_config');
const bookingsCol = () => getDb().collection('bookings');
const jobsCol = () => getDb().collection('jobs');

export async function getSchedulingConfig() {
  const doc = await cfgCol().findOne({ key: 'scheduling' });
  return {
    slotCapacity: Number(doc?.slotCapacity) > 0 ? Number(doc.slotCapacity) : DEFAULT_SLOT_CAPACITY,
    holidays: Array.isArray(doc?.holidays) ? doc.holidays : [],
  };
}

export async function setSchedulingConfig({ slotCapacity, holidays }) {
  const update = { updatedAt: new Date() };
  if (Number(slotCapacity) > 0) update.slotCapacity = Number(slotCapacity);
  if (Array.isArray(holidays)) update.holidays = holidays.filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s)));
  await cfgCol().updateOne({ key: 'scheduling' }, { $setOnInsert: { key: 'scheduling' }, $set: update }, { upsert: true });
  return getSchedulingConfig();
}

const ymd = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

const dayBounds = (dateStr) => {
  const start = new Date(`${dateStr}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

// Count bookings + active jobs that occupy a given (date,slot) on a given service (or globally if no svc).
async function countOccupants({ dateStr, slot, serviceId }) {
  const { start, end } = dayBounds(dateStr);
  const slotStart = new Date(`${dateStr}T${slot.startTime}:00`);
  const slotEnd = new Date(`${dateStr}T${slot.endTime}:00`);

  const bFilter = {
    status: { $nin: ['cancelled', 'completed'] },
    startTime: { $lt: slotEnd },
    endTime: { $gt: slotStart },
  };
  if (serviceId && /^[0-9a-f]{24}$/.test(String(serviceId))) {
    bFilter.serviceId = new ObjectId(String(serviceId));
  }

  const jFilter = {
    status: { $in: ['pending', 'pending_payment', 'confirmed', 'paid', 'in_progress'] },
    bookingType: { $in: ['later', 'instant'] },
    'timeSlot.startTime': slot.startTime,
    preferredStartDate: { $gte: start, $lt: end },
  };
  if (serviceId && /^[0-9a-f]{24}$/.test(String(serviceId))) {
    jFilter.serviceId = new ObjectId(String(serviceId));
  }

  // jobs.preferredStartDate is sometimes stored as ISO string (FE sends string). Try string match too.
  const jStrFilter = { ...jFilter };
  jStrFilter.preferredStartDate = { $regex: `^${dateStr}` };

  const [b, j1, j2] = await Promise.all([
    bookingsCol().countDocuments(bFilter),
    jobsCol().countDocuments(jFilter),
    jobsCol().countDocuments(jStrFilter),
  ]);
  return b + j1 + j2;
}

export async function buildAvailability({ serviceId } = {}) {
  const { slotCapacity, holidays } = await getSchedulingConfig();
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const out = [];
  for (let i = 0; i < SCHEDULING_DAYS; i += 1) {
    const day = new Date(today);
    day.setDate(day.getDate() + i);
    const dateStr = ymd(day);
    const dow = day.getDay();
    const isWeekend = dow === 0 || dow === 6;
    const isOff = holidays.includes(dateStr);
    const isToday = i === 0;

    const timeSlots = await Promise.all(
      FIXED_SLOTS.map(async (s) => {
        const occupants = await countOccupants({ dateStr, slot: s, serviceId });
        const fullyBooked = occupants >= slotCapacity;

        // same-day: slot must have ≥ MIN_LEAD_MINUTES remaining before it starts
        let isPassed = false;
        if (isToday) {
          const slotStartDate = new Date(`${dateStr}T${s.startTime}:00`);
          const minutesUntilStart = (slotStartDate.getTime() - now.getTime()) / 60000;
          if (minutesUntilStart < MIN_LEAD_MINUTES) isPassed = true;
        }

        return {
          startTime: s.startTime,
          endTime: s.endTime,
          label: s.label,
          capacity: slotCapacity,
          booked: occupants,
          isBooked: fullyBooked || isPassed,
          isFull: fullyBooked,
          isPassed,
        };
      }),
    );

    const dayUsable = !isWeekend && !isOff;
    const hasOpenSlot = dayUsable && timeSlots.some((s) => !s.isBooked);

    out.push({
      date: day.toISOString(),
      isAvailable: hasOpenSlot,
      isWeekend,
      isOff,
      timeSlots: dayUsable ? timeSlots : timeSlots.map((s) => ({ ...s, isBooked: true })),
    });
  }

  // Instant: current time within an active slot AND that slot has remaining capacity
  let instant = { available: false, slot: null, reason: 'No active slot right now' };
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const todayStr = ymd(today);
  const activeSlot = FIXED_SLOTS.find((s) => {
    const [sh, sm] = s.startTime.split(':').map(Number);
    const [eh, em] = s.endTime.split(':').map(Number);
    const startM = sh * 60 + sm;
    const endM = eh * 60 + em;
    return currentMinutes >= startM && currentMinutes <= endM - INSTANT_LEAD_MINUTES;
  });
  const todayDow = today.getDay();
  const todayIsWeekend = todayDow === 0 || todayDow === 6;
  const todayIsOff = holidays.includes(todayStr);
  if (activeSlot && !todayIsWeekend && !todayIsOff) {
    const occupants = await countOccupants({ dateStr: todayStr, slot: activeSlot, serviceId });
    if (occupants < slotCapacity) {
      instant = {
        available: true,
        slot: { ...activeSlot, date: todayStr },
        reason: null,
      };
    } else {
      instant = { available: false, slot: null, reason: 'Current slot is fully booked' };
    }
  } else if (todayIsWeekend) {
    instant = { available: false, slot: null, reason: 'Weekend' };
  } else if (todayIsOff) {
    instant = { available: false, slot: null, reason: 'Holiday' };
  }

  return { availability: out, instant, slotCapacity };
}

// Throws an AppError-like object if the requested slot is not bookable. Returns { ok, reason }.
export async function checkSlotBookable({ serviceId, dateStr, startTime, bookingType }) {
  const slot = FIXED_SLOTS.find((s) => s.startTime === startTime);
  if (!slot) return { ok: false, reason: 'INVALID_SLOT' };

  const { slotCapacity, holidays } = await getSchedulingConfig();
  const day = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(day.getTime())) return { ok: false, reason: 'INVALID_DATE' };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastDay = new Date(today);
  lastDay.setDate(lastDay.getDate() + SCHEDULING_DAYS - 1);
  if (day < today || day > lastDay) return { ok: false, reason: 'OUT_OF_WINDOW' };

  const dow = day.getDay();
  if (dow === 0 || dow === 6) return { ok: false, reason: 'WEEKEND' };
  if (holidays.includes(dateStr)) return { ok: false, reason: 'HOLIDAY' };

  if (day.getTime() === today.getTime()) {
    const now = new Date();
    const slotStart = new Date(`${dateStr}T${startTime}:00`);
    const minutesUntilStart = (slotStart.getTime() - now.getTime()) / 60000;
    const lead = bookingType === 'instant' ? INSTANT_LEAD_MINUTES : MIN_LEAD_MINUTES;
    if (minutesUntilStart < -((slot.endTime.split(':')[0] - slot.startTime.split(':')[0]) * 60)) {
      return { ok: false, reason: 'SLOT_PASSED' };
    }
    if (bookingType !== 'instant' && minutesUntilStart < lead) {
      return { ok: false, reason: 'TOO_LATE' };
    }
  }

  const occupants = await countOccupants({ dateStr, slot, serviceId });
  if (occupants >= slotCapacity) return { ok: false, reason: 'SLOT_FULL' };

  return { ok: true, slot, slotCapacity, booked: occupants };
}
