/**
 * Razorpay Gateway Implementation
 *
 * Used for India (INR). Wraps the Razorpay Node SDK.
 * Loaded lazily so the app starts fine even without the npm package installed
 * (though `razorpay` is already in package.json).
 */
import crypto from 'crypto';
import { env } from '../../../config/env.js';
import { AppError } from '../../../utils/AppError.js';
import { logger } from '../../../config/logger.js';

let _client = null;

async function getClient() {
  if (_client) return _client;
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw new AppError('CONFIG_ERROR', 'Razorpay keys not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)', 500);
  }
  const Razorpay = (await import('razorpay')).default;
  _client = new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });
  return _client;
}

export class RazorpayGateway {
  /** @param {{ currency: string }} opts */
  constructor({ currency = 'INR' } = {}) {
    this.currency = currency;
    this.name = 'razorpay';
  }

  /**
   * Create a Razorpay order.
   *
   * If the merchant account hasn't enabled International Payments for the
   * target currency (very common on a freshly provisioned Razorpay account),
   * we automatically retry the order in INR converted via static FX rates so
   * the checkout still completes — the user sees the local-currency total on
   * the booking summary and Razorpay shows the INR equivalent inside its
   * checkout popup. Once the merchant enables International Payments on
   * https://dashboard.razorpay.com/ this fallback becomes a no-op.
   *
   * @param {{ jobId: string, amount: number, currency: string, userId: string, metadata?: object }}
   * @returns {Promise<import('./types.js').GatewayOrderResult>}
   */
  async createOrder({ jobId, amount, currency, userId, metadata = {} }) {
    const client = await getClient();
    const targetCurrency = String(currency || this.currency || 'INR').toUpperCase();

    const buildPayload = (cur, amt) => ({
      amount: Math.round(amt * 100), // smallest currency unit
      currency: cur,
      receipt: `job_${jobId}`,
      notes: { jobId, userId, ...metadata },
    });

    try {
      const order = await client.orders.create(buildPayload(targetCurrency, amount));
      logger.info({ orderId: order.id, amount, currency: targetCurrency, jobId }, 'razorpay order created');
      return {
        orderId: order.id,
        paymentId: null,
        amount: order.amount,
        currency: order.currency,
        gatewayName: 'razorpay',
        clientSecret: null,
        keyId: env.RAZORPAY_KEY_ID,
        mock: false,
      };
    } catch (err) {
      const desc = err?.error?.description || err?.message || String(err);
      const code = err?.error?.code || err?.statusCode;
      logger.warn({ err: desc, code, currency: targetCurrency, jobId }, 'razorpay order creation failed');

      // INR fallback path — only retry when the failure looks currency-related
      // and the user wasn't already paying in INR.
      const looksCurrencyRelated = targetCurrency !== 'INR' && (
        /international/i.test(desc) ||
        /currency/i.test(desc) ||
        code === 'BAD_REQUEST_ERROR'
      );

      if (looksCurrencyRelated) {
        // Static FX rates — ROUGH display-only conversion. Same approach the
        // discover/pricing layer uses (lib/i18n/config.js fxFromINR inverse).
        const FX_TO_INR = { USD: 84, EUR: 91, AED: 23, AUD: 55, GBP: 106, SGD: 62, CAD: 61, SAR: 22 };
        const rate = FX_TO_INR[targetCurrency];
        if (!rate) {
          throw new AppError('PAYMENT_GATEWAY_ERROR', `Razorpay rejected ${targetCurrency} and no INR fallback rate available: ${desc}`, 502);
        }
        const inrAmount = +(amount * rate).toFixed(2);
        logger.info({ from: targetCurrency, to: 'INR', originalAmount: amount, inrAmount }, 'retrying razorpay order in INR (International Payments not enabled?)');
        const order = await client.orders.create(buildPayload('INR', inrAmount));
        return {
          orderId: order.id,
          paymentId: null,
          amount: order.amount,
          currency: 'INR',
          gatewayName: 'razorpay',
          clientSecret: null,
          keyId: env.RAZORPAY_KEY_ID,
          mock: false,
        };
      }

      throw new AppError('PAYMENT_GATEWAY_ERROR', `Razorpay: ${desc}`, 502);
    }
  }

  /**
   * Verify Razorpay signature after client-side payment.
   *
   * @param {{ orderId: string, paymentId: string, signature: string }}
   * @returns {Promise<boolean>}
   */
  async verifyPayment({ orderId, paymentId, signature }) {
    if (!env.RAZORPAY_KEY_SECRET) {
      throw new AppError('CONFIG_ERROR', 'Razorpay secret not configured', 500);
    }
    const expected = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    try {
      return expected.length === signature.length &&
        crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch {
      return false;
    }
  }

  /**
   * Issue a refund against a Razorpay payment.
   *
   * @param {string} paymentId   Razorpay payment ID (pay_xxx)
   * @param {number} amount      Refund amount in major currency units (₹, not paise)
   * @param {string} [reason]    Human-readable reason stored in Razorpay notes
   * @returns {Promise<{ gatewayRefundId: string, status: 'completed' }>}
   */
  async createRefund(paymentId, amount, reason = '') {
    const client = await getClient();
    const refund = await client.payments.refund(paymentId, {
      amount: Math.round(amount * 100), // paise
      notes: { reason },
    });
    logger.info({ paymentId, refundId: refund.id, amount }, 'razorpay refund created');
    return { gatewayRefundId: refund.id, status: 'completed' };
  }

  /**
   * Parse and verify a Razorpay webhook payload.
   *
   * @param {Buffer} rawBody
   * @param {string} signature  Value of x-razorpay-signature header
   * @returns {{ event: string, data: object }}
   */
  buildWebhookEvent(rawBody, signature) {
    if (!env.RAZORPAY_WEBHOOK_SECRET) {
      throw new AppError('CONFIG_ERROR', 'Razorpay webhook secret not configured', 500);
    }
    const expected = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    let valid = false;
    try {
      valid = expected.length === signature.length &&
        crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch { valid = false; }

    if (!valid) throw new AppError('WEBHOOK_INVALID_SIGNATURE', 'Razorpay webhook signature mismatch', 400);

    const body = JSON.parse(rawBody.toString());
    return { event: body.event, data: body.payload };
  }
}
