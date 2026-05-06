import { S3Client } from '@aws-sdk/client-s3';
import { SQSClient } from '@aws-sdk/client-sqs';
import { SNSClient } from '@aws-sdk/client-sns';
import { SESClient } from '@aws-sdk/client-ses';
import { env } from './env.js';

const region = env.AWS_REGION;

export const s3 = new S3Client({ region });
export const sqs = new SQSClient({ region });
export const sns = new SNSClient({ region });
export const ses = new SESClient({ region });
