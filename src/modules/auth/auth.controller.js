import jwt from 'jsonwebtoken';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';
import * as svc from './auth.service.js';

export const sendOtp = asyncHandler(async (req, res) => {
  const { mobile, role } = req.body;
  const r = await svc.sendOtp({ mobile, role });
  res.json({ success: true, message: 'OTP sent successfully', data: r });
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { mobile, otp, fcmToken, role } = req.body;
  const data = await svc.verifyOtp({
    mobile, otp, fcmToken, role,
    ip: req.ip, ua: req.header('user-agent'),
  });
  res.json({ success: true, data });
});

export const guestAccess = asyncHandler(async (_req, res) => {
  const data = await svc.guestAccess();
  res.json({ success: true, data });
});

export const logout = asyncHandler(async (req, res) => {
  await svc.logout({
    sessionId: req.user?.sessionId,
    accessTokenExpSec: 7 * 24 * 60 * 60,
  });
  res.json({ success: true, message: 'Logged out successfully' });
});

export const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  // /auth/refresh is public (FE token may already be expired). Decode the
  // bearer (or body-supplied) access token without verifying expiry to
  // extract the sessionId, then validate the refresh token against the session.
  let sessionId = req.user?.sessionId || null;
  if (!sessionId) {
    const header = req.header('authorization') || '';
    const accessToken = header.startsWith('Bearer ') ? header.slice(7) : (req.body.accessToken || null);
    if (accessToken) {
      try {
        const claims = jwt.verify(accessToken, env.JWT_PUBLIC_KEY, {
          algorithms: [env.JWT_ALGORITHM],
          issuer: env.JWT_ISSUER,
          audience: env.JWT_AUDIENCE,
          ignoreExpiration: true,
        });
        sessionId = claims.sessionId;
      } catch {
        throw new AppError('AUTH_TOKEN_INVALID', 'Cannot decode access token', 401);
      }
    }
  }
  if (!sessionId) throw new AppError('AUTH_TOKEN_INVALID', 'Missing session', 401);
  const data = await svc.refresh({ refreshToken, sessionId });
  res.json({ success: true, data });
});
