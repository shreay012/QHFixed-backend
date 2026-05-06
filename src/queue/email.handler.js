/**
 * Email Queue Handler (BullMQ)
 *
 * Processes transactional email jobs from the EMAILS BullMQ queue.
 * Falls back to logging when SES is not configured (dev/staging).
 *
 * Job data shape:
 * {
 *   type: 'booking_confirmed' | 'booking_cancelled' | 'otp' | 'invoice' | 'generic',
 *   to: string,
 *   subject: string,
 *   html?: string,
 *   text?: string,
 *   templateId?: string,
 *   templateData?: object,
 * }
 */
import { SendEmailCommand } from '@aws-sdk/client-ses';
import { ses } from '../config/aws.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

/**
 * Send a transactional email via AWS SES.
 * Logs and resolves (no throw) when SES is not configured — prevents job failure in dev.
 */
async function sendEmail({ to, subject, html, text }) {
  if (!env.SES_FROM) {
    logger.warn({ to, subject }, '[EMAIL] SES_FROM not configured — email skipped');
    return { skipped: true };
  }

  // In mock/dev SMS mode, also skip real email sending
  if (env.NODE_ENV !== 'production' && env.SMS_PROVIDER === 'mock') {
    logger.info({ to, subject }, '[MOCK EMAIL]');
    return { mock: true };
  }

  try {
    await ses.send(new SendEmailCommand({
      Source: env.SES_FROM,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject },
        Body: {
          ...(html ? { Html: { Data: html } } : {}),
          ...(text ? { Text: { Data: text } } : {}),
        },
      },
    }));
    logger.info({ to, subject }, 'email sent via SES');
    return { success: true };
  } catch (err) {
    logger.error({ err: err.message, to, subject }, 'SES send failed');
    throw err; // BullMQ will retry
  }
}

/**
 * Build email content from a job type + template data.
 * In production, integrate with a CMS/templating service (Strapi, Handlebars, etc).
 */
function buildEmailContent(type, templateData = {}) {
  const defaults = {
    booking_confirmed: {
      subject: 'Your QuickHire booking is confirmed!',
      text: `Hi, your booking (${templateData.bookingId || ''}) has been confirmed. Our PM will reach out shortly.`,
    },
    booking_cancelled: {
      subject: 'Your QuickHire booking has been cancelled',
      text: `Hi, your booking (${templateData.bookingId || ''}) was cancelled. ${templateData.refundNote || ''}`,
    },
    invoice: {
      subject: `QuickHire Invoice - ${templateData.bookingId || ''}`,
      text: `Please find your invoice attached. Amount: ${templateData.currency || ''} ${templateData.amount || ''}.`,
    },
    generic: {
      subject: templateData.subject || 'QuickHire Notification',
      text: templateData.body || '',
    },
  };

  return defaults[type] || defaults.generic;
}

/* ──────────────────────────────────────────────────────────────────
   Main dispatch — called by BullMQ worker
────────────────────────────────────────────────────────────────── */

export async function handleEmailJob(job) {
  const { type, to, subject, html, text, templateData } = job.data;
  const jobId = job.id;

  if (!to) {
    logger.warn({ jobId, type }, 'email job missing "to" address — skipping');
    return { skipped: true };
  }

  // If explicit subject/html/text provided, use them directly
  if (subject && (html || text)) {
    return sendEmail({ to, subject, html, text });
  }

  // Otherwise build from template
  const content = buildEmailContent(type, templateData || {});
  return sendEmail({ to, subject: subject || content.subject, html, text: text || content.text });
}
