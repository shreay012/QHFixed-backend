// Approval-flow CMS routes — /api/admin/cms-drafts.
// Mounted under the admin namespace so countryScope + auditAdmin
// already wrap every request. The service enforces the role rules
// (only super_admin approves/rejects); routes just dispatch.
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { adminGuard, permGuard } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { PERMS } from '../../config/rbac.js';
import * as svc from './cms.draft.service.js';

const r = Router();
r.use(adminGuard);

const draftSchema = z.object({
  type:    z.enum(['translations', 'services', 'tech', 'legal', 'pricing', 'banner', 'faq', 'email_template']),
  scope:   z.string().min(2).max(16).default('GLOBAL'),
  key:     z.string().min(1).max(200),
  payload: z.any(),
  status:  z.enum(['draft', 'pending']).default('draft'),
});

r.post('/', permGuard(PERMS.CMS_WRITE), validate(draftSchema), asyncHandler(async (req, res) => {
  const draft = await svc.createDraft(req, req.body);
  res.status(201).json({ success: true, data: draft });
}));

r.get('/pending', permGuard(PERMS.CMS_WRITE), asyncHandler(async (req, res) => {
  // super_admin sees everything; country_admin only their scope.
  const scope = req.user.role === 'super_admin'
    ? (req.query.scope || null)
    : (req.user.country || 'GLOBAL');
  const items = await svc.listPending(scope);
  res.json({ success: true, data: items });
}));

const reviewSchema = z.object({ note: z.string().max(1000).optional() });
r.post('/:id/approve', permGuard(PERMS.CMS_APPROVE), validate(reviewSchema), asyncHandler(async (req, res) => {
  const result = await svc.approve(req, req.params.id, req.body.note || null);
  res.json({ success: true, data: result });
}));

r.post('/:id/reject', permGuard(PERMS.CMS_APPROVE), validate(z.object({ note: z.string().min(1).max(1000) })),
  asyncHandler(async (req, res) => {
    const draft = await svc.reject(req, req.params.id, req.body.note);
    res.json({ success: true, data: draft });
  }));

// Public-ish read of a live publication. Mounted under /admin namespace
// so authenticated staff can preview; the cms.routes.js file exposes
// the unauthenticated, Redis-cached version for end users.
r.get('/live', asyncHandler(async (req, res) => {
  const { type, scope = 'GLOBAL', key } = req.query;
  if (!type || !key) {
    return res.status(422).json({ success: false, message: 'type and key are required' });
  }
  const row = await svc.getLive({ type, scope, key });
  res.json({ success: true, data: row });
}));

export default r;
