/**
 * Stripe Gateway Implementation
 *
 * Used for AE (AED), DE (EUR), US (USD), AU (AUD), GB (GBP).
 * Uses Stripe Payment Intents API with automatic payment methods enabled.
 * Loaded lazily so the app starts fine when Stripe keys aren't configured.
 */
import { env } from '../../../config/env.js';
import { AppError } from '../../../utils/AppError.js';
import { logger } from '../../../config/logger.js';

let _client = null;

async function getClient() {
  if (_client) return _client;
  if (!env.STRIPE_SECRET_KEY) {
    throw new AppError('CONFIG_ERROR', 'Stripe secret key not configured (STRIPE_SECRET_KEY)', 500);
  }
  const StripeLib = (await import('stripe')).default;
  _client = new StripeLib(env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
    appInfo: { name: 'QuickHire', version: '1.0.0', url: 'https://quickhire.services' },
  });
  return _client;
}

/**
 * Zero-decimal currencies — Stripe expects amounts in their base unit already.
 * @see https://stripe.com/docs/currencies#zero-decimal
 */
const ZERO_DECIMAL_CURRENCIES = new Set([
  'BIF','CLP','DJF','GNF','JPY','KMF','KRW','MGA','PYG','RWF','UGX','VND','VUV','XAF','XOF','XPF',
]);

function toStripeCents(amount, currency) {
  if (ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase())) return Math.round(amount);
  return Math.round(amount * 100);
}

export class StripeGateway {
  /** @param {{ currency: string }} opts */
  constructor({ currency = 'USD' } = {}) {
    this.currency = currency;
    this.name = 'stripe';
  }

  /**
   * Create a Stripe PaymentIntent.
   *
   * @param {{ jobId: string, amount: number, currency: string, userId: string, metadata?: object }}
   * @returns {Promise<import('./types.js').GatewayOrderResult>}
   */
  async createOrder({ jobId, amount, currency, userId, metadata = {} }) {
    const stripe = await getClient();
    const cur = (currency || this.currency).toLowerCase();

    const intent = await stripe.paymentIntents.create({
      amount: toStripeCents(amount, cur),
      currency: cur,
      automatic_payment_methods: { enabled: true },
      metadata: { jobId, userId, ...metadata },
      description: `QuickHire job ${jobId}`,
    });

    logger.info({ intentId: intent.id, amount, currency: cur, jobId }, 'stripe payment intent created');

    return {
      orderId: intent.id,          // Stripe uses intent ID as the "order" ID
      paymentId: null,              // Populated after client-side confirmation
      amount: intent.amount,
      currency: intent.currency.toUpperCase(),
      gatewayName: 'stripe',
      clientSecret: intent.client_secret,  // Sent to frontend for Stripe.js
      keyId: env.STRIPE_PUBLISHABLE_KEY || '',
      mock: false,
    };
  }

  /**
   * Verify a Stripe payment by fetching the PaymentIntent status.
   * Stripe doesn't use client-side signatures — verification is server-side via API.
   *
   * @param {{ orderId: string, paymentId?: string, signature?: string }}
   * @returns {Promise<boolean>}
   */
  async verifyPayment({ orderId }) {
    const stripe = await getClient();
    const intent = await stripe.paymentIntents.retrieve(orderId);
    const ok = intent.status === 'succeeded';
    logger.info({ intentId: orderId, status: intent.status, ok }, 'stripe payment verified');
    return ok;
  }

  /**
   * Issue a refund against a Stripe PaymentIntent.
   *
   * @param {string} paymentIntentId  Stripe PaymentIntent ID (pi_xxx)
   * @param {number} amount           Refund amount in major currency units ($, €, etc.)
   * @param {string} [reason]         Human-readable reason stored in Stripe metadata
   * @returns {Promise<{ gatewayRefundId: string, status: 'completed' }>}
   */
  async createRefund(paymentIntentId, amount, reason = '') {
    const stripe = await getClient();
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: toStripeCents(amount, this.currency),
      reason: 'requested_by_customer',
      metadata: { reason },
    });
    logger.info({ paymentIntentId, refundId: refund.id, amount }, 'stripe refund created');
    return { gatewayRefundId: refund.id, status: 'completed' };
  }

  /**
   * Parse and verify a Stripe webhook event.
   *
   * @param {Buffer} rawBody
   * @param {string} signature  Value of stripe-signature header
   * @returns {{ event: string, data: object }}
   */
  buildWebhookEvent(rawBody, signature) {
    if (!env.STRIPE_WEBHOOK_SECRET) {
      throw new AppError('CONFIG_ERROR', 'Stripe webhook secret not configured (STRIPE_WEBHOOK_SECRET)', 500);
    }
    // Note: getClient() is async but constructEvent is sync — use the Stripe instance
    // cached synchronously if already initialised, else throw to signal misconfiguration.
    if (!_client) {
      throw new AppError('CONFIG_ERROR', 'Stripe client not initialised — call createOrder first', 500);
    }
    const event = _client.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
    return { event: event.type, data: event.data };
  }
}
