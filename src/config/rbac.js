/**
 * RBAC — Role definitions and permission sets.
 *
 * Roles (from production scale plan appendix A):
 *   super_admin     Everything, including RBAC edits — global scope
 *   country_admin   Country-scoped admin: full admin powers within their country only
 *   admin           Legacy alias — treated as ops + finance combined; if `country` set,
 *                   acts as country_admin for backward compatibility
 *   ops             Bookings, PM/Resource pool, reassign, refunds, tickets
 *   finance         Payouts, reconciliation, taxes, invoices, refunds approval
 *   support         Tickets, chat takeover, customer profiles (read), notes
 *   growth          CMS, promo codes, campaigns, segments, banners, feature flags
 *   viewer          Read-only dashboards
 *   pm              Project-manager panel (non-admin), country-scoped + assignment-scoped
 *   resource        Field resource panel (non-admin), country-scoped + assignment-scoped
 *   customer        End-user (non-admin)
 */

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  COUNTRY_ADMIN: 'country_admin',
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
  ROLES.COUNTRY_ADMIN,
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
  // Bookings — country_admin sees + writes only their country (enforced by countryScope middleware)
  BOOKING_READ:    [ROLES.SUPER_ADMIN, ROLES.COUNTRY_ADMIN, ROLES.ADMIN, ROLES.OPS, ROLES.FINANCE, ROLES.SUPPORT, ROLES.VIEWER],
  BOOKING_WRITE:   [ROLES.SUPER_ADMIN, ROLES.COUNTRY_ADMIN, ROLES.ADMIN, ROLES.OPS],
  // Refund approval — finance retains global; country_admin can approve own-country refunds
  REFUND_APPROVE:  [ROLES.SUPER_ADMIN, ROLES.COUNTRY_ADMIN, ROLES.ADMIN, ROLES.FINANCE],

  // PM / Resource pool — country_admin manages own-country pool
  POOL_READ:       [ROLES.SUPER_ADMIN, ROLES.COUNTRY_ADMIN, ROLES.ADMIN, ROLES.OPS, ROLES.VIEWER],
  POOL_WRITE:      [ROLES.SUPER_ADMIN, ROLES.COUNTRY_ADMIN, ROLES.ADMIN, ROLES.OPS],

  // Users / customers — country_admin sees customers with bookings in their country
  USER_READ:       [ROLES.SUPER_ADMIN, ROLES.COUNTRY_ADMIN, ROLES.ADMIN, ROLES.OPS, ROLES.SUPPORT, ROLES.VIEWER],
  USER_WRITE:      [ROLES.SUPER_ADMIN, ROLES.COUNTRY_ADMIN, ROLES.ADMIN, ROLES.OPS],

  // Services — global service definition is super_admin only; country_admin edits only own-country pricing block
  SERVICE_READ:    [ROLES.SUPER_ADMIN, ROLES.COUNTRY_ADMIN, ROLES.ADMIN, ROLES.OPS, ROLES.VIEWER],
  SERVICE_WRITE:   [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.OPS],
  // Country-scoped pricing edit (own country only — middleware enforces)
  PRICING_WRITE:   [ROLES.SUPER_ADMIN, ROLES.COUNTRY_ADMIN, ROLES.ADMIN, ROLES.OPS],

  // Payments / payouts — country_admin reads/approves own country's payments
  PAYMENT_READ:    [ROLES.SUPER_ADMIN, ROLES.COUNTRY_ADMIN, ROLES.ADMIN, ROLES.FINANCE, ROLES.VIEWER],
  PAYOUT_WRITE:    [ROLES.SUPER_ADMIN, ROLES.COUNTRY_ADMIN, ROLES.ADMIN, ROLES.FINANCE],

  // Tickets / support
  TICKET_READ:     [ROLES.SUPER_ADMIN, ROLES.COUNTRY_ADMIN, ROLES.ADMIN, ROLES.OPS, ROLES.SUPPORT, ROLES.VIEWER],
  TICKET_WRITE:    [ROLES.SUPER_ADMIN, ROLES.COUNTRY_ADMIN, ROLES.ADMIN, ROLES.OPS, ROLES.SUPPORT],

  // CMS / growth — global; country_admin does NOT edit CMS to avoid cross-country content drift
  CMS_READ:        [ROLES.SUPER_ADMIN, ROLES.COUNTRY_ADMIN, ROLES.ADMIN, ROLES.GROWTH, ROLES.VIEWER],
  CMS_WRITE:       [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GROWTH],

  // Promo codes
  PROMO_READ:      [ROLES.SUPER_ADMIN, ROLES.COUNTRY_ADMIN, ROLES.ADMIN, ROLES.GROWTH, ROLES.FINANCE, ROLES.VIEWER],
  PROMO_WRITE:     [ROLES.SUPER_ADMIN, ROLES.COUNTRY_ADMIN, ROLES.ADMIN, ROLES.GROWTH],

  // Feature flags — global, super_admin/growth only
  FLAG_READ:       [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GROWTH, ROLES.VIEWER],
  FLAG_WRITE:      [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.GROWTH],

  // Audit logs / compliance — country_admin sees own country's audit trail
  AUDIT_READ:      [ROLES.SUPER_ADMIN, ROLES.COUNTRY_ADMIN, ROLES.ADMIN, ROLES.VIEWER],

  // KYC queue
  KYC_READ:        [ROLES.SUPER_ADMIN, ROLES.COUNTRY_ADMIN, ROLES.ADMIN, ROLES.OPS, ROLES.SUPPORT],
  KYC_WRITE:       [ROLES.SUPER_ADMIN, ROLES.COUNTRY_ADMIN, ROLES.ADMIN, ROLES.OPS],

  // RBAC management — super_admin ONLY (country admins can't promote/demote)
  RBAC_WRITE:      [ROLES.SUPER_ADMIN],

  // Country-admin lifecycle (create, deactivate) — super_admin only
  COUNTRY_ADMIN_WRITE: [ROLES.SUPER_ADMIN],

  // Dashboard / analytics — everyone with admin access can read
  DASHBOARD_READ:  [ROLES.SUPER_ADMIN, ROLES.COUNTRY_ADMIN, ROLES.ADMIN, ROLES.OPS, ROLES.FINANCE, ROLES.SUPPORT, ROLES.GROWTH, ROLES.VIEWER],

  // Fraud / security dashboard
  FRAUD_READ:      [ROLES.SUPER_ADMIN, ROLES.COUNTRY_ADMIN, ROLES.ADMIN, ROLES.OPS, ROLES.FINANCE],

  // Scheduling config
  SCHEDULE_WRITE:  [ROLES.SUPER_ADMIN, ROLES.COUNTRY_ADMIN, ROLES.ADMIN, ROLES.OPS],
};
