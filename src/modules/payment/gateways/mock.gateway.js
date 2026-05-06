/**
 * Mock Payment Gateway
 *
 * Used automatically in development when no real gateway keys are configured.
 * Returns plausible-looking order/payment IDs so the frontend checkout flow
 * can be exercised end-to-end without real money.
 *
 * NEVER use in production — PaymentGatewayFactory blocks this via env check.
 */
import { logger } from '../../../config/logger.js';
import { env } from '../../../config/env.js';
import { AppError } from '../../../utils/AppError.js';

export class MockGateway {
  /** @param {{ currency: string }} opts */
  constructor({ currency = 'INR' } = {}) {
    if (env.NODE_ENV === 'production') {
      throw new AppError('CONFIG_ERROR', 'MockGateway must not be used in production', 500);
    }
    this.currency = currency;
  }

  /**
   * Simulate order creation.
   *
   * @param {{ jobId: string, amount: number, currency: string, userId: string, metadata?: object }}
   * @returns {Promise<import('./types.js').GatewayOrderResult>}
   */
  async createOrder({ jobId, amount, currency, userId }) {
    const orderId = `order_mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const paymentId = `pay_mock_${Date.now()}`;
    logger.info({ orderId, paymentId, amount, currency, jobId, userId }, '[MOCK GATEWAY] createOrder');
    return {
      orderId,
      paymentId,
      amount: Math.round(amount * 100), // always cents/paise representation
      currency: currency || this.currency,
      gatewayName: 'mock',
      clientSecret: null,
      keyId: 'mock_key',
      mock: true,
    };
  }

  /**
   * Simulate signature verification — always passes in mock mode.
   *
   * @param {{ orderId: string, paymentId: string, signature: string }}
   * @returns {Promise<boolean>}
   */
  async verifyPayment({ orderId, paymentId }) {
    logger.info({ orderId, paymentId }, '[MOCK GATEWAY] verifyPayment — auto-approved');
    return true;
  }

  /**
   * Simulate a refund — always succeeds in mock mode.
   *
   * @param {string} paymentId  Mock payment ID
   * @param {number} amount     Refund amount
   * @param {string} [reason]   Reason label
   * @returns {Promise<{ gatewayRefundId: string, status: 'completed' }>}
   */
  async createRefund(paymentId, amount, reason = '') {
    const gatewayRefundId = `refund_mock_${Date.now()}`;
    logger.info({ paymentId, gatewayRefundId, amount, reason }, '[MOCK GATEWAY] createRefund — auto-approved');
    return { gatewayRefundId, status: 'completed' };
  }

  /**
   * No real webhook in mock mode.
   */
  buildWebhookEvent(_rawBody, _signature) {
    throw new AppError('CONFIG_ERROR', 'MockGateway does not handle webhooks', 400);
  }
}
