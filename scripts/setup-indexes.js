/**
 * MongoDB Index Setup
 * 
 * Phase 1c: Creates all critical compound indexes for production scale
 * 
 * Index strategy:
 * - Indexes follow query patterns from PRODUCTION_SCALE_PLAN
 * - Compound indexes optimize multi-field queries
 * - TTL indexes auto-delete expired docs
 * - Sparse indexes skip null values
 * 
 * Safe to run multiple times (idempotent)
 */

import { ObjectId } from 'mongodb';
import { getDb, closeDb } from '../src/config/db.js';
import { logger } from '../src/config/logger.js';

// Index definitions with properties
const INDEXES = [
  // ===== Jobs/Bookings Collection =====
  {
    collection: 'jobs',
    name: 'idx_status_country_createdAt',
    spec: { status: 1, country: 1, createdAt: -1 },
    options: { sparse: true },
    reason: 'Filter bookings by status, country, date (live-ops dashboard)',
  },
  {
    collection: 'jobs',
    name: 'idx_pmId_status',
    spec: { pmId: 1, status: 1 },
    options: { sparse: true },
    reason: 'Get bookings assigned to PM by status',
  },
  {
    collection: 'jobs',
    name: 'idx_customerId_status',
    spec: { customerId: 1, status: 1 },
    options: { sparse: true },
    reason: 'Get customer bookings by status',
  },
  {
    collection: 'jobs',
    name: 'idx_assignedResource_status',
    spec: { 'assignedResource._id': 1, status: 1 },
    options: { sparse: true },
    reason: 'Get resource bookings by status',
  },
  {
    collection: 'jobs',
    name: 'idx_status_endTime',
    spec: { status: 1, 'schedule.endTime': 1 },
    options: { sparse: true },
    reason: 'Find in_progress bookings near end time (lifecycle worker)',
  },
  {
    collection: 'jobs',
    name: 'idx_userId',
    spec: { userId: 1 },
    options: { sparse: true },
    reason: 'Legacy: customer bookings',
  },

  // ===== Chat Collection =====
  {
    collection: 'chat',
    name: 'idx_roomId_createdAt',
    spec: { roomId: 1, createdAt: -1 },
    options: { sparse: true },
    reason: 'Fetch chat messages by room, sorted by time',
  },
  {
    collection: 'chat',
    name: 'idx_bookingId_createdAt',
    spec: { bookingId: 1, createdAt: -1 },
    options: { sparse: true },
    reason: 'Fetch chat messages by booking',
  },

  // ===== Users Collection =====
  {
    collection: 'users',
    name: 'idx_mobile_country',
    spec: { mobile: 1, country: 1 },
    options: { sparse: true },
    reason: 'Verify phone number uniqueness per country',
  },
  {
    collection: 'users',
    name: 'idx_role_active',
    spec: { role: 1, active: 1 },
    options: { sparse: true },
    reason: 'Get active PMs/resources by role',
  },
  {
    collection: 'users',
    name: 'idx_email',
    spec: { email: 1 },
    options: { sparse: true, unique: true },
    reason: 'Verify email uniqueness (auth)',
  },

  // ===== Notifications Collection =====
  {
    collection: 'notifications',
    name: 'idx_userId_read_createdAt',
    spec: { userId: 1, read: 1, createdAt: -1 },
    options: { sparse: true },
    reason: 'Get unread notifications for user, newest first',
  },
  {
    collection: 'notifications',
    name: 'idx_userId_createdAt',
    spec: { userId: 1, createdAt: -1 },
    options: { sparse: true },
    reason: 'Get all notifications for user, with pagination',
  },
  {
    collection: 'notifications',
    name: 'ttl_notifications',
    spec: { createdAt: 1 },
    options: { expireAfterSeconds: 2592000 }, // 30 days
    reason: 'Auto-delete old notifications',
  },

  // ===== Promo Codes Collection (Phase 3) =====
  {
    collection: 'promo_codes',
    name: 'idx_code',
    spec: { code: 1 },
    options: { sparse: true, unique: true },
    reason: 'Look up promo code by code value',
  },
  {
    collection: 'promo_codes',
    name: 'idx_active_validFrom_validTo',
    spec: { active: 1, validFrom: 1, validTo: 1 },
    options: { sparse: true },
    reason: 'Get active promo codes for current time',
  },

  // ===== Promo Redemptions Collection (Phase 3) =====
  {
    collection: 'promo_redemptions',
    name: 'idx_codeId_userId',
    spec: { codeId: 1, userId: 1 },
    options: { sparse: true },
    reason: 'Check if user already used code (fraud prevention)',
  },
  {
    collection: 'promo_redemptions',
    name: 'idx_bookingId',
    spec: { bookingId: 1 },
    options: { sparse: true },
    reason: 'Get promo applied to booking',
  },

  // ===== Audit Logs Collection =====
  {
    collection: 'audit_logs',
    name: 'idx_actorId_at',
    spec: { actorId: 1, at: -1 },
    options: { sparse: true },
    reason: 'Get actions by actor, newest first (audit trail)',
  },
  {
    collection: 'audit_logs',
    name: 'idx_entity_entityId_at',
    spec: { entity: 1, entityId: 1, at: -1 },
    options: { sparse: true },
    reason: 'Get history of changes to an entity',
  },
  {
    collection: 'audit_logs',
    name: 'ttl_audit_logs',
    spec: { at: 1 },
    options: { expireAfterSeconds: 7776000 }, // 90 days
    reason: 'Auto-delete old audit logs',
  },

  // ===== Payment/Transactions Collection =====
  {
    collection: 'payments',
    name: 'idx_bookingId',
    spec: { bookingId: 1 },
    options: { sparse: true },
    reason: 'Get payment for booking',
  },
  {
    collection: 'payments',
    name: 'idx_userId_createdAt',
    spec: { userId: 1, createdAt: -1 },
    options: { sparse: true },
    reason: 'Get user payment history',
  },

  // ===== Booking Histories Collection =====
  {
    collection: 'booking_histories',
    name: 'idx_bookingId_at',
    spec: { bookingId: 1, at: -1 },
    options: { sparse: true },
    reason: 'Get status history for booking',
  },

  // ===== Services Collection =====
  {
    collection: 'services',
    name: 'idx_slug',
    spec: { slug: 1 },
    options: { sparse: true },
    reason: 'Look up service by slug',
  },
  {
    collection: 'services',
    name: 'idx_active',
    spec: { active: 1 },
    options: { sparse: true },
    reason: 'Get all active services (frontend listing)',
  },
];

