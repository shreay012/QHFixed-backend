#!/usr/bin/env node
/**
 * Reconcile payments stuck at status='created' by querying Razorpay's
 * Orders API for each one. If Razorpay confirms it's `paid`, we run the
 * same finalization steps the /verify endpoint would have run:
 *   payments.status = 'paid'
 *   booking.transition('confirmed')
 *   job.status = 'paid' + autoAssignPm
 *
 * Use this ONCE after deploying the SummaryStep fix to clean up the
 * backlog of payments that paid successfully but never got verified.
 *
 *   DRY_RUN=1 node src/scripts/reconcile-stuck-payments.js   # preview
 *   node src/scripts/reconcile-stuck-payments.js              # apply
 */
import 'dotenv/config';
import Razorpay from 'razorpay';
import { ObjectId } from 'mongodb';
import { connectDb, getDualDb, closeDb } from '../config/db.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import * as bookingService from '../modules/booking/booking.service.js';
import { autoAssignPm } from '../modules/pm/pm.assign.js';

const DRY_RUN = String(process.env.DRY_RUN || '').toLowerCase() === '1';
const HOURS = Number(process.env.LOOKBACK_HOURS || 168); // 7 days default

async function main() {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    console.error('RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set in env');
    process.exit(1);
  }
  await connectDb();
  const razor = new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
  const payments = getDualDb().collection('payments');
  const jobs = getDualDb().collection('jobs');

  const since = new Date(Date.now() - HOURS * 3600 * 1000);
  const stuck = await payments.find({
    status: 'created',
    provider: 'razorpay',
    createdAt: { $gte: since },
  }).toArray();

  console.log(`[${DRY_RUN ? 'DRY' : 'LIVE'}] found ${stuck.length} stuck payments since ${since.toISOString()}`);

  let fixed = 0;
  let stillPending = 0;
  let failed = 0;

  for (const p of stuck) {
    try {
      const order = await razor.orders.fetch(p.orderId);
      // Razorpay marks an order 'paid' once at least one payment captured.
      if (order.status !== 'paid') {
        stillPending++;
        console.log(`  ${p.orderId}  → razorpay says ${order.status} (skipping)`);
        continue;
      }
      const list = await razor.orders.fetchPayments(p.orderId);
      const paid = (list.items || []).find((x) => x.status === 'captured');
      if (!paid) {
        stillPending++;
        console.log(`  ${p.orderId}  → no captured payment (skipping)`);
        continue;
      }
      console.log(`  ${p.orderId}  → razorpay paid via ${paid.id}, applying`);
      if (DRY_RUN) { fixed++; continue; }

      await payments.updateOne(
        { _id: p._id },
        { $set: { status: 'paid', paymentId: paid.id, signatureValid: 'reconciled', updatedAt: new Date() } },
      );
      if (p.bookingId) {
        await bookingService.transition(
          String(p.bookingId), 'confirmed',
          { id: String(p.userId), role: 'user' },
          'reconciliation script',
        ).catch((e) => logger.info({ err: e?.code }, 'transition skipped'));
      }
      if (p.jobId) {
        await jobs.updateOne(
          { _id: p.jobId },
          { $set: { status: 'paid', paidAt: new Date(), updatedAt: new Date() } },
        );
        autoAssignPm(p.jobId).catch((e) => logger.warn({ err: e }, 'autoAssignPm failed'));
      }
      fixed++;
    } catch (e) {
      failed++;
      console.error(`  ${p.orderId}  → ERROR ${e?.message || e}`);
    }
  }

  console.log('');
  console.log(`Result: fixed=${fixed} stillPending=${stillPending} failed=${failed}`);
  await closeDb();
}

main().catch((e) => { console.error(e); process.exit(1); });
