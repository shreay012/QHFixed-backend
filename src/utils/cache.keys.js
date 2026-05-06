/**
 * Cache key constants and patterns
 * 
 * Naming convention: {module}:{resource}:{id|pattern}
 * Example: services:detail:service123
 */

// Time to live (in seconds)
export const CACHE_TTL = {
  // 5 minutes
  SHORT: 300,
  // 1 hour
  MEDIUM: 3600,
  // 24 hours
  LONG: 86400,
  // Never expire (use with caution)
  NEVER: 0,
};

// Cache key builders
export const CACHE_KEYS = {
  // Services
  SERVICES_LIST: 'services:list',
  SERVICES_DETAIL: (serviceId) => `services:detail:${serviceId}`,
  SERVICES_BY_CATEGORY: (category) => `services:category:${category}`,
  SERVICES_PATTERN: 'services:*',

  // Jobs/Bookings
  BOOKING_DETAIL: (bookingId) => `booking:detail:${bookingId}`,
  BOOKING_LIST_USER: (userId) => `booking:list:user:${userId}`,
  BOOKING_LIST_PM: (pmId) => `booking:list:pm:${pmId}`,
  BOOKING_ACTIVE: (bookingId) => `booking:active:${bookingId}`,
  BOOKING_PATTERN: 'booking:*',

  // Users/PMs
  USER_DETAIL: (userId) => `user:detail:${userId}`,
  USER_BY_PHONE: (phone) => `user:phone:${phone}`,
  PM_AVAILABILITY: (pmId) => `pm:availability:${pmId}`,
  PM_PROFILE: (pmId) => `pm:profile:${pmId}`,
  PM_PATTERN: 'pm:*',
  USER_PATTERN: 'user:*',

  // Availability
  AVAILABILITY_SLOTS: (serviceId, date) => `availability:slots:${serviceId}:${date}`,
  AVAILABILITY_PATTERN: 'availability:*',

  // Dashboard/Analytics
  DASHBOARD_STATS: (dashboardType, userId) => `dashboard:stats:${dashboardType}:${userId}`,
  DASHBOARD_PATTERN: 'dashboard:*',

  // CMS
  CMS_PAGE: (slug) => `cms:page:${slug}`,
  CMS_FAQ: 'cms:faq:list',
  CMS_PATTERN: 'cms:*',

  // Configuration (rarely changing)
  CONFIG_COUNTRIES: 'config:countries',
  CONFIG_CURRENCIES: 'config:currencies',
  CONFIG_ROLES: 'config:roles',
};

/**
 * Cache TTL recommendations by resource type
 */
export const CACHE_TTL_BY_RESOURCE = {
  services: CACHE_TTL.MEDIUM,      // Services don't change often
  users: CACHE_TTL.SHORT,          // User data can change (profile updates)
  bookings: CACHE_TTL.SHORT,       // Bookings update frequently
  availability: CACHE_TTL.SHORT,   // Availability is dynamic
  pm_availability: CACHE_TTL.SHORT,  // PM availability changes often
  dashboard: CACHE_TTL.SHORT,      // Dashboard stats should be fresh
  cms: CACHE_TTL.MEDIUM,           // CMS content is stable
  config: CACHE_TTL.LONG,          // Config rarely changes
};