/**
 * Create all indexes
 */
async function createIndexes() {
  const db = getDb();

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const indexDef of INDEXES) {
    try {
      const collection = db.collection(indexDef.collection);
      const existing = await collection.listIndexes().toArray();
      const indexExists = existing.some(idx => idx.name === indexDef.name);

      if (indexExists) {
        logger.debug(
          { collection: indexDef.collection, index: indexDef.name },
          'index already exists',
        );
        skipped++;
        continue;
      }

      await collection.createIndex(indexDef.spec, {
        name: indexDef.name,
        ...indexDef.options,
      });

      logger.info(
        {
          collection: indexDef.collection,
          index: indexDef.name,
          reason: indexDef.reason,
        },
        'index created',
      );
      created++;
    } catch (err) {
      logger.error(
        { err, collection: indexDef.collection, index: indexDef.name },
        'failed to create index',
      );
      errors++;
    }
  }

  return { created, skipped, errors };
}

/**
 * Verify indexes
 */
async function verifyIndexes() {
  const db = getDb();
  const stats = {};

  for (const indexDef of INDEXES) {
    const collection = db.collection(indexDef.collection);
    if (!stats[indexDef.collection]) {
      stats[indexDef.collection] = { total: 0, verified: 0 };
    }

    const existing = await collection.listIndexes().toArray();
    const found = existing.find(idx => idx.name === indexDef.name);

    stats[indexDef.collection].total++;
    if (found) {
      stats[indexDef.collection].verified++;
    }
  }

  return stats;
}

/**
 * Run index setup
 */
async function main() {
  try {
    logger.info('starting mongodb index setup');

    const result = await createIndexes();
    logger.info(
      result,
      `index creation done: ${result.created} created, ${result.skipped} skipped, ${result.errors} errors`,
    );

    const verify = await verifyIndexes();
    logger.info(
      { verification: verify },
      'index verification complete',
    );

    if (result.errors === 0) {
      logger.info('✅ All indexes created successfully');
      process.exit(0);
    } else {
      logger.warn(`⚠️  ${result.errors} indexes failed to create`);
      process.exit(1);
    }
  } catch (err) {
    logger.fatal({ err }, 'index setup failed');
    process.exit(1);
  } finally {
    await closeDb();
  }
}

main().catch(err => {
  logger.fatal({ err }, 'fatal error');
  process.exit(1);
});
