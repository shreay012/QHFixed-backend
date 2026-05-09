// Two-table CMS service — drafts go to cms_drafts, approved drafts copy
// into cms_publications (versioned). The serving layer reads "live"
// content from cms_publications via getLive().
//
// Approval rules (Phase 4 wires the UI; service enforces shape):
//   - country_admin can author drafts for their scope (country or
//     GLOBAL if super_admin); status defaults to 'draft' or 'pending'.
//   - super_admin is the only role that can approve/reject and trigger
//     a publication. The publish() helper bumps the version monotonically.
//
// Storage: structured Postgres tables via Drizzle. Falls back to Mongo
// when Postgres isn't available (matches recordAudit() pattern).
import { ObjectId } from 'mongodb';
import { and, desc, eq, sql } from 'drizzle-orm';
import { getPg } from '../../db/postgres.js';
import { cmsDrafts, cmsPublications } from '../../db/schema.js';
import { AppError } from '../../utils/AppError.js';
import { recordAudit } from '../audit/audit.service.js';
import { logger } from '../../config/logger.js';

async function notify(userId, type, title, body, data = {}) {
  if (!userId) return;
  try {
    const { enqueueNotification } = await import('../notification/notification.service.js');
    await enqueueNotification({ userId: String(userId), type, title, body, data });
  } catch (err) {
    logger.warn({ err, userId, type }, 'cms notify failed');
  }
}

// Pulls all super_admin user ids — used to notify approvers when a
// draft hits 'pending'. Cached locally for the request lifecycle would
// be nice but the volume is low enough this is fine.
async function getSuperAdminIds(pg) {
  const { users } = await import('../../db/schema.js');
  const { eq } = await import('drizzle-orm');
  const rows = await pg.select({ id: users._id }).from(users).where(eq(users.role, 'super_admin'));
  return rows.map((r) => r.id);
}

const VALID_TYPES = new Set([
  'translations', 'services', 'tech', 'legal', 'pricing', 'banner', 'faq', 'email_template',
]);
const VALID_STATUSES = new Set(['draft', 'pending', 'approved', 'rejected']);

function ensurePg() {
  const pg = getPg();
  if (!pg) throw new AppError('CONFIG_ERROR', 'CMS draft store requires Postgres', 500);
  return pg;
}

function newId() { return new ObjectId().toHexString(); }

export async function createDraft(req, { type, scope, key, payload, status = 'draft' }) {
  if (!VALID_TYPES.has(type)) throw new AppError('VALIDATION_ERROR', `Unknown CMS type: ${type}`, 422);
  if (!VALID_STATUSES.has(status) || status === 'approved' || status === 'rejected') {
    throw new AppError('VALIDATION_ERROR', 'Author can only set status draft|pending', 422);
  }
  const pg = ensurePg();
  const row = {
    _id:        newId(),
    type, scope: String(scope || 'GLOBAL').toUpperCase(), key,
    payload, status,
    authorId:   req.user.id,
    authorRole: req.user.role,
    createdAt:  new Date(),
    updatedAt:  new Date(),
  };
  await pg.insert(cmsDrafts).values(row);
  recordAudit(req, {
    action: status === 'pending' ? 'CMS_DRAFT_SUBMITTED' : 'CMS_DRAFT_SAVED',
    resourceType: 'cms_draft', resourceId: row._id, country: row.scope,
    after: { type, scope: row.scope, key, status },
  });
  // Fan out a notification to every super_admin when an editor submits
  // for approval. Save-as-draft is silent (the editor is still working).
  if (status === 'pending') {
    const ids = await getSuperAdminIds(pg).catch(() => []);
    await Promise.all(ids.map((uid) => notify(
      uid, 'cms_draft_submitted',
      'CMS draft awaiting review',
      `${type} / ${row.scope} / ${key} — submitted by ${req.user.role}.`,
      { draftId: row._id, type, scope: row.scope, key },
    )));
  }
  return row;
}

export async function listPending(scope) {
  const pg = ensurePg();
  const where = scope && scope !== 'GLOBAL'
    ? and(eq(cmsDrafts.status, 'pending'), eq(cmsDrafts.scope, String(scope).toUpperCase()))
    : eq(cmsDrafts.status, 'pending');
  return pg.select().from(cmsDrafts).where(where).orderBy(desc(cmsDrafts.createdAt));
}

