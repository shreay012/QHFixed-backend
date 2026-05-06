import 'dotenv/config';
import { ObjectId } from 'mongodb';
import { ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { sqs, s3 } from '../config/aws.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { connectDb, closeDb, getDb } from '../config/db.js';
import { renderInvoicePdf } from '../lib/invoice/renderInvoicePdf.js';

async function generate({ paymentId, jobId }) {
  const db = getDb();
  const payment = await db.collection('payments').findOne({ paymentId });
  if (!payment) throw new Error('payment not found');
  const job = jobId ? await db.collection('jobs').findOne({ _id: new ObjectId(jobId) }) : null;

  // Country-aware render (locale, currency, tax label, registration number)
  // — the same template the sync /invoice/download route uses, so a user
  // who downloads before the worker finishes still gets an identical PDF.
  const buffer = await renderInvoicePdf({ payment, job });

  const userIdSeg = String(payment.userId || 'unknown');
  const jobSeg    = String(jobId || payment.jobId || payment.paymentId || 'invoice');
  const key = `invoices/${userIdSeg}/${jobSeg}.pdf`;
  await s3.send(new PutObjectCommand({
    Bucket: env.S3_BUCKET_INVOICES,
    Key: key,
    Body: buffer,
    ContentType: 'application/pdf',
  }));

  const url = await getSignedUrl(s3, new GetObjectCommand({
    Bucket: env.S3_BUCKET_INVOICES, Key: key,
  }), { expiresIn: 7 * 24 * 60 * 60 });

  // Preserve the existing invoice breakdown (subtotal/tax/total) and only
  // attach the storage metadata. Overwriting the whole object would drop
  // the country-specific tax line we computed at order-create time.
  await db.collection('payments').updateOne(
    { paymentId },
    {
      $set: {
        'invoice.key': key,
        'invoice.url': url,
        'invoice.generatedAt': new Date(),
        updatedAt: new Date(),
      },
    },
  );
  logger.info({ paymentId, key, country: payment.country, currency: payment.currency }, 'invoice generated');
}

async function loop() {
  if (!env.SQS_INVOICE_URL) {
    logger.warn('SQS_INVOICE_URL not set; worker idle');
    return;
  }
  while (true) {
    try {
      const { Messages = [] } = await sqs.send(new ReceiveMessageCommand({
        QueueUrl: env.SQS_INVOICE_URL,
        MaxNumberOfMessages: 5,
        WaitTimeSeconds: 20,
        VisibilityTimeout: 120,
      }));
      await Promise.all(Messages.map(async (m) => {
        try {
          await generate(JSON.parse(m.Body));
          await sqs.send(new DeleteMessageCommand({
            QueueUrl: env.SQS_INVOICE_URL, ReceiptHandle: m.ReceiptHandle,
          }));
        } catch (e) {
          logger.error({ err: e, body: m.Body }, 'invoice failed');
        }
      }));
    } catch (e) {
      logger.error({ err: e }, 'invoice sqs receive failed');
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

(async () => {
  await connectDb();
  process.on('SIGTERM', async () => { await closeDb(); process.exit(0); });
  await loop();
})();
