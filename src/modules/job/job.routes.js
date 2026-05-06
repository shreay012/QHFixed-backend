import { Router } from 'express';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { roleGuard } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { getDb } from '../../config/db.js';
import { AppError } from '../../utils/AppError.js';
import { toObjectId } from '../../utils/oid.js';
import { idempotencyGetOrSet, acquireLock, releaseLock } from '../../utils/idempotency.js';
import { checkSlotBookable } from '../availability/availability.service.js';
import { COUNTRIES, LOCALE_TO_COUNTRY } from '../service/service.model.js';
import { getCountryConfig } from '../../config/country.config.js';

// COUNTRY_TAX_V1: every booking-pricing path used to multiply by 0.18 (IN
// GST) regardless of the customer's country. Look up the country's actual
// tax rule (gst/vat/none) and return a structured pricing breakdown.
function computeTax(subtotal, country) {
  const cfg = getCountryConfig(country);
  const taxCfg = cfg?.tax || { type: 'none', rate: 0, name: '', inclusive: false };
  const rate = Number(taxCfg.rate) || 0;
  const taxAmount = +(subtotal * rate).toFixed(2);
  return {
    rate,
    taxAmount,
    taxName: taxCfg.name || '',
    taxType: taxCfg.type || 'none',
    inclusive: taxCfg.inclusive === true,
  };
}

const r = Router();
const jobsCol = () => getDb().collection('jobs');
const servicesCol = () => getDb().collection('services');

// Resolve user's country from request (cookie/header/locale → IN fallback).
function resolveCountry(req) {
  const fromHeader = String(req.headers['cf-ipcountry'] || req.headers['x-country'] || '').toUpperCase();
  if (COUNTRIES.includes(fromHeader)) return fromHeader;
  const fromCookie = String(req.cookies?.qh_country || '').toUpperCase();
  if (COUNTRIES.includes(fromCookie)) return fromCookie;
  const locale = String(req.cookies?.qh_locale || '').split('-')[0];
  if (LOCALE_TO_COUNTRY[locale]) return LOCALE_TO_COUNTRY[locale];
  return 'IN';
}

// Hourly + currency resolver that handles ALL service shapes:
//   - new multi-country: pricing[] (find country block → basePrice/currency)
//   - legacy flat object: pricing.hourly + pricing.currency
//   - oldest:            hourlyRate + currency
function resolveServicePrice(svc, country) {
  if (Array.isArray(svc?.pricing)) {
    const block =
      svc.pricing.find((p) => p.country === country && p.active !== false) ||
      svc.pricing.find((p) => p.country === 'IN') ||
      svc.pricing[0];
    if (block) {
      return {
        hourly: Number(block.basePrice) || 0,
        currency: block.currency || 'INR',
        country: block.country,
      };
    }
  }
  return {
    hourly: Number(svc?.pricing?.hourly ?? svc?.hourlyRate) || 0,
    currency: svc?.pricing?.currency || svc?.currency || 'INR',
    country: null,
  };
}

// Coerce an i18n-object name/title to a flat string for storage on jobs/bookings.
function flatTitle(svc) {
  const v = svc?.name ?? svc?.title;
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    return v.en || Object.values(v)[0] || 'Booking';
  }
  return v || 'Booking';
}

// Accepts BOTH legacy flat shape and v3 FE shape:
//   legacy: { serviceId, duration, startTime? }
//   v3:     { services: [{ serviceId, durationTime, technologyIds, selectedDays, ... }] }
const pricingSchema = z.union([
  z.object({
    serviceId: z.string().regex(/^[0-9a-f]{24}$/),
    duration: z.number().int().min(1),
    startTime: z.string().datetime().optional(),
  }),
  z.object({
    services: z
      .array(
        z.object({
          serviceId: z.string().regex(/^[0-9a-f]{24}$/),
          durationTime: z.coerce.number().int().min(1).default(8),
          technologyIds: z.array(z.any()).optional(),
          selectedDays: z.coerce.number().int().min(1).optional().default(1),
        }).passthrough(),
      )
      .min(1),
  }),
]);

