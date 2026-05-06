/**
 * Services repository — dual-driver gateway. Read routing: PG_DRIVER_SERVICES.
 * Mirror Mongo doc shape exactly so existing service.routes.js consumers
 * (projectForCountry, geo-pricing overlay, etc.) work unchanged.
 */

import { eq, asc, desc, ne, and } from 'drizzle-orm';
import { ObjectId } from 'mongodb';
import { getDb as getMongo } from '../../config/db.js';
import { getPg } from '../../db/postgres.js';
import { services as servicesTable } from '../../db/schema.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

const TABLE = 'services';
const mongoCol = () => getMongo().collection(TABLE);
const readsFromPg = () => env.PG_DRIVER_SERVICES === 'postgres' && !!getPg();
const dualWritesEnabled = () => String(env.PG_DUAL_WRITE || '').split(',').map((s) => s.trim()).includes(TABLE) && !!getPg();

// Postgres row -> Mongo-shaped doc. Existing route handlers expect Mongo
// field names (camelCase, _id as ObjectId-or-string). Convert here once.
function fromPgRow(row) {
  if (!row) return null;
  return {
    _id:           row._id,                 // CHAR(24) — same hex string
    slug:          row.slug,
    name:          row.name,
    tagline:       row.tagline || undefined,
    description:   row.description || undefined,
    category:      row.category || undefined,
    categoryName:  row.categoryName || undefined,
    technologies:  row.technologies || [],
    pricing:       row.pricing || undefined,
    highlights:    row.highlights || [],
    inclusions:    row.inclusions || [],
    notIncluded:   row.notIncluded || [],
    faq:           row.faq || [],
    hourlyRate:    row.hourlyRate ?? undefined,
    currency:      row.currency || undefined,
    minHours:      row.minHours ?? undefined,
    maxHours:      row.maxHours ?? undefined,
    image:         row.image || undefined,
    iconUrl:       row.iconUrl || undefined,
    sortOrder:     row.sortOrder,
    active:        row.active,
    createdAt:     row.createdAt,
    updatedAt:     row.updatedAt,
  };
}

// ── Reads ──────────────────────────────────────────────────────────

export async function listActive() {
  if (readsFromPg()) {
    const rows = await getPg()
      .select().from(servicesTable)
      .where(ne(servicesTable.active, false))
      .orderBy(asc(servicesTable.sortOrder), desc(servicesTable.createdAt));
    return rows.map(fromPgRow);
  }
  return await mongoCol().find({ active: { $ne: false } }).sort({ sortOrder: 1, createdAt: -1 }).toArray();
}

export async function findBySlug(slug) {
  if (readsFromPg()) {
    const rows = await getPg().select().from(servicesTable).where(eq(servicesTable.slug, slug)).limit(1);
    return fromPgRow(rows[0]);
  }
  return await mongoCol().findOne({ slug });
}

export async function findById(idLike) {
  const idStr = String(idLike);
  if (readsFromPg()) {
    const rows = await getPg().select().from(servicesTable).where(eq(servicesTable._id, idStr)).limit(1);
    return fromPgRow(rows[0]);
  }
  if (!/^[0-9a-fA-F]{24}$/.test(idStr)) return null;
  return await mongoCol().findOne({ _id: new ObjectId(idStr) });
}

// ── Writes (always Mongo + optional Postgres dual-write) ──────────

export async function insertOne(doc) {
  const r = await mongoCol().insertOne({ ...doc, createdAt: doc.createdAt || new Date(), updatedAt: new Date() });
  const inserted = { ...doc, _id: r.insertedId };

  if (dualWritesEnabled()) {
    getPg()
      .insert(servicesTable)
      .values(toPgRow(inserted))
      .onConflictDoUpdate({ target: servicesTable._id, set: toPgUpdateSet(inserted) })
      .catch((err) => logger.error({ err: err.message, table: TABLE }, 'pg dual-write failed'));
  }
  return inserted;
}

export async function updateById(idLike, $set) {
  const id = typeof idLike === 'string' ? new ObjectId(idLike) : idLike;
  const result = await mongoCol().findOneAndUpdate(
    { _id: id },
    { $set: { ...$set, updatedAt: new Date() } },
    { returnDocument: 'after' },
  );
  const doc = result.value || result;

  if (dualWritesEnabled() && doc) {
    getPg()
      .insert(servicesTable)
      .values(toPgRow(doc))
      .onConflictDoUpdate({ target: servicesTable._id, set: toPgUpdateSet(doc) })
      .catch((err) => logger.error({ err: err.message, table: TABLE }, 'pg dual-write failed'));
  }
  return doc;
}

// ── Mongo doc → Postgres row ───────────────────────────────────────
function toPgRow(doc) {
  return {
    _id:           String(doc._id),
    slug:          doc.slug,
    name:          doc.name,
    tagline:       doc.tagline || null,
    description:   doc.description || null,
    category:      doc.category || null,
    categoryName:  doc.categoryName || null,
    technologies:  doc.technologies || null,
    pricing:       doc.pricing || null,
    highlights:    doc.highlights || null,
    inclusions:    doc.inclusions || null,
    notIncluded:   doc.notIncluded || null,
    faq:           doc.faq || null,
    hourlyRate:    doc.hourlyRate ?? null,
    currency:      doc.currency || null,
    minHours:      doc.minHours ?? null,
    maxHours:      doc.maxHours ?? null,
    image:         doc.image || null,
    iconUrl:       doc.iconUrl || null,
    sortOrder:     doc.sortOrder ?? 999,
    active:        doc.active !== false,
    createdAt:     doc.createdAt || new Date(),
    updatedAt:     doc.updatedAt || new Date(),
  };
}
function toPgUpdateSet(doc) {
  const row = toPgRow(doc);
  delete row._id;
  delete row.createdAt;
  return row;
}
