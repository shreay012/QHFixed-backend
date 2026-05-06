import 'dotenv/config';
import { ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import { SendEmailCommand } from '@aws-sdk/client-ses';
import { sqs, ses } from '../config/aws.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

async function send({ to, subject, html, text }) {
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
}

async function loop() {
  if (!env.SQS_EMAIL_URL) {
    logger.warn('SQS_EMAIL_URL not set; worker idle');
    return;
  }
  while (true) {
    try {
      const { Messages = [] } = await sqs.send(new ReceiveMessageCommand({
        QueueUrl: env.SQS_EMAIL_URL,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 20,
        VisibilityTimeout: 60,
      }));
      await Promise.all(Messages.map(async (m) => {
        try {
          await send(JSON.parse(m.Body));
          await sqs.send(new DeleteMessageCommand({
            QueueUrl: env.SQS_EMAIL_URL, ReceiptHandle: m.ReceiptHandle,
          }));
        } catch (e) {
          logger.error({ err: e }, 'email send failed');
        }
      }));
    } catch (e) {
      logger.error({ err: e }, 'email sqs receive failed');
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

loop();
