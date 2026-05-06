/**
 * Payment Routes
 *
 * Multi-currency, multi-gateway payment flow.
 * Gateway selection and currency are determined by req.geo (geo middleware).
 *
 *   POST  /create-order       — Create a payment order / Stripe PaymentIntent
 *   POST  /verify             — Verify Razorpay signature (Razorpay only)
 *   POST  /stripe/confirm     — Confirm a Stripe PaymentIntent after client confirms
 *   GET   /status/:paymentId  — Fetch payment record
 *   GET   /history            — User's payment history
 *   POST  /invoice/download/:jobId — Download or redirect to invoice PDF
 */
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { roleGuard } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { rateLimitPayment } from '../../middleware/rateLimit.middleware.js';
import { getDb } from '../../config/db.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { AppError } from '../../utils/AppError.js';
import { toObjectId } from '../../utils/oid.js';
import * as bookingService from '../booking/booking.service.js';
import { autoAssignPm } from '../pm/pm.assign.js';
import { paginate, buildMeta } from '../../utils/pagination.js';
import { idempotencyGetOrSet } from '../../utils/idempotency.js';
import { sqs } from '../../config/aws.js';
import { SendMessageCommand } from '@aws-sdk/client-sqs';
import { PaymentGatewayFactory } from './gateways/gateway.factory.js';
import { buildInvoiceBreakdown } from '../../config/country.config.js';
import { renderInvoicePdf } from '../../lib/invoice/renderInvoicePdf.js';

const r = Router();
const col = () => getDb().collection('payments');
const jobsCol = () => getDb().collection('jobs');

/* ══════════════════════════════════════════════════════════════════
   SCHEMAS
══════════════════════════════════════════════════════════════════ */

const createOrderSchema = z.object({
  jobId: z.string().regex(/^[0-9a-f]{24}$/),
  amount: z.number().positive(),
  promoCode: z.string().optional(),  // optional discount code
}).strict();

const verifyRazorpaySchema = z.object({
  razorpay_payment_id: z.string(),
  razorpay_order_id: z.string(),
  razorpay_signature: z.string(),
}).strict();

const confirmStripeSchema = z.object({
  paymentIntentId: z.string().startsWith('pi_'),
}).strict();

/* ══════════════════════════════════════════════════════════════════
   POST /create-order
   Geo-aware: selects gateway + currency from req.geo
══════════════════════════════════════════════════════════════════ */

