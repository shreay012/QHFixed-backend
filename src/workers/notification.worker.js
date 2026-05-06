import 'dotenv/config';
import { ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { sqs } from '../config/aws.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { connectDb, closeDb } from '../config/db.js';
import { dispatch } from '../modules/notification/notification.service.js';

async function loop() {
  if (!env.SQS_NOTIFICATION_URL) {
    logger.warn('SQS_NOTIFICATION_URL not set; worker idle');
    return;
  }
  while (true) {
    try {
      const { Messages = [] } = await sqs.send(new ReceiveMessageCommand({
        QueueUrl: env.SQS_NOTIFICATION_URL,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 20,
        VisibilityTimeout: 60,
      }));
      await Promise.all(Messages.map(async (m) => {
        try {
          await dispatch(JSON.parse(m.Body));
          await sqs.send(new DeleteMessageCommand({
            QueueUrl: env.SQS_NOTIFICATION_URL,
            ReceiptHandle: m.ReceiptHandle,
          }));
        } catch (e) {
          logger.error({ err: e, body: m.Body }, 'notification dispatch failed');
        }
      }));
    } catch (e) {
      logger.error({ err: e }, 'sqs receive failed');
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

(async () => {
  await connectDb();
  process.on('SIGTERM', async () => { await closeDb(); process.exit(0); });
  await loop();
})();
