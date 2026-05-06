/**
 * Legal Document System
 *
 * Country-specific legal documents with versioning, user acceptance tracking,
 * and mandatory re-acceptance when a material change is published.
 *
 * Collections:
 *   legal_documents   — versioned legal doc content per country/type
 *   legal_acceptances — immutable user acceptance log
 *
 * Public endpoints (no auth required — shown pre-login):
 *   GET  /legal/doc/:countryCode/:docType        — fetch current published version
 *   GET  /legal/doc/:countryCode/:docType/all    — list all versions (admin)
 *
 * Authenticated user endpoints:
 *   GET  /legal/status                — check which docs need re-acceptance
 *   POST /legal/accept                — record acceptance of a doc version
 *
 * Admin endpoints (adminGuard + PERMS.CMS_WRITE):
 *   POST /legal/admin/doc             — publish a new doc version
 *   PATCH /legal/admin/doc/:id/retire — retire (unpublish) a doc version
 *   GET  /legal/admin/acceptances     — audit log
 */
import { Router } from 'express';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { adminGuard, permGuard, roleGuard } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getDb } from '../../config/db.js';
import { AppError } from '../../utils/AppError.js';
import { toObjectId } from '../../utils/oid.js';
import { paginate, buildMeta } from '../../utils/pagination.js';
import { PERMS } from '../../config/rbac.js';
import { getCountryConfig, ACTIVE_COUNTRY_CODES } from '../../config/country.config.js';

const r = Router();

const docsCol = () => getDb().collection('legal_documents');
const acceptancesCol = () => getDb().collection('legal_acceptances');

const DOC_TYPES = ['terms-of-service', 'privacy-policy', 'refund-policy'];

/* ══════════════════════════════════════════════════════════════════
   SCHEMAS
══════════════════════════════════════════════════════════════════ */

const publishDocSchema = z.object({
  countryCode: z.enum(ACTIVE_COUNTRY_CODES),
  docType: z.enum(DOC_TYPES),
  version: z.string().regex(/^\d+\.\d+$/, 'version must be semver-style e.g. 1.0, 1.1'),
  title: z.string().min(5).max(300),
  content: z.string().min(50),           // HTML or Markdown managed in admin panel
  effectiveDate: z.string().datetime(),  // ISO 8601
  materialChange: z.boolean().default(false), // true = all users must re-accept
  changeNotes: z.string().max(1000).optional().default(''),
}).strict();

const acceptSchema = z.object({
  docType: z.enum(DOC_TYPES),
  version: z.string(),
  countryCode: z.string().length(2).toUpperCase(),
}).strict();

/* ══════════════════════════════════════════════════════════════════
   PUBLIC — GET /legal/doc/:countryCode/:docType
   Returns the current published version for a country
══════════════════════════════════════════════════════════════════ */

r.get('/doc/:countryCode/:docType', asyncHandler(async (req, res) => {
  const { countryCode, docType } = req.params;
  const code = countryCode.toUpperCase();

  if (!DOC_TYPES.includes(docType)) {
    throw new AppError('VALIDATION_ERROR', `docType must be one of: ${DOC_TYPES.join(', ')}`, 400);
  }

  const doc = await docsCol().findOne(
    { countryCode: code, docType, status: 'published' },
    { sort: { publishedAt: -1 } },
  );

  if (!doc) {
    // Fallback: check if we have an 'IN' (default) version
    const fallback = await docsCol().findOne(
      { countryCode: 'IN', docType, status: 'published' },
      { sort: { publishedAt: -1 } },
    );
    if (!fallback) throw new AppError('RESOURCE_NOT_FOUND', 'Legal document not found', 404);
    return res.json({ success: true, data: { ...fallback, fallback: true, requestedCountry: code } });
  }

  res.json({ success: true, data: doc });
}));

/* ══════════════════════════════════════════════════════════════════
   PUBLIC — GET /legal/doc/:countryCode/:docType/versions
   Lists all published versions (useful for version pickers)
══════════════════════════════════════════════════════════════════ */

