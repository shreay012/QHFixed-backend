import { asyncHandler } from '../../utils/asyncHandler.js';
import { AppError } from '../../utils/AppError.js';
import * as svc from './booking.service.js';

export const createBooking = asyncHandler(async (req, res) => {
  const idemKey = req.header('Idempotency-Key');
  const booking = await svc.create({
    userId: req.user.id,
    payload: req.body,
    idemKey,
    actor: req.user,
  });
  res.status(201).json({ success: true, data: booking });
});

export const getBookingById = asyncHandler(async (req, res) => {
  const b = await svc.getById(req.params.id, req.user);
  if (!b) throw new AppError('RESOURCE_NOT_FOUND', 'Booking not found', 404);
  res.json({ success: true, data: b });
});

export const updateBooking = asyncHandler(async (req, res) => {
  const b = await svc.update(req.params.id, req.body, req.user);
  res.json({ success: true, data: b });
});

export const cancelBooking = asyncHandler(async (req, res) => {
  const b = await svc.cancel(req.params.id, req.body.reason, req.user);
  res.json({ success: true, data: b });
});

export const extendBooking = asyncHandler(async (req, res) => {
  const b = await svc.extend(req.params.id, req.body, req.user);
  res.json({ success: true, data: b });
});

export const listMyBookings = asyncHandler(async (req, res) => {
  const result = await svc.listForCustomer({
    userId: req.user.id,
    statuses: null,
    page: req.query.page,
    pageSize: req.query.pageSize,
  });
  res.json({ success: true, data: result.items, meta: result.meta });
});

export const listCustomerBookings = asyncHandler(async (req, res) => {
  const { servicesStatus, status, page = 1, pageSize = 10 } = req.query;
  let statuses = null;
  if (servicesStatus) statuses = String(servicesStatus).split(',').map(s => s.trim());
  else if (status) statuses = [String(status)];
  const result = await svc.listForCustomer({
    userId: req.user.id, statuses, page, pageSize,
  });
  res.json({ success: true, data: result.items, meta: result.meta });
});

export const getTimeline = asyncHandler(async (req, res) => {
  const { bookingId, serviceId } = req.query;
  if (!bookingId) throw new AppError('VALIDATION_ERROR', 'bookingId required', 422);
  const events = await svc.getTimeline(bookingId, serviceId);
  res.json({ success: true, data: events });
});
