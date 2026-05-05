import { z } from 'zod';

// FE sends "customer" (per platform contract); internal canonical role is "user".
// Accept both, normalize to "user" before downstream code.
const role = z.preprocess(
  (v) => (v === 'customer' ? 'user' : v),
  z.enum(['user', 'pm', 'admin', 'resource', 'super_admin', 'ops', 'finance', 'support', 'growth', 'viewer', 'seo']).default('user'),
);

// E.164 phone format: optional `+`, country code (1-3 digits), then 4-14
// subscriber digits. Total 7-15 digits per ITU-T spec. Examples:
//   +919876543210  +14155552671  +971501234567  919876543210
// Plain 10-digit numbers (legacy clients without country code) are still
// accepted — the service layer normalises them to +91 (India default).
const phoneRegex = /^\+?[1-9]\d{6,14}$/;

export const sendOtpSchema = z.object({
  mobile: z.string().regex(phoneRegex, 'mobile must be a valid international phone (E.164)'),
  role,
});

export const verifyOtpSchema = z.object({
  mobile: z.string().regex(phoneRegex),
  otp: z.string().regex(/^\d{4,6}$/),
  fcmToken: z.string().optional().default(''),
  role,
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20),
});