r.get('/doc/:countryCode/:docType/versions', asyncHandler(async (req, res) => {
  const { countryCode, docType } = req.params;
  const code = countryCode.toUpperCase();

  if (!DOC_TYPES.includes(docType)) {
    throw new AppError('VALIDATION_ERROR', `Invalid docType`, 400);
  }

  const docs = await docsCol()
    .find({ countryCode: code, docType })
    .sort({ publishedAt: -1 })
    .project({ content: 0 }) // strip content from list — fetch by ID for full text
    .toArray();

  res.json({ success: true, data: docs });
}));

/* ══════════════════════════════════════════════════════════════════
   AUTHENTICATED — GET /legal/status
   Returns which docs the user has not yet accepted (or need re-acceptance)
══════════════════════════════════════════════════════════════════ */

r.get('/status', roleGuard(['user', 'admin', 'ops', 'finance', 'support', 'growth', 'viewer', 'super_admin']), asyncHandler(async (req, res) => {
  const { country } = req.geo || { country: 'IN' };
  const userId = new ObjectId(req.user.id);

  // Load current published docs for this country
  const currentDocs = await docsCol()
    .find({ countryCode: country, status: 'published' })
    .sort({ publishedAt: -1 })
    .toArray();

  // Deduplicate — keep newest version per docType
  const latestByType = {};
  for (const doc of currentDocs) {
    if (!latestByType[doc.docType]) latestByType[doc.docType] = doc;
  }

  // Load user's acceptances for these doc versions
  const requiredVersions = Object.values(latestByType).map((d) => ({
    docType: d.docType,
    version: d.version,
    countryCode: country,
  }));

  // Short-circuit: no published docs for this country → nothing to accept
  if (requiredVersions.length === 0) {
    return res.json({
      success: true,
      data: { country, allAccepted: true, pending: [], accepted: [] },
    });
  }

  const accepted = await acceptancesCol()
    .find({
      userId,
      // $or must never be empty — guarded by the early return above
      $or: requiredVersions.map((v) => ({
        docType: v.docType,
        version: v.version,
        countryCode: v.countryCode,
      })),
    })
    .toArray();

  const acceptedSet = new Set(accepted.map((a) => `${a.docType}:${a.version}:${a.countryCode}`));

  const pending = requiredVersions.filter(
    (v) => !acceptedSet.has(`${v.docType}:${v.version}:${v.countryCode}`),
  );

  res.json({
    success: true,
    data: {
      country,
      allAccepted: pending.length === 0,
      pending: pending.map((v) => ({ ...v, ...latestByType[v.docType] })),
      accepted: accepted.map((a) => ({
        docType: a.docType,
        version: a.version,
        acceptedAt: a.acceptedAt,
      })),
    },
  });
}));

/* ══════════════════════════════════════════════════════════════════
   AUTHENTICATED — POST /legal/accept
   Record user's acceptance of a legal doc version.
   Immutable — cannot be deleted.
══════════════════════════════════════════════════════════════════ */

r.post('/accept', roleGuard(['user', 'admin', 'ops', 'finance', 'support', 'growth', 'super_admin']), validate(acceptSchema), asyncHandler(async (req, res) => {
  const { docType, version, countryCode } = req.body;
  const userId = new ObjectId(req.user.id);
  const now = new Date();

  // Verify the doc version exists and is published
  const doc = await docsCol().findOne({ countryCode, docType, version, status: 'published' });
  if (!doc) throw new AppError('RESOURCE_NOT_FOUND', 'Legal document version not found or not published', 404);

  // Idempotent: silently succeed if already accepted
  const existing = await acceptancesCol().findOne({ userId, docType, version, countryCode });
  if (existing) {
    return res.json({ success: true, data: { alreadyAccepted: true, acceptedAt: existing.acceptedAt } });
  }

  // Record acceptance — append-only, never updated or deleted
  const record = {
    userId,
    docType,
    version,
    countryCode,
    docId: doc._id,
    acceptedAt: now,
    ip: req.ip || req.header('x-forwarded-for') || '',
    ua: req.header('user-agent') || '',
    country: req.geo?.country || countryCode,
  };

  await acceptancesCol().insertOne(record);

  res.json({ success: true, data: { accepted: true, acceptedAt: now } });
}));

