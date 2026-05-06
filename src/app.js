import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { logger } from './config/logger.js';
import { env } from './config/env.js';
import { requestIdMiddleware } from './middleware/requestId.middleware.js';
import { authMiddleware } from './middleware/auth.middleware.js';
import { countryScope } from './middleware/country-scope.middleware.js';
import { rateLimit } from './middleware/rateLimit.middleware.js';
import { errorMiddleware, notFoundMiddleware } from './middleware/error.middleware.js';
import { sentryErrorHandler } from './config/sentry.js';
import { metricsMiddleware, metricsHandler } from './config/metrics.js';
import { sanitizeMongo, sanitizeXss } from './middleware/sanitize.middleware.js';
import { geoMiddleware } from './modules/i18n/geo.middleware.js';
import cookieParser from 'cookie-parser';
import { bindDualCol } from './config/db.js';
import { dualCol } from './data/dualCollection.js';
import routes from './routes.js';
import { paymentWebhookHandler, stripeWebhookHandler } from './modules/payment/payment.webhook.js';

// Wire the dual-driver collection adapter into getDualDb() — see config/db.js.
// Before this binding, getDualDb() falls back to native Mongo. With it, any
// caller of getDualDb().collection(name) reaches the Mongo↔Postgres router
// gated by env.PG_DRIVER_<TABLE>.
bindDualCol(dualCol);

export function buildApp() {
    const app = express();
    app.disable('x-powered-by');
    app.set('trust proxy', 1);

  app.use(requestIdMiddleware);
    app.use(pinoHttp({ logger, customProps: (req) => ({ requestId: req.id }) }));

  app.use(helmet());
    app.use(cors({
          origin: env.ALLOWED_ORIGINS === '*' ? true : env.ALLOWED_ORIGINS.split(','),
          credentials: true,
    }));

  // Payment webhooks need raw body for signature verification — mount BEFORE json middleware
  app.post('/payments/webhook', express.raw({ type: 'application/json' }), paymentWebhookHandler);
  app.post('/payments/webhook/stripe', express.raw({ type: 'application/json' }), stripeWebhookHandler);

  app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: true }));
    // Parse cookies — needed so `req.cookies.qh_locale` and `qh_country`
    // reach the geo middleware and downstream route projections.
    app.use(cookieParser());
    app.use(sanitizeMongo);
    app.use(sanitizeXss);
    app.use(geoMiddleware);

  app.get('/healthz', (_req, res) => res.json({ ok: true }));
    app.get('/readyz', (_req, res) => res.json({ ok: true }));
    app.get('/metrics', metricsHandler);

  app.use(metricsMiddleware);
    app.use(rateLimit());

  // Mount API routes under /api prefix. Auth middleware runs INSIDE the /api
  // mount so Express strips the prefix before matching against PUBLIC_PREFIXES
  // (e.g. /api/services → req.path becomes /services for the middleware).
  // Webhooks (/payments/webhook) are mounted at root above and bypass auth.
  //
  // countryScope runs after authMiddleware. With env.COUNTRY_SCOPE_MODE=off
  // (default) it's a no-op that just sets req.scope = {mode:'off',filter:{}}
  // — zero behaviour change. Flip the env to 'shadow' to log scope decisions
  // without enforcing, then 'enforce-new' to actually filter for the new
  // role hierarchy. See multi-country-rbac-plan.md §6 for full semantics.
  app.use('/api', authMiddleware, countryScope, routes);

  // Back-compat: also expose routes at root for any internal/legacy callers
  // (Render direct URLs, health probes, mobile apps with old base URLs).
  app.use(authMiddleware, countryScope, routes);

  app.use(notFoundMiddleware);
    app.use(sentryErrorHandler());
    app.use(errorMiddleware);

  return app;
}
