import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { roleGuard } from '../../middleware/role.middleware.js';
import { getDb } from '../../config/db.js';

const r = Router();

/**
 * GET /api/dashboard/stats
 * Lightweight per-user stats consumed by the customer Header (badge counts).
 */
r.get(
  '/stats',
  roleGuard(['user', 'pm', 'admin', 'resource']),
  asyncHandler(async (req, res) => {
    const db = getDb();
    const userId = new ObjectId(req.user.id);

    const [unreadNotificationsCount, totalPendingJobs, cartItemCount] = await Promise.all([
      db.collection('notifications').countDocuments({ userId, read: { $ne: true } }),
      db.collection('bookings').countDocuments({
        customerId: userId,
        status: { $in: ['pending', 'confirmed', 'assigned_to_pm', 'in_progress'] },
      }),
      db.collection('carts').countDocuments({ userId }).catch(() => 0),
    ]);

    res.json({
      success: true,
      data: { unreadNotificationsCount, totalPendingJobs, cartItemCount },
    });
  }),
);

export default r;