/* ══════════════════════════════════════════════════════════════════
   ADMIN — POST /legal/admin/doc
   Publish a new (or updated) legal document version.
   Sets all prior published versions for same country+type to 'superseded'.
══════════════════════════════════════════════════════════════════ */

r.post('/admin/doc', adminGuard, permGuard(PERMS.CMS_WRITE), validate(publishDocSchema), asyncHandler(async (req, res) => {
  const { countryCode, docType, version, title, content, effectiveDate, materialChange, changeNotes } = req.body;
  const now = new Date();

  // Check version is not a duplicate
  const existing = await docsCol().findOne({ countryCode, docType, version });
  if (existing) throw new AppError('CONFLICT', `Version ${version} already exists for ${countryCode}/${docType}`, 409);

  // Supersede all prior published versions
  await docsCol().updateMany(
    { countryCode, docType, status: 'published' },
    { $set: { status: 'superseded', supersededAt: now } },
  );

  // Publish new version
  const doc = {
    countryCode,
    docType,
    version,
    title,
    content,
    effectiveDate: new Date(effectiveDate),
    materialChange,
    changeNotes,
    status: 'published',
    publishedBy: req.user.id,
    publishedAt: now,
    createdAt: now,
  };

  const result = await docsCol().insertOne(doc);

  res.status(201).json({ success: true, data: { ...doc, _id: result.insertedId } });
}));

/* ══════════════════════════════════════════════════════════════════
   ADMIN — PATCH /legal/admin/doc/:id/retire
   Manually retire (unpublish) a specific document version.
══════════════════════════════════════════════════════════════════ */

r.patch('/admin/doc/:id/retire', adminGuard, permGuard(PERMS.CMS_WRITE), asyncHandler(async (req, res) => {
  const result = await docsCol().findOneAndUpdate(
    { _id: toObjectId(req.params.id, 'id') },
    { $set: { status: 'retired', retiredAt: new Date(), retiredBy: req.user.id } },
    { returnDocument: 'after' },
  );
  const doc = result.value || result;
  if (!doc) throw new AppError('RESOURCE_NOT_FOUND', 'Document not found', 404);
  res.json({ success: true, data: doc });
}));

/* ══════════════════════════════════════════════════════════════════
   ADMIN — GET /legal/admin/acceptances
   Audit log of all user acceptances
══════════════════════════════════════════════════════════════════ */

r.get('/admin/acceptances', adminGuard, permGuard(PERMS.AUDIT_READ), asyncHandler(async (req, res) => {
  const p = paginate(req.query);
  const filter = {};
  if (req.query.docType) filter.docType = req.query.docType;
  if (req.query.countryCode) filter.countryCode = req.query.countryCode.toUpperCase();
  if (req.query.userId) {
    try { filter.userId = new ObjectId(req.query.userId); } catch { /* ignore invalid */ }
  }

  const [items, total] = await Promise.all([
    acceptancesCol().find(filter).sort({ acceptedAt: -1 }).skip(p.skip).limit(p.limit).toArray(),
    acceptancesCol().countDocuments(filter),
  ]);

  res.json({ success: true, data: items, meta: buildMeta({ page: p.page, pageSize: p.pageSize, total }) });
}));

/* ══════════════════════════════════════════════════════════════════
   ADMIN — GET /legal/admin/docs
   List all document versions (with filters)
══════════════════════════════════════════════════════════════════ */

r.get('/admin/docs', adminGuard, permGuard(PERMS.CMS_READ), asyncHandler(async (req, res) => {
  const p = paginate(req.query);
  const filter = {};
  if (req.query.countryCode) filter.countryCode = req.query.countryCode.toUpperCase();
  if (req.query.docType) filter.docType = req.query.docType;
  if (req.query.status) filter.status = req.query.status;

  const [items, total] = await Promise.all([
    docsCol().find(filter).sort({ publishedAt: -1 }).skip(p.skip).limit(p.limit)
      .project({ content: 0 }) // strip full content from list
      .toArray(),
    docsCol().countDocuments(filter),
  ]);

  res.json({ success: true, data: items, meta: buildMeta({ page: p.page, pageSize: p.pageSize, total }) });
}));

export default r;