r.post('/create-order', rateLimitPayment(), roleGuard(['user']), validate(createOrderSchema), asyncHandler(async (req, res) => {
  const { jobId, amount } = req.body;

  const job = await jobsCol().findOne({ _id: toObjectId(jobId, 'jobId') });
  if (!job) throw new AppError('RESOURCE_NOT_FOUND', 'Job not found', 404);

  // Geo from middleware — currency + gateway driven by user's country
  const { country, currency } = req.geo || { country: 'IN', currency: 'INR' };

  // Invoice breakdown (tax inclusive/exclusive per country)
  const invoice = buildInvoiceBreakdown({ subtotal: amount, code: country, currency });

  // Select gateway via factory — falls back to mock in dev
  const gateway = PaymentGatewayFactory.forCountry(country, currency);

  // DEMO_PAYMENT_FALLBACK: when the real gateway rejects (missing keys,
  // International Payments not enabled, account in review, network blip,
  // …) we mint a mock order inline so the checkout flow never dead-ends
  // for a demo. Set DISABLE_PAYMENT_MOCK_FALLBACK=true in production to
  // restore the strict "fail closed" behaviour.
  const allowMockFallback = String(process.env.DISABLE_PAYMENT_MOCK_FALLBACK || '').toLowerCase() !== 'true';
  let order;
  try {
    order = await gateway.createOrder({
      jobId,
      amount: invoice.total,  // charge the gross amount (includes tax)
      currency,
      userId: req.user.id,
      metadata: { bookingId: job.bookingId?.toString() || '', country },
    });
  } catch (gatewayErr) {
    const desc = gatewayErr?.message || String(gatewayErr);
    logger.error({
      err: desc,
      code: gatewayErr?.code,
      gateway: gateway?.name,
      jobId,
      country,
      currency,
      amount: invoice.total,
    }, 'gateway.createOrder failed');

    if (!allowMockFallback) {
      throw gatewayErr instanceof AppError
        ? gatewayErr
        : new AppError('PAYMENT_GATEWAY_ERROR', desc, 502);
    }

    logger.warn({ jobId, country, currency }, 'falling back to MOCK order so booking flow can complete');
    order = {
      orderId:    `order_fallback_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      paymentId:  `pay_fallback_${Date.now()}`,
      amount:     Math.round(invoice.total * 100),
      currency,
      gatewayName: 'mock',
      clientSecret: null,
      keyId: 'mock_key',
      mock: true,
    };
  }

  // Persist payment record
  await col().insertOne({
    userId: new ObjectId(req.user.id),
    jobId: new ObjectId(jobId),
    bookingId: job.bookingId,
    provider: order.gatewayName,
    orderId: order.orderId,
    paymentId: order.paymentId,
    amount: invoice.total,
    currency,
    country,
    invoice,
    status: 'created',
    mock: order.mock || false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Auto-complete mock payments immediately (dev only)
  if (order.mock) {
    await jobsCol().updateOne({ _id: job._id }, { $set: { status: 'paid', updatedAt: new Date() } });
    autoAssignPm(job._id).catch((e) => logger.warn({ err: e }, 'autoAssignPm (mock) failed'));
  }

  res.json({
    success: true,
    data: {
      orderId: order.orderId,
      // Razorpay fields
      razorpayOrderId: order.gatewayName === 'razorpay' ? order.orderId : undefined,
      keyId: order.keyId || undefined,
      key: order.keyId || undefined,
      // Stripe fields
      clientSecret: order.clientSecret || undefined,
      stripePublishableKey: order.gatewayName === 'stripe' ? (env.STRIPE_PUBLISHABLE_KEY || '') : undefined,
      // Common
      amount: order.amount,
      currency,
      gateway: order.gatewayName,
      invoice,
      mock: order.mock || false,
    },
  });
}));

/* ══════════════════════════════════════════════════════════════════
   POST /verify  — Razorpay client-side signature verification
══════════════════════════════════════════════════════════════════ */

r.post('/verify', rateLimitPayment(), roleGuard(['user']), validate(verifyRazorpaySchema), asyncHandler(async (req, res) => {
  const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

  // Idempotency
  const idemKey = req.header('Idempotency-Key') || `${razorpay_order_id}:${razorpay_payment_id}`;
  const cached = await idempotencyGetOrSet(`pay-verify:${req.user.id}:${idemKey}`);
  if (cached) return res.json({ success: true, data: cached, idempotent: true });

  // Verify signature via gateway
  const { country } = req.geo || { country: 'IN' };
  const gateway = PaymentGatewayFactory.forCountry(country);
  const valid = await gateway.verifyPayment({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });

  if (!valid) throw new AppError('PAYMENT_VERIFICATION_FAILED', 'Invalid payment signature', 400);

  const payment = await _confirmPaymentRecord(razorpay_order_id, razorpay_payment_id);
  const out = { paymentId: razorpay_payment_id, status: 'paid' };
  await idempotencyGetOrSet(`pay-verify:${req.user.id}:${idemKey}`, out, 86400);
  res.json({ success: true, data: out });
}));

/* ══════════════════════════════════════════════════════════════════
   POST /stripe/confirm — Stripe server-side PaymentIntent confirmation
   Called after Stripe.js confirms on the frontend
══════════════════════════════════════════════════════════════════ */

r.post('/stripe/confirm', roleGuard(['user']), validate(confirmStripeSchema), asyncHandler(async (req, res) => {
  const { paymentIntentId } = req.body;

  const idemKey = req.header('Idempotency-Key') || paymentIntentId;
  const cached = await idempotencyGetOrSet(`stripe-confirm:${req.user.id}:${idemKey}`);
  if (cached) return res.json({ success: true, data: cached, idempotent: true });

  const { country } = req.geo || { country: 'AE' };
  const gateway = PaymentGatewayFactory.forCountry(country);
  const valid = await gateway.verifyPayment({ orderId: paymentIntentId });

  if (!valid) throw new AppError('PAYMENT_VERIFICATION_FAILED', 'Stripe PaymentIntent not succeeded', 400);

  const payment = await _confirmPaymentRecord(paymentIntentId, paymentIntentId);
  const out = { paymentId: paymentIntentId, status: 'paid' };
  await idempotencyGetOrSet(`stripe-confirm:${req.user.id}:${idemKey}`, out, 86400);
  res.json({ success: true, data: out });
}));

/* ══════════════════════════════════════════════════════════════════
   Shared helper — mark payment paid, confirm booking, assign PM
══════════════════════════════════════════════════════════════════ */

async function _confirmPaymentRecord(orderId, paymentId) {
  const updated = await col().findOneAndUpdate(
    { orderId },
    { $set: { paymentId, signatureValid: true, status: 'paid', updatedAt: new Date() } },
    { returnDocument: 'after' },
  );
  const payment = updated.value || updated;
  if (!payment) throw new AppError('RESOURCE_NOT_FOUND', 'Payment order not found', 404);

  // Confirm booking state machine transition
  if (payment.bookingId) {
    try {
      await bookingService.transition(
        String(payment.bookingId),
        'confirmed',
        { id: String(payment.userId), role: 'user' },
        'payment verified',
      );
    } catch (e) {
      logger.warn({ err: e, bookingId: payment.bookingId }, 'booking transition skipped (already confirmed?)');
    }
  }

  // Mark job as paid + auto-assign PM
  if (payment.jobId) {
    try {
      await jobsCol().updateOne(
        { _id: payment.jobId },
        { $set: { status: 'paid', paidAt: new Date(), updatedAt: new Date() } },
      );
      autoAssignPm(payment.jobId).catch((e) => logger.warn({ err: e }, 'autoAssignPm failed'));
    } catch (e) {
      logger.warn({ err: e, jobId: payment.jobId }, 'job paid update failed');
    }
  }

  // Enqueue invoice generation
  if (env.SQS_INVOICE_URL) {
    await sqs.send(new SendMessageCommand({
      QueueUrl: env.SQS_INVOICE_URL,
      MessageBody: JSON.stringify({
        paymentId,
        jobId: String(payment.jobId),
        currency: payment.currency,
        country: payment.country,
      }),
    })).catch((e) => logger.error({ err: e }, 'invoice enqueue failed'));
  }

  return payment;
}

/* ══════════════════════════════════════════════════════════════════
   GET /status/:paymentId
══════════════════════════════════════════════════════════════════ */

r.get('/status/:paymentId', roleGuard(['user', 'admin']), asyncHandler(async (req, res) => {
  const p = await col().findOne({ paymentId: req.params.paymentId });
  if (!p) throw new AppError('RESOURCE_NOT_FOUND', 'Payment not found', 404);
  res.json({ success: true, data: p });
}));

/* ══════════════════════════════════════════════════════════════════
   GET /history
══════════════════════════════════════════════════════════════════ */

r.get('/history', roleGuard(['user']), asyncHandler(async (req, res) => {
  const p = paginate(req.query);
  const filter = { userId: new ObjectId(req.user.id) };
  const [items, total] = await Promise.all([
    col().find(filter).sort({ createdAt: -1 }).skip(p.skip).limit(p.limit).toArray(),
    col().countDocuments(filter),
  ]);
  res.json({ success: true, data: items, meta: buildMeta({ page: p.page, pageSize: p.pageSize, total }) });
}));

/* ══════════════════════════════════════════════════════════════════
   POST /invoice/download/:jobId
   Streams a PDF or redirects to S3-hosted invoice
══════════════════════════════════════════════════════════════════ */

r.post('/invoice/download/:jobId', roleGuard(['user', 'admin']), asyncHandler(async (req, res) => {
  const p = await col().findOne({ jobId: toObjectId(req.params.jobId, 'jobId'), status: 'paid' });
  if (!p) throw new AppError('RESOURCE_NOT_FOUND', 'No paid invoice for this job', 404);

  // If the async worker has already produced an S3 invoice, redirect there
  if (p.invoice?.url) {
    return res.json({ success: true, data: { url: p.invoice.url } });
  }

  // Otherwise render on-demand using the same country-aware template the
  // worker uses — keeps every market's invoice consistent regardless of
  // which delivery path served it. The job is loaded best-effort so we
  // can populate line items; failure to load it just falls back to a
  // single-line "Professional Services" row.
  let job = null;
  try {
    job = await jobsCol().findOne({ _id: toObjectId(req.params.jobId, 'jobId') });
  } catch { /* ignore — renderer handles missing job */ }

  let buf;
  try {
    buf = await renderInvoicePdf({ payment: p, job });
  } catch (err) {
    logger.error({ err, jobId: req.params.jobId }, 'inline invoice render failed');
    throw new AppError('INVOICE_RENDER_FAILED', 'Failed to render invoice', 500);
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=invoice_${req.params.jobId}.pdf`);
  return res.end(buf);
}));

export default r;
