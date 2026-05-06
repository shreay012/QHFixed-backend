# Runbook: Payment Failure Spike

**Alert:** `PaymentFailureSpike`
**Severity:** Critical
**Threshold:** > 10 payment failures in 5 minutes

## Triage

1. Check Grafana → Payments panel → failure breakdown by gateway.
2. Query recent failures:
   ```js
   // MongoDB shell
   db.payments.find({ status: "failed", createdAt: { $gte: new Date(Date.now() - 1800000) } })
     .sort({ createdAt: -1 }).limit(20).pretty()
   ```
3. Check gateway status pages:
   - Razorpay: https://status.razorpay.com
   - Stripe: https://status.stripe.com
4. Check application logs for gateway error codes:
   ```
   kubectl logs deploy/api -n quickhire | grep -i "payment\|razorpay\|stripe" | tail -50
   ```

## Gateway-specific actions

### Razorpay (India)
- If gateway returns `BAD_REQUEST_ERROR` with `error.code=PAYMENT_AUTHORIZATION_FAILED`: card/UPI issue, not our fault.
- If gateway returns 5xx: check status page. Contact Razorpay support: support@razorpay.com / +91-80-46654555.
- Webhook signature errors: verify `RAZORPAY_WEBHOOK_SECRET` env var matches dashboard setting.

### Stripe (UAE, international)
- Check for `insufficient_funds`, `card_declined` (expected); spike in these is normal during promotions.
- Stripe outage: notify affected customers and retry via BullMQ queue.

## Refund process

If customers were charged but bookings failed (partial failure):
1. Query for jobs with status `pending` and payment `paid`:
   ```js
   db.jobs.find({ status: "pending", "pricing.paymentStatus": "paid", createdAt: { $gte: new Date(Date.now() - 86400000) } })
   ```
2. Trigger refunds via Admin Ops:
   ```
   POST /api/admin-ops/refunds
   { "bookingId": "...", "amount": ..., "reason": "payment_gateway_failure", "gateway": "razorpay" }
   ```
3. Approve:
   ```
   PATCH /api/admin-ops/refunds/:id/review
   { "action": "approve" }
   ```

## Escalation
- Notify finance lead immediately on Slack `#alerts-finance`.
- If > 50 failures: declare incident, open war room.
- Retain all payment attempt logs for 7 days (audit requirement).
