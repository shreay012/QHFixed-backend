import * as Sentry from '@sentry/node';
import { env } from './env.js';
import { logger } from './logger.js';

/**
 * Initialise Sentry error tracking.
 * Must be called BEFORE any other imports in server.js.
 * When SENTRY_DSN is unset (local dev without it), Sentry is a no-op.
 */
export function initSentry() {
  if (!env.SENTRY_DSN) {
    logger.info('sentry disabled (SENTRY_DSN not set)');
    return;
  }

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    release: env.APP_VERSION,
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.2 : 1.0,
    // Capture unhandled promise rejections and uncaught exceptions
    integrations: [
      Sentry.onUnhandledRejectionIntegration({ mode: 'warn' }),
      Sentry.onUncaughtExceptionIntegration({ exitEvenIfOtherHandlersAreRegistered: false }),
    ],
    beforeSend(event) {
      // Strip PII from request bodies before sending
      if (event.request?.data) {
        const sensitive = ['password', 'otp', 'token', 'refreshToken', 'fcmToken', 'razorpay_signature'];
        for (const k of sensitive) {
          if (event.request.data[k]) event.request.data[k] = '[REDACTED]';
        }
      }
      return event;
    },
  });

  logger.info({ env: env.NODE_ENV }, 'sentry initialised');
}

/**
 * Express error handler — captures exceptions with request context.
 * Mount AFTER all routes, BEFORE your own errorMiddleware.
 */
export function sentryErrorHandler() {
  return Sentry.expressErrorHandler();
}

/**
 * Capture an error manually (e.g. from catch blocks where you don't re-throw).
 */
export function captureError(err, context = {}) {
  Sentry.withScope((scope) => {
    for (const [k, v] of Object.entries(context)) scope.setExtra(k, v);
    Sentry.captureException(err);
  });
}

/**
 * Set user context on the current Sentry scope (call from auth middleware).
 */
export function setSentryUser(user) {
  Sentry.setUser(user ? { id: user.id, role: user.role } : null);
}
