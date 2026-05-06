import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  ALLOWED_ORIGINS: z.string().default('*'),

  MONGO_URI: z.string(),
  MONGO_DB: z.string().default('quickhire'),
  // Connection pool sizing — see db.js. Optional; defaults are tuned for
  // ~1M-user / 50K-booking scale. Lower these for shared-cluster dev.
  MONGO_MAX_POOL_SIZE: z.coerce.number().optional(),
  MONGO_MIN_POOL_SIZE: z.coerce.number().optional(),

  REDIS_URL: z.string().default('redis://localhost:6379'),
  // Optional dedicated Redis URLs — one for queue traffic (BullMQ), one
  // for Socket.IO pub/sub adapter. Falls back to REDIS_URL if unset, so
  // existing single-Redis deploys keep working untouched.
  REDIS_URL_QUEUE:  z.string().optional(),
  REDIS_URL_PUBSUB: z.string().optional(),

  // Per-queue worker concurrency overrides. Defaults are tuned for ~1M
  // users / ~50K live bookings (see queue/index.js). Lower these for
  // smaller deploys to cap Mongo / Redis / push-API spend.
  QUEUE_CONCURRENCY_NOTIFICATIONS: z.coerce.number().optional(),
  QUEUE_CONCURRENCY_LIFECYCLE:     z.coerce.number().optional(),
  QUEUE_CONCURRENCY_EMAILS:        z.coerce.number().optional(),
  QUEUE_CONCURRENCY_ANALYTICS:     z.coerce.number().optional(),

  JWT_PRIVATE_KEY: z.string(),
  JWT_PUBLIC_KEY: z.string().optional(),
  JWT_ALGORITHM: z.enum(['RS256', 'HS256']).default('RS256'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),
  JWT_ISSUER: z.string().default('quickhire.services'),
  JWT_AUDIENCE: z.string().default('quickhire-api'),

  AWS_REGION: z.string().default('ap-south-1'),
  S3_BUCKET_CHAT: z.string().optional(),
  S3_BUCKET_INVOICES: z.string().optional(),
  SQS_NOTIFICATION_URL: z.string().optional(),
  SQS_INVOICE_URL: z.string().optional(),
  SQS_EMAIL_URL: z.string().optional(),
  SES_FROM: z.string().default('no-reply@quickhire.services'),

  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),

  OTP_LENGTH: z.coerce.number().default(4),
  OTP_TTL_SECONDS: z.coerce.number().default(300),
  SMS_PROVIDER: z.enum(['mock', 'msg91', 'sns', 'twilio']).default('mock'),
  MSG91_AUTH_KEY: z.string().optional(),
  // Twilio SMS provider — set SMS_PROVIDER=twilio + these three to enable.
  // TWILIO_PHONE_NUMBER is the Twilio-purchased number used as the SMS
  // sender (must be SMS-capable in the recipient's country).
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),

  LOG_LEVEL: z.string().default('info'),
  RATE_LIMIT_PER_MIN: z.coerce.number().default(120),

  SENTRY_DSN: z.string().optional(),
  APP_VERSION: z.string().default('0.0.0'),
  ANTHROPIC_API_KEY: z.string().optional(),
  MEILISEARCH_URL: z.string().default('http://localhost:7700'),
  MEILISEARCH_KEY: z.string().optional(),

  // Dev-only: if set, this OTP is always accepted (skip Redis/bcrypt check).
  // Should be empty/unset in production.
  DEV_MASTER_OTP: z.string().optional(),

  // Company / supplier details printed on every invoice. All optional —
  // missing fields just render as blank in the PDF. Per-country tax
  // registration numbers are picked up by lib/invoice/renderInvoicePdf.js
  // based on the payment's `country` field.
  COMPANY_NAME:           z.string().optional(),
  COMPANY_ADDRESS_LINE1:  z.string().optional(),
  COMPANY_ADDRESS_LINE2:  z.string().optional(),
  COMPANY_EMAIL:          z.string().optional(),
  COMPANY_PHONE:          z.string().optional(),
  COMPANY_LEGAL_FOOTER:   z.string().optional(),
  COMPANY_GSTIN:          z.string().optional(),  // India
  COMPANY_TRN:            z.string().optional(),  // UAE
  COMPANY_USTID:          z.string().optional(),  // Germany
  COMPANY_VAT_GB:         z.string().optional(),  // UK
  COMPANY_VAT_SA:         z.string().optional(),  // Saudi Arabia
  COMPANY_UEN:            z.string().optional(),  // Singapore
  COMPANY_EIN:            z.string().optional(),  // United States
  COMPANY_ABN:            z.string().optional(),  // Australia
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
// Replace literal \n in PEM keys (common when set via .env)
env.JWT_PRIVATE_KEY = env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n');
if (env.JWT_PUBLIC_KEY) {
  env.JWT_PUBLIC_KEY = env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n');
}

// If the app is running in development with a plain-text secret rather than a
// full RSA key pair, allow HS256 for local testing and use the same secret
// for verification.
const isPemPrivateKey = /-----BEGIN [A-Z ]+PRIVATE KEY-----/.test(env.JWT_PRIVATE_KEY);
if (env.NODE_ENV === 'development' && env.JWT_ALGORITHM === 'RS256' && !isPemPrivateKey) {
  console.warn('⚠️ JWT_PRIVATE_KEY does not appear to be a PEM key; falling back to HS256 for development.');
  env.JWT_ALGORITHM = 'HS256';
}
if (env.JWT_ALGORITHM === 'HS256') {
  env.JWT_PUBLIC_KEY = env.JWT_PRIVATE_KEY;
}
if (env.JWT_ALGORITHM === 'RS256' && !env.JWT_PUBLIC_KEY) {
  console.error('❌ Invalid environment: JWT_PUBLIC_KEY is required for RS256');
  process.exit(1);
}

// DEV_MASTER_OTP allowed in all environments for demo/staging use.
