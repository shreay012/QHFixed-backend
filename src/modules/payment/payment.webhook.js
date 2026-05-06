import crypto from 'crypto';
import { getDb } from '../../config/db.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import * as bookingService from '../booking/booking.service.js';
import { autoAssignPm } from '../pm/pm.assign.js';

/* ──────────────────────────────────────────────────────────────────
   Shared helper — mark payment paid + confirm booking + assign PM
────────────────────────────────────────────────────────────────── */
async function handlePaymentSuccess(orderId, paymentId, eventId, eventType) {
  const db = getDb();
  const payments = db.collection('payments');

  const updated = await payments.findOneAndUpdate(
    { orderId },
    {
      $set: { paymentId, status: 'paid', updatedAt: new Date() },
      $addToSet: { rawWebhookEvents: { id: eventId, type: eventType, at: new Date() } },
    },
    { returnDocument: 'after' },
  );

  const p = updated.value || updated;
  if (!p) return;

  if (p.bookingId) {
    try {
      await bookingService.transition(
        String(p.bookingId),
        'confirmed',
        { id: String(p.userId), role: 'user' },
        `webhook ${eventType}`,
      );
    } catch (e) {
      logger.info({ err: e?.code }, 'webhook booking transition skipped');
    }
  }

  if (p.jobId) {
    autoAssignPm(p.jobId).catch((e) => logger.warn({ err: e }, 'webhook autoAssignPm failed'));
  }
}

async function handlePaymentFailed(orderId, eventId, eventType) {
  await getDb().collection('payments').updateOne(
    { orderId },
    {
      $set: { status: 'failed', updatedAt: new Date() },
      $addToSet: { rawWebhookEvents: { id: eventId, type: eventType, at: new Date() } },
    },
  );
}

/**
 * Razorpay webhook. Mounted with raw body parser in app.js at /payments/webhook.
 * Idempotent: deduplicates by event.id stored on the payment document.
 */
export async function paymentWebhookHandler(req, res) {
  try {
    const signature = req.header('x-razorpay-signature');
    if (!signature || !env.RAZORPAY_WEBHOOK_SECRET) {
      return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST' } });
    }

    const expected = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(req.body) // raw Buffer
      .digest('hex');

    let valid = false;
    try {
      valid = expected.length === signature.length &&
        crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch { valid = false; }

    if (!valid) {
      return res.status(401).json({ success: false, error: { code: 'INVALID_SIGNATURE' } });
    }

    const event = JSON.parse(req.body.toString('utf8'));
    const eventId = event.id;
    const type = event.event;
    const payload = event.payload || {};

    // Dedup: if we've already processed this event, return 200 immediately
    const existing = await getDb().collection('payments').findOne({
      'rawWebhookEvents.id': eventId,
    });
    if (existing) return res.json({ ok: true, dedup: true });

    if (type === 'payment.captured' || type === 'order.paid') {
      const orderId = payload.payment?.entity?.order_id || payload.order?.entity?.id;
      const paymentId = payload.payment?.entity?.id;
      if (!orderId) return res.json({ ok: true });
      await handlePaymentSuccess(orderId, paymentId, eventId, type);
    } else if (type === 'payment.failed') {
      const orderId = payload.payment?.entity?.order_id;
      if (orderId) await handlePaymentFailed(orderId, eventId, type);
    }

    return res.json({ ok: true });
  } catch (e) {
    logger.error({ err: e }, 'razorpay webhook error');
    return res.status(500).json({ success: false });
  }
}

/**
 * Stripe webhook. Mounted with raw body parser in app.js at /payments/webhook/stripe.
 * Uses Stripe constructEvent() for signature verification.
 */
export async function stripeWebhookHandler(req, res) {
  try {
    const signature = req.header('stripe-signature');
    if (!signature || !env.STRIPE_WEBHOOK_SECRET) {
      return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST' } });
    }

    if (!env.STRIPE_SECRET_KEY) {
      return res.status(400).json({ success: false, error: { code: 'STRIPE_NOT_CONFIGURED' } });
    }

    // Lazy Stripe client for webhook verification
    const StripeLib = (await import('stripe')).default;
    const stripe = new StripeLib(env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, signature, env.STRIPE_WEBHOOK_SECRET);
    } catch (e) {
      logger.warn({ err: e.message }, 'stripe webhook signature mismatch');
      return res.status(401).json({ success: false, error: { code: 'INVALID_SIGNATURE' } });
    }

    const eventId = event.id;
    const type = event.type;

    // Dedup
    const existing = await getDb().collection('payments').findOne({
      'rawWebhookEvents.id': eventId,
    });
    if (existing) return res.json({ ok: true, dedup: true });

    if (type === 'payment_intent.succeeded') {
      const intent = event.data.object;
      await handlePaymentSuccess(intent.id, intent.id, eventId, type);
    } else if (type === 'payment_intent.payment_failed') {
      const intent = event.data.object;
      await handlePaymentFailed(intent.id, eventId, type);
    }

    return res.json({ ok: true });
  } catch (e) {
    logger.error({ err: e }, 'stripe webhook error');
    return res.status(500).json({ success: false });
  }
}