const createJobSchema = z.object({
  bookingId: z.string().regex(/^[0-9a-f]{24}$/),
  title: z.string().min(2),
  description: z.string().optional(),
  serviceId: z.string().regex(/^[0-9a-f]{24}$/),
  pricing: z.object({
    subtotal: z.number(),
    tax: z.number(),
    total: z.number(),
    currency: z.string().default('INR'),
  }).optional(),
});

r.post('/pricing', validate(pricingSchema), asyncHandler(async (req, res) => {
  // Normalize: pull serviceId, duration, days from either shape
  let serviceIdStr;
  let duration;
  let selectedDays = 1;
  let services = null;
  if (Array.isArray(req.body?.services)) {
    services = req.body.services;
    const s0 = services[0];
    serviceIdStr = s0.serviceId;
    duration = Number(s0.durationTime) || 8;
    selectedDays = Number(s0.selectedDays) || 1;
  } else {
    serviceIdStr = req.body.serviceId;
    duration = Number(req.body.duration);
  }
  const svc = await servicesCol().findOne({ _id: toObjectId(serviceIdStr) });
  if (!svc) throw new AppError('RESOURCE_NOT_FOUND', 'Service not found', 404);
  const country = resolveCountry(req);
  let { hourly, currency } = resolveServicePrice(svc, country);

  // Overlay geo_pricing so the rate matches what the admin set per-country.
  try {
    const geo = await getDb().collection('geo_pricing').findOne(
      { serviceId: svc._id, country },
      { projection: { basePrice: 1, currency: 1 } },
    );
    if (geo?.basePrice > 0) {
      hourly   = Number(geo.basePrice);
      currency = geo.currency || currency;
    }
  } catch { /* non-fatal */ }

  const subtotal = +(hourly * duration * selectedDays).toFixed(2);
  const taxInfo = computeTax(subtotal, country);
  const tax = taxInfo.taxAmount;
  const total = +(subtotal + tax).toFixed(2);
  res.json({
    success: true,
    data: {
      hourly,
      duration,
      selectedDays,
      subtotal,
      tax,
      total,
      currency,
      country,
      // Country-aware tax metadata so the frontend can render the right
      // label (GST 18% / VAT 5% / MwSt. 19%) and skip the line entirely
      // when the country has no platform-level tax (e.g. US).
      taxRate: taxInfo.rate,
      taxName: taxInfo.taxName,
      taxType: taxInfo.taxType,
      taxInclusive: taxInfo.inclusive,
      pricing: { hourly, subtotal, tax, total, currency, taxRate: taxInfo.rate, taxName: taxInfo.taxName, taxType: taxInfo.taxType },
      services: services || undefined,
    },
  });
}));