export async function approve(req, draftId, note = null) {
  if (req.user.role !== 'super_admin') {
    throw new AppError('FORBIDDEN', 'Only super_admin can approve CMS drafts', 403);
  }
  const pg = ensurePg();
  const [draft] = await pg.select().from(cmsDrafts).where(eq(cmsDrafts._id, draftId));
  if (!draft) throw new AppError('RESOURCE_NOT_FOUND', 'Draft not found', 404);
  if (draft.status !== 'pending') {
    throw new AppError('VALIDATION_ERROR', `Cannot approve draft in status ${draft.status}`, 409);
  }
  // Compute next version. Take max(version)+1 for (type,scope,key);
  // start at 1 if no prior publication exists.
  const [{ maxV } = { maxV: 0 }] = await pg.execute(sql`
    SELECT COALESCE(MAX(version), 0) AS "maxV"
    FROM cms_publications
    WHERE type = ${draft.type} AND scope = ${draft.scope} AND key = ${draft.key}
  `);
  const nextVersion = Number(maxV || 0) + 1;
  const pub = {
    _id: newId(),
    type: draft.type, scope: draft.scope, key: draft.key,
    version: nextVersion,
    payload: draft.payload,
    publishedBy: req.user.id,
    publishedAt: new Date(),
    draftId: draft._id,
  };
  await pg.transaction(async (tx) => {
    await tx.insert(cmsPublications).values(pub);
    await tx.update(cmsDrafts).set({
      status: 'approved', reviewerId: req.user.id, reviewNote: note,
      reviewedAt: new Date(), updatedAt: new Date(),
    }).where(eq(cmsDrafts._id, draftId));
  });
  recordAudit(req, {
    action: 'CMS_DRAFT_APPROVED', resourceType: 'cms_draft',
    resourceId: draft._id, country: draft.scope,
    before: { status: 'pending' },
    after:  { status: 'approved', publicationVersion: nextVersion },
  });
  notify(draft.authorId, 'cms_draft_approved',
    'Your CMS draft was approved',
    `${draft.type} / ${draft.scope} / ${draft.key} is now live as v${nextVersion}.`,
    { draftId: draft._id, version: nextVersion });
  return { draft: { ...draft, status: 'approved' }, publication: pub };
}

export async function reject(req, draftId, note) {
  if (req.user.role !== 'super_admin') {
    throw new AppError('FORBIDDEN', 'Only super_admin can reject CMS drafts', 403);
  }
  if (!note) throw new AppError('VALIDATION_ERROR', 'review_note required on reject', 422);
  const pg = ensurePg();
  const [draft] = await pg.select().from(cmsDrafts).where(eq(cmsDrafts._id, draftId));
  if (!draft) throw new AppError('RESOURCE_NOT_FOUND', 'Draft not found', 404);
  if (draft.status !== 'pending') {
    throw new AppError('VALIDATION_ERROR', `Cannot reject draft in status ${draft.status}`, 409);
  }
  await pg.update(cmsDrafts).set({
    status: 'rejected', reviewerId: req.user.id, reviewNote: note,
    reviewedAt: new Date(), updatedAt: new Date(),
  }).where(eq(cmsDrafts._id, draftId));
  recordAudit(req, {
    action: 'CMS_DRAFT_REJECTED', resourceType: 'cms_draft',
    resourceId: draft._id, country: draft.scope,
    before: { status: 'pending' }, after: { status: 'rejected' },
  });
  notify(draft.authorId, 'cms_draft_rejected',
    'Your CMS draft was rejected',
    `${draft.type} / ${draft.scope} / ${draft.key} — ${note}`,
    { draftId: draft._id, note });
  return { ...draft, status: 'rejected' };
}

// Read the live (latest version) publication for a (type,scope,key).
// Returns null if nothing has been published yet — caller can fall
// back to defaults / cms.defaults.js.
export async function getLive({ type, scope, key }) {
  const pg = ensurePg();
  const [row] = await pg.select().from(cmsPublications).where(and(
    eq(cmsPublications.type, type),
    eq(cmsPublications.scope, String(scope || 'GLOBAL').toUpperCase()),
    eq(cmsPublications.key, key),
  )).orderBy(desc(cmsPublications.version)).limit(1);
  return row || null;
}
