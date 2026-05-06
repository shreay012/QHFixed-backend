import client from 'prom-client';
import { logger } from './logger.js';

const register = new client.Registry();

// Default Node.js metrics (event loop lag, GC, memory, etc.)
client.collectDefaultMetrics({ register, prefix: 'qh_' });

// ── HTTP ──────────────────────────────────────────────────────────
export const httpRequestDuration = new client.Histogram({
  name: 'qh_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

export const httpRequestsTotal = new client.Counter({
  name: 'qh_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// ── Bookings ──────────────────────────────────────────────────────
export const bookingsCreated = new client.Counter({
  name: 'qh_bookings_created_total',
  help: 'Total bookings created',
  registers: [register],
});

export const bookingsCompleted = new client.Counter({
  name: 'qh_bookings_completed_total',
  help: 'Total bookings completed',
  registers: [register],
});

export const bookingsCancelled = new client.Counter({
  name: 'qh_bookings_cancelled_total',
  help: 'Total bookings cancelled',
  registers: [register],
});

export const activeBookings = new client.Gauge({
  name: 'qh_active_bookings',
  help: 'Currently active (in_progress) bookings',
  registers: [register],
});

// ── Payments ──────────────────────────────────────────────────────
export const paymentsTotal = new client.Counter({
  name: 'qh_payments_total',
  help: 'Total payment attempts',
  labelNames: ['status', 'gateway'],
  registers: [register],
});

export const revenueTotal = new client.Counter({
  name: 'qh_revenue_total_inr',
  help: 'Cumulative revenue in base currency (INR paise)',
  registers: [register],
});

// ── Queue ──────────────────────────────────────────────────────────
export const queueJobsTotal = new client.Counter({
  name: 'qh_queue_jobs_total',
  help: 'Total BullMQ jobs processed',
  labelNames: ['queue', 'status'],
  registers: [register],
});

export const queueJobDuration = new client.Histogram({
  name: 'qh_queue_job_duration_seconds',
  help: 'BullMQ job processing duration',
  labelNames: ['queue'],
  buckets: [0.1, 0.5, 1, 5, 15, 30, 60],
  registers: [register],
});

// ── Sockets ───────────────────────────────────────────────────────
export const connectedSockets = new client.Gauge({
  name: 'qh_connected_sockets',
  help: 'Currently connected WebSocket clients',
  registers: [register],
});

// ── Notifications ─────────────────────────────────────────────────
export const notificationsSent = new client.Counter({
  name: 'qh_notifications_sent_total',
  help: 'Total notifications sent',
  labelNames: ['channel'],
  registers: [register],
});

/**
 * Express middleware — records duration + count per route.
 * Attach route pattern from req.route.path to avoid high-cardinality from IDs.
 */
export function metricsMiddleware(req, res, next) {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const route = req.route?.path ?? req.path ?? 'unknown';
    const labels = { method: req.method, route, status_code: res.statusCode };
    httpRequestsTotal.inc(labels);
    const durationSec = Number(process.hrtime.bigint() - start) / 1e9;
    httpRequestDuration.observe(labels, durationSec);
  });
  next();
}

/**
 * GET /metrics — Prometheus scrape endpoint.
 * Restrict to internal network in production (Nginx / k8s network policy).
 */
export async function metricsHandler(_req, res) {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    logger.error({ err }, 'metrics scrape failed');
    res.status(500).end();
  }
}

export { register };
