import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { logger } from './config/logger.js';
import { env } from './config/env.js';
import { requestIdMiddleware } from './middleware/requestId.middleware.js';
import { authMiddleware } from './middleware/auth.middleware.js';
import { rateLimit } from './middleware/rateLimit.middleware.js';
import { errorMiddleware, notFoundMiddleware } from './middleware/error.middleware.js';
import { sentryErrorHandler } from './config/sentry.js';
import { metricsMiddleware, metricsHandler } from './config/metrics.js';
import { sanitizeMongo, sanitizeXss } from './middleware/sanitize.middleware.js';
import { geoMiddleware } from './modules/i18n/geo.middleware.js';
import routes from './routes.js';
import { paymentWebhookHandler, stripeWebhookHandler } from './modules/payment/payment.webhook.js';

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
    app.use(sanitizeMongo);
    app.use(sanitizeXss);
    app.use(geoMiddleware);

  app.get('/healthz', (_req, res) => res.json({ ok: true }));
    app.get('/readyz', (_req, res) => res.json({ ok: true }));
    app.get('/metrics', metricsHandler);

  app.use(metricsMiddleware);
    app.use(rateLimit());
    app.use(authMiddleware);

  app.use(routes);

  app.use(notFoundMiddleware);
    app.use(sentryErrorHandler());
    app.use(errorMiddleware);

  return app;
}
