/**
 * RBAC — Role definitions and permission sets.
 *
 * Roles (from production scale plan appendix A):
 *   super_admin  Everything, including RBAC edits
 *   admin        Legacy alias — treated as ops + finance combined
 *   ops          Bookings, PM/Resource pool, reassign, refunds, tickets
 *   finance      Payouts, reconciliation, taxes, invoices, refunds approval
 *   support      Tickets, chat takeover, customer profiles (read), notes
 *   growth       CMS, promo codes, campaigns, segments, banners, feature flags
 *   viewer       Read-only dashboards
 *   pm           Project-manager panel (non-admin)
 *   resource     Field resource panel (non-admin)
 *   customer     End-user (non-admin)
 */

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  OPS: 'ops',
  FINANCE: 'finance',
  SUPPORT: 'support',
  GROWTH: 'growth',
  VIEWER: 'viewer',
  PM: 'pm',
  RESOURCE: 'resource',
  CUSTOMER: 'customer',
};

// All staff roles that can access the /api/admin namespace
export const ADMIN_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.OPS,
  ROLES.FINANCE,
  ROLES.SUPPORT,
  ROLES.GROWTH,
  ROLES.VIEWER,
];

/**
 * Permission groups — arrays of roles that can perform a given action class.
 * Use these in roleGuard() calls inside route files.
 */
export const PERMS = {
  // Bookings: read
  BOOKING_READ: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OPS, ROLES.FINANCE, ROLES.SUPPORT, ROLES.VIEWER],
  // Bookings: write (reassign, cancel, refund trigger)
  BOOKING_WRITE: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OPS],
  // Refund approval — finance owns the approval step
  REFUND_APPROVE: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.FINANCE],

  // PM / Resource pool
  POOL_READ: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OPS, ROLES.VIEWER],
  POOL_WRITE: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OPS],

  // Users / customers
  USER_READ: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OPS, ROLES.SUPPORT, ROLES.VIEWER],
  USER_WRITE: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OPS],

  // Services / pricing
  SERVICE_READ: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OPS, ROLES.VIEWER],
  SERVICE_WRITE: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OPS],

  // Payments / payouts
  PAYMENT_READ: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.FINANCE, ROLES.VIEWER],
  PAYOUT_WRITE: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.FINANCE],

  // Tickets / support
  TICKET_READ: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OPS, ROLES.SUPPORT, ROLES.VIEWER],
  TICKET_WRITE: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OPS, ROLES.SUPPORT],

  // CMS / growth
  CMS_READ: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GROWTH, ROLES.VIEWER],
  CMS_WRITE: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GROWTH],

  // Promo codes
  PROMO_READ: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GROWTH, ROLES.FINANCE, ROLES.VIEWER],
  PROMO_WRITE: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GROWTH],

  // Feature flags
  FLAG_READ: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GROWTH, ROLES.VIEWER],
  FLAG_WRITE: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GROWTH],

  // Audit logs / compliance
  AUDIT_READ: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.VIEWER],

  // KYC queue
  KYC_READ: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OPS, ROLES.SUPPORT],
  KYC_WRITE: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OPS],

  // RBAC management — super_admin only
  RBAC_WRITE: [ROLES.SUPER_ADMIN],

  // Dashboard / analytics — everyone with admin access can read
  DASHBOARD_READ: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OPS, ROLES.FINANCE, ROLES.SUPPORT, ROLES.GROWTH, ROLES.VIEWER],

  // Fraud / security dashboard
  FRAUD_READ: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OPS, ROLES.FINANCE],

  // Scheduling config
  SCHEDULE_WRITE: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OPS],
};