r.post('/', roleGuard(['user', 'admin']), asyncHandler(async (req, res) => {
  const now = new Date();
  const idemKey = req.header('Idempotency-Key');
  if (idemKey) {
    const cached = await idempotencyGetOrSet(`job:${req.user.id}:${idemKey}`);
    if (cached) return res.status(200).json({ success: true, data: cached, idempotent: true });
  }

  // v3 frontend shape: { services: [{ serviceId, technologyIds, selectedDays, requirements,
  // preferredStartDate, preferredEndDate, durationTime, startTime, endTime, timeSlot, bookingType }] }
  if (Array.isArray(req.body?.services) && req.body.services.length > 0) {
    const s0 = req.body.services[0];
    if (!s0.serviceId || !/^[0-9a-f]{24}$/.test(String(s0.serviceId))) {
      throw new AppError('VALIDATION_ERROR', 'serviceId required', 422);
    }
    const svc = await servicesCol().findOne({ _id: toObjectId(s0.serviceId) });
    if (!svc) throw new AppError('RESOURCE_NOT_FOUND', 'Service not found', 404);

    // Slot validation: 7-day window, 2 fixed slots, capacity, no weekend/holiday, race-safe lock.
    const startTime = s0.timeSlot?.startTime || s0.startTime || null;
    let bookingDateStr = null;
    if (s0.preferredStartDate) {
      const d = new Date(s0.preferredStartDate);
      if (!Number.isNaN(d.getTime())) {
        bookingDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
    }
    let acquiredSlotLockKey = null;
    if (startTime && bookingDateStr) {
      const lockKey = `slot:lock:${s0.serviceId}:${bookingDateStr}:${startTime}`;
      const got = await acquireLock(lockKey, 10);
      if (!got) throw new AppError('BOOKING_SLOT_TAKEN', 'Selected slot is being held by another customer, please retry', 409);
      acquiredSlotLockKey = lockKey;
      try {
        const check = await checkSlotBookable({
          serviceId: s0.serviceId,
          dateStr: bookingDateStr,
          startTime,
          bookingType: s0.bookingType || 'later',
        });
        if (!check.ok) {
          const map = {
            INVALID_SLOT: ['VALIDATION_ERROR', 'Invalid slot', 422],
            INVALID_DATE: ['VALIDATION_ERROR', 'Invalid date', 422],
            OUT_OF_WINDOW: ['VALIDATION_ERROR', 'Slot is outside the 7-day booking window', 422],
            WEEKEND: ['SLOT_UNAVAILABLE', 'Weekends are not available', 409],
            HOLIDAY: ['SLOT_UNAVAILABLE', 'Selected day is a holiday', 409],
            TOO_LATE: ['SLOT_UNAVAILABLE', 'Slot starts in less than 1 hour', 409],
            SLOT_PASSED: ['SLOT_UNAVAILABLE', 'Selected slot has already passed', 409],
            SLOT_FULL: ['BOOKING_SLOT_TAKEN', 'Selected slot is fully booked', 409],
          };
          const [code, msg, status] = map[check.reason] || ['SLOT_UNAVAILABLE', 'Slot not available', 409];
          throw new AppError(code, msg, status);
        }
      } catch (e) {
        await releaseLock(acquiredSlotLockKey).catch(() => {});
        throw e;
      }
    }

    const country = resolveCountry(req);
    let { hourly, currency } = resolveServicePrice(svc, country);
    // Overlay geo_pricing for per-country admin-set rate
    try {
      const geo = await getDb().collection('geo_pricing').findOne(
        { serviceId: svc._id, country },
        { projection: { basePrice: 1, currency: 1 } },
      );
      if (geo?.basePrice > 0) {
        hourly   = Number(geo.basePrice);
        currency = geo.currency || currency;
      }
    } catch { /* non-fatal */ }

    const duration = Number(s0.durationTime) || 8;
    const subtotal = +(hourly * duration).toFixed(2);
    const taxInfo = computeTax(subtotal, country);
    const tax = taxInfo.taxAmount;
    const total = +(subtotal + tax).toFixed(2);
    const doc = {
      userId: new ObjectId(req.user.id),
      services: req.body.services,
      serviceId: toObjectId(s0.serviceId, 'serviceId'),
      technologyIds: Array.isArray(s0.technologyIds) ? s0.technologyIds : [],
      selectedDays: s0.selectedDays || 1,
      requirements: s0.requirements || '',
      preferredStartDate: s0.preferredStartDate || null,
      preferredEndDate: s0.preferredEndDate || null,
      durationTime: duration,
      startTime: s0.startTime || null,
      endTime: s0.endTime || null,
      timeSlot: s0.timeSlot || null,
      bookingType: s0.bookingType || 'later',
      title: flatTitle(svc),
      status: 'pending',
      country,
      pricing: {
        hourly,
        subtotal,
        tax,
        total,
        currency,
        taxRate: taxInfo.rate,
        taxName: taxInfo.taxName,
        taxType: taxInfo.taxType,
        taxInclusive: taxInfo.inclusive,
      },
      logs: [],
      createdAt: now, updatedAt: now,
    };
    const r2 = await jobsCol().insertOne(doc);
    if (acquiredSlotLockKey) await releaseLock(acquiredSlotLockKey).catch(() => {});
    const out = { job: { _id: r2.insertedId, ...doc } };
    if (idemKey) await idempotencyGetOrSet(`job:${req.user.id}:${idemKey}`, out, 86400);
    return res.status(201).json({ success: true, data: out });
  }

  // legacy strict shape
  const parsed = createJobSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid job payload', 422);
  const body = parsed.data;
  const doc = {
    bookingId: toObjectId(body.bookingId, 'bookingId'),
    serviceId: toObjectId(body.serviceId, 'serviceId'),
    userId: new ObjectId(req.user.id),
    title: body.title,
    description: body.description || '',
    status: 'created',
    pricing: body.pricing || null,
    logs: [],
    createdAt: now, updatedAt: now,
  };
  const r2 = await jobsCol().insertOne(doc);
  const out = { _id: r2.insertedId, ...doc };
  if (idemKey) await idempotencyGetOrSet(`job:${req.user.id}:${idemKey}`, out, 86400);
  res.status(201).json({ success: true, data: out });
}));

r.get('/:id', roleGuard(['user', 'pm', 'admin', 'resource']), asyncHandler(async (req, res) => {
  const job = await jobsCol().findOne({ _id: toObjectId(req.params.id) });
  if (!job) throw new AppError('RESOURCE_NOT_FOUND', 'Job not found', 404);

  // Populate services[].serviceId (full service doc) and technologyIds ([{_id?, name}])
  const services = Array.isArray(job.services) ? job.services : [];
  const svcIds = services
    .map((s) => {
      try { return s?.serviceId ? new ObjectId(String(s.serviceId)) : null; } catch { return null; }
    })
    .filter(Boolean);

  const svcDocs = svcIds.length
    ? await servicesCol().find({ _id: { $in: svcIds } }).toArray()
    : [];
  const svcMap = new Map(svcDocs.map((d) => [String(d._id), d]));

  const populatedServices = services.map((s) => {
    const svc = svcMap.get(String(s.serviceId)) || null;
    const techList = Array.isArray(s.technologyIds) ? s.technologyIds : [];
    const techNames = Array.isArray(svc?.technologies) ? svc.technologies : [];
    const populatedTechs = techList.map((t) => {
      if (t && typeof t === 'object' && t.name) return t;
      const str = String(t);
      // If it matches a known technology name on the service, keep as-is
      const matchByName = techNames.find((n) => String(n).toLowerCase() === str.toLowerCase());
      if (matchByName) return { name: matchByName };
      // If it's a numeric index into service.technologies
      const idx = Number(str);
      if (!Number.isNaN(idx) && techNames[idx]) return { name: techNames[idx] };
      return { _id: str, name: str };
    });
    return {
      ...s,
      serviceId: svc || s.serviceId,
      technologyIds: populatedTechs,
    };
  });

  // Also surface a top-level populated serviceId for legacy consumers
  let topServiceId = job.serviceId;
  if (job.serviceId) {
    try {
      const top = await servicesCol().findOne({ _id: new ObjectId(String(job.serviceId)) });
      if (top) topServiceId = top;
    } catch {}
  }

  res.json({
    success: true,
    data: {
      job: { ...job, services: populatedServices, serviceId: topServiceId },
    },
  });
}));

r.put('/:id', roleGuard(['user', 'pm', 'admin', 'resource']), asyncHandler(async (req, res) => {
  const id = toObjectId(req.params.id);
  const update = { ...req.body, updatedAt: new Date() };
  const r2 = await jobsCol().findOneAndUpdate({ _id: id }, { $set: update }, { returnDocument: 'after' });
  if (!r2.value && !r2._id) throw new AppError('RESOURCE_NOT_FOUND', 'Job not found', 404);
  res.json({ success: true, data: r2.value || r2 });
}));

r.post('/:id/log', roleGuard(['pm', 'resource', 'admin']), validate(z.object({
  type: z.string(), message: z.string().max(2000),
})), asyncHandler(async (req, res) => {
  const id = toObjectId(req.params.id);
  await jobsCol().updateOne({ _id: id }, {
    $push: { logs: { by: req.user.id, role: req.user.role, ...req.body, at: new Date() } },
    $set: { updatedAt: new Date() },
  });
  res.json({ success: true });
}));

export default r;
