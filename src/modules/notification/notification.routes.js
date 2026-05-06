import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { roleGuard } from '../../middleware/role.middleware.js';
import * as svc from './notification.service.js';

const r = Router();

r.get('/', roleGuard(['user', 'pm', 'admin', 'resource']), asyncHandler(async (req, res) => {
  const result = await svc.listForUser(req.user.id, {
    page: Number(req.query.page) || 1,
    pageSize: Number(req.query.pageSize) || 20,
  });
  res.json({ success: true, data: result.items, meta: result.meta });
}));

r.post('/:id/read', roleGuard(['user', 'pm', 'admin', 'resource']), asyncHandler(async (req, res) => {
  await svc.markRead(req.user.id, req.params.id);
  res.json({ success: true });
}));

r.post('/mark-all-read', roleGuard(['user', 'pm', 'admin', 'resource']), asyncHandler(async (req, res) => {
  await svc.markAllRead(req.user.id);
  res.json({ success: true });
}));

export default r;
