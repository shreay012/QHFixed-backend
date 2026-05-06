import { Router } from 'express';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { roleGuard } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { getDb } from '../../config/db.js';
import { paginate, buildMeta } from '../../utils/pagination.js';
import { AppError } from '../../utils/AppError.js';
import { toObjectId } from '../../utils/oid.js';
import { emitTo } from '../../socket/index.js';

const r = Router();
const tickets = () => getDb().collection('tickets');
const messages = () => getDb().collection('ticket_messages');

const createSchema = z.object({
  subject: z.string().min(2).max(200),
  description: z.string().min(2).max(5000),
  bookingId: z.string().optional(),
});

// POST /api/tickets/ticket
r.post('/ticket', roleGuard(['user']), validate(createSchema), asyncHandler(async (req, res) => {
  const now = new Date();
  const doc = {
    userId: new ObjectId(req.user.id),
    subject: req.body.subject,
    description: req.body.description,
    bookingId: req.body.bookingId ? new ObjectId(req.body.bookingId) : null,
    status: 'open',
    createdAt: now, updatedAt: now,
  };
  const r2 = await tickets().insertOne(doc);
  res.status(201).json({ success: true, data: { _id: r2.insertedId, ...doc } });
}));

// GET /api/tickets/user/all-tickets
r.get('/user/all-tickets', roleGuard(['user', 'admin']), asyncHandler(async (req, res) => {
  const p = paginate({ page: req.query.page, pageSize: req.query.limit || 100 });
  const filter = req.user.role === 'admin' ? {} : { userId: new ObjectId(req.user.id) };
  const [items, total] = await Promise.all([
    tickets().find(filter).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit).toArray(),
    tickets().countDocuments(filter),
  ]);
  res.json({ success: true, data: { tickets: items }, meta: buildMeta({ page: p.page, pageSize: p.pageSize, total }) });
}));

// GET /api/ticket-messages/:ticketId  (mounted via /ticket-messages alias)
r.get('/:ticketId', roleGuard(['user', 'admin']), asyncHandler(async (req, res) => {
  const ticket = await tickets().findOne({ _id: toObjectId(req.params.ticketId, 'ticketId') });
  if (!ticket) throw new AppError('RESOURCE_NOT_FOUND', 'Ticket not found', 404);
  if (req.user.role !== 'admin' && String(ticket.userId) !== req.user.id) {
    throw new AppError('AUTH_FORBIDDEN', 'Forbidden', 403);
  }
  const msgs = await messages()
    .find({ ticketId: new ObjectId(req.params.ticketId) })
    .sort({ createdAt: 1 }).toArray();
  res.json({ success: true, data: { ticket, messages: msgs } });
}));

// POST /api/tickets/:ticketId/message
r.post('/:ticketId/message',
  roleGuard(['user', 'admin']),
  validate(z.object({ msg: z.string().min(1).max(5000) })),
  asyncHandler(async (req, res) => {
    const ticketId = toObjectId(req.params.ticketId, 'ticketId');
    const ticket = await tickets().findOne({ _id: ticketId });
    if (!ticket) throw new AppError('RESOURCE_NOT_FOUND', 'Ticket not found', 404);

    const doc = {
      ticketId,
      senderId: new ObjectId(req.user.id),
      senderRole: req.user.role,
      msg: req.body.msg,
      createdAt: new Date(),
    };
    const r2 = await messages().insertOne(doc);
    const message = { _id: r2.insertedId, ...doc };
    emitTo(`ticket_${req.params.ticketId}`, 'message:new', message);
    res.status(201).json({ success: true, data: message });
  }),
);

export default r;
