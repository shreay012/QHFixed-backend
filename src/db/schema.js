/**
 * Drizzle schema for the Mongo → Postgres migration (strangler-fig).
 *
 * Conventions:
 *   - Primary keys: CHAR(24) — same shape as Mongo ObjectId hex string.
 *     Avoids breaking external references (JWT claims, webhooks, etc.).
 *   - i18n strings: JSONB columns with {en, hi, ar, de} keys. Frontend's
 *     flattenI18nDeep already handles this shape.
 *   - Embedded arrays/objects: JSONB. Reporting access via materialized
 *     views if needed later.
 *   - Timestamps: TIMESTAMPTZ (timezone-aware) to match Mongo Date semantics.
 *
 * Tables defined here in Phase 0 (foundation):
 *   countries, currencies, services, users, sessions
 *
 * Add more tables in subsequent migration phases. See migration plan §4.
 */

import { pgTable, char, varchar, text, integer, boolean, jsonb, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';

// ── Reference: countries ────────────────────────────────────────────
export const countries = pgTable('countries', {
  _id:           char('_id', { length: 24 }).primaryKey(),
  code:          varchar('code', { length: 2 }).notNull(),
  name:          jsonb('name').notNull(),               // { en, hi, ar, de }
  currency:      varchar('currency', { length: 3 }),
  supportedLangs: jsonb('supported_langs'),             // ['en', 'hi']
  config:        jsonb('config'),                       // tax, locale, etc.
  active:        boolean('active').default(true),
  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  codeIdx:   uniqueIndex('countries_code_unique').on(t.code),
  activeIdx: index('countries_active_idx').on(t.active),
}));

// ── Reference: currencies ───────────────────────────────────────────
export const currencies = pgTable('currencies', {
  _id:        char('_id', { length: 24 }).primaryKey(),
  code:       varchar('code', { length: 3 }).notNull(),
  name:       varchar('name', { length: 50 }),
  symbol:     varchar('symbol', { length: 4 }),
  decimals:   integer('decimals').default(2),
  active:     boolean('active').default(true),
  createdAt:  timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:  timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  codeIdx: uniqueIndex('currencies_code_unique').on(t.code),
}));

// ── Catalog: services ───────────────────────────────────────────────
export const services = pgTable('services', {
  _id:           char('_id', { length: 24 }).primaryKey(),
  slug:          varchar('slug', { length: 100 }).notNull(),
  name:          jsonb('name').notNull(),               // i18n
  tagline:       jsonb('tagline'),
  description:   jsonb('description'),
  category:      varchar('category', { length: 64 }),
  categoryName:  jsonb('category_name'),                 // i18n
  technologies:  jsonb('technologies'),                  // [{ name: i18n, required }]
  pricing:       jsonb('pricing'),                       // [{ country, currency, basePrice, ... }]
  highlights:    jsonb('highlights'),                    // [i18n]
  inclusions:    jsonb('inclusions'),
  notIncluded:   jsonb('not_included'),
  faq:           jsonb('faq'),
  hourlyRate:    integer('hourly_rate'),
  currency:      varchar('currency', { length: 3 }),
  minHours:      integer('min_hours'),
  maxHours:      integer('max_hours'),
  image:         text('image'),
  iconUrl:       text('icon_url'),
  sortOrder:     integer('sort_order').default(999),
  active:        boolean('active').default(true),
  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  slugIdx:     uniqueIndex('services_slug_unique').on(t.slug),
  activeCatIdx: index('services_active_category_idx').on(t.active, t.category),
}));

// ── Identity: users ─────────────────────────────────────────────────
export const users = pgTable('users', {
  _id:                  char('_id', { length: 24 }).primaryKey(),
  mobile:               varchar('mobile', { length: 20 }),
  email:                varchar('email', { length: 200 }),
  name:                 varchar('name', { length: 200 }),
  role:                 varchar('role', { length: 32 }).notNull().default('user'),
  country:              varchar('country', { length: 2 }),
  parentCountryAdminId: char('parent_country_admin_id', { length: 24 }),
  managedCountries:     jsonb('managed_countries'),     // ['IN'] for super_admin
  fcmTokens:            jsonb('fcm_tokens'),
  specialization:       jsonb('specialization'),
  skills:               jsonb('skills'),
  meta:                 jsonb('meta'),                  // { isProfileComplete, status, lastLoginAt }
  history:              jsonb('history'),
  deletedAt:            timestamp('deleted_at', { withTimezone: true }),
  createdAt:            timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:            timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  mobileIdx:        uniqueIndex('users_mobile_unique').on(t.mobile),
  emailIdx:         uniqueIndex('users_email_unique').on(t.email),
  roleCountryIdx:   index('users_role_country_idx').on(t.role, t.country),
  countryStatusIdx: index('users_country_status_idx').on(t.country),
}));

// ── Identity: sessions ──────────────────────────────────────────────
export const sessions = pgTable('sessions', {
  _id:              char('_id', { length: 24 }).primaryKey(),
  userId:           char('user_id', { length: 24 }).notNull(),
  refreshTokenHash: varchar('refresh_token_hash', { length: 200 }).notNull(),
  ip:               varchar('ip', { length: 64 }),
  ua:               text('ua'),
  revoked:          boolean('revoked').default(false),
  expiresAt:        timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt:        timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:        timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  userRevokedIdx: index('sessions_user_revoked_idx').on(t.userId, t.revoked),
  expiresIdx:     index('sessions_expires_idx').on(t.expiresAt),
}));

// ── Audit: structured action log ────────────────────────────────────
// Every admin write op (super_admin, country_admin, pm) lands here as a
// single row with queryable columns (actor, action, resource, country)
// plus a JSONB diff. Replaces the legacy Mongo audit_logs collection
// for everything we ship in Phase 1+. Indexed for the two access
// patterns we care about: "what did user X do?" and "who touched
// resource Y in country Z?".
export const auditLogsV2 = pgTable('audit_logs_v2', {
  _id:           char('_id', { length: 24 }).primaryKey(),
  actorId:       char('actor_id', { length: 24 }),
  actorRole:     varchar('actor_role', { length: 32 }),
  action:        varchar('action', { length: 64 }).notNull(),     // e.g. BOOKING_REASSIGNED
  resourceType:  varchar('resource_type', { length: 32 }).notNull(),
  resourceId:    char('resource_id', { length: 24 }),
  country:       varchar('country', { length: 2 }),
  before:        jsonb('before'),
  after:         jsonb('after'),
  ip:            varchar('ip', { length: 64 }),
  ua:            text('ua'),
  requestId:     varchar('request_id', { length: 64 }),
  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  actorTimeIdx:    index('audit_v2_actor_time_idx').on(t.actorId, t.createdAt),
  resourceIdx:     index('audit_v2_resource_idx').on(t.resourceType, t.resourceId),
  countryTimeIdx:  index('audit_v2_country_time_idx').on(t.country, t.createdAt),
  actionTimeIdx:   index('audit_v2_action_time_idx').on(t.action, t.createdAt),
}));

// Export table list for migration scripts to enumerate.
export const ALL_TABLES = [countries, currencies, services, users, sessions, auditLogsV2];
