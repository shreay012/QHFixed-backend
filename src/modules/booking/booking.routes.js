import { Router } from 'express';
import { roleGuard } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import {
  createBookingSchema, updateBookingSchema, cancelSchema, extendSchema,
} from './booking.validators.js';
import * as ctrl from './booking.controller.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getDb } from '../../config/db.js';
import { ObjectId } from 'mongodb';

const r = Router();

// Customer-specific list endpoint (mounted both at /bookings and /customer/bookings)
r.get('/', roleGuard(['user', 'pm', 'admin']), ctrl.listCustomerBookings);

// Booking history alias mount: /api/bookingHistories/getBookingHistory
r.get('/getBookingHistory', roleGuard(['user', 'pm', 'admin']), ctrl.getTimeline);

// Slot availability — 7-day window, 2 fixed slots/day (09–13, 14–18), capacity-driven.
// Returns FE-expected shape: { availability: [{date,isAvailable,isOff,isWeekend,timeSlots:[…]}], instant:{…} }
import { buildAvailability } from '../availability/availability.service.js';

r.get('/availability', roleGuard(['user', 'pm', 'admin']), asyncHandler(async (req, res) => {
  const data = await buildAvailability({ serviceId: req.query.serviceId });
  res.json({ success: true, data });
}));

// Alt endpoint kept for FE compat (B8 in docs)
r.get('/available-slots', roleGuard(['user', 'pm', 'admin']), asyncHandler(async (req, res) => {
  const data = await buildAvailability({ serviceId: req.query.serviceId });
  res.json({ success: true, data });
}));

r.post('/', roleGuard(['user']), validate(createBookingSchema), ctrl.createBooking);
r.get('/history', roleGuard(['user']), ctrl.listMyBookings);
r.get('/:id', roleGuard(['user', 'pm', 'admin']), ctrl.getBookingById);
r.patch('/:id', roleGuard(['user', 'admin']), validate(updateBookingSchema), ctrl.updateBooking);
r.post('/:id/cancel', roleGuard(['user', 'admin']), validate(cancelSchema), ctrl.cancelBooking);
r.post('/:id/extend', roleGuard(['user']), validate(extendSchema), ctrl.extendBooking);

export default r;
