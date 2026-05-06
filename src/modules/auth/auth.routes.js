import { Router } from 'express';
import { validate } from '../../middleware/validate.middleware.js';
import { rateLimitAuth } from '../../middleware/rateLimit.middleware.js';
import { sendOtpSchema, verifyOtpSchema, refreshSchema } from './auth.validators.js';
import * as ctrl from './auth.controller.js';

const r = Router();

// OTP endpoints get a tight per-IP+mobile rate limit (5/min). Without
// this, a bot can pin SMS provider spend by spamming /send-otp and a
// simple loop can brute-force 4-digit OTPs at /verify-otp.
r.post('/send-otp',   rateLimitAuth(), validate(sendOtpSchema),   ctrl.sendOtp);
r.post('/verify-otp', rateLimitAuth(), validate(verifyOtpSchema), ctrl.verifyOtp);
r.post('/guest-access', ctrl.guestAccess);
r.post('/refresh', validate(refreshSchema), ctrl.refresh);
r.post('/logout', ctrl.logout);

export default r;
