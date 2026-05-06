import multer from 'multer';
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middleware/validate.middleware.js';
import { roleGuard } from '../../middleware/role.middleware.js';
import { getDb } from '../../config/db.js';
import { ObjectId } from 'mongodb';
import { sanitizeUser } from '../auth/auth.service.js';
import { AppError } from '../../utils/AppError.js';
import { s3 } from '../../config/aws.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { env } from '../../config/env.js';
import { nanoid } from 'nanoid';

const r = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const usersCol = () => getDb().collection('users');

const profileSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  email: z.string().email().optional(),
});

r.get('/profile', roleGuard(['user', 'pm', 'admin', 'resource']), asyncHandler(async (req, res) => {
  const u = await usersCol().findOne({ _id: new ObjectId(req.user.id) });
  if (!u) throw new AppError('RESOURCE_NOT_FOUND', 'User not found', 404);
  res.json({ success: true, data: sanitizeUser(u) });
}));

r.put('/profile',
  roleGuard(['user', 'pm', 'admin', 'resource']),
  upload.single('avatar'),
  asyncHandler(async (req, res) => {
    const data = profileSchema.parse(req.body);
    const update = { ...data, updatedAt: new Date() };

    if (req.file && env.S3_BUCKET_CHAT) {
      const key = `avatars/${req.user.id}/${nanoid(10)}-${req.file.originalname}`;
      await s3.send(new PutObjectCommand({
        Bucket: env.S3_BUCKET_CHAT,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      }));
      update.avatarUrl = `https://${env.S3_BUCKET_CHAT}.s3.${env.AWS_REGION}.amazonaws.com/${key}`;
    }

    if (data.name && data.email) {
      update['meta.isProfileComplete'] = true;
    }

    let r2;
    try {
      r2 = await usersCol().findOneAndUpdate(
        { _id: new ObjectId(req.user.id) },
        { $set: update },
        { returnDocument: 'after' },
      );
    } catch (err) {
      if (err && err.code === 11000) {
        const field = Object.keys(err.keyPattern || err.keyValue || { email: 1 })[0] || 'field';
        throw new AppError('RESOURCE_CONFLICT', `This ${field} is already in use by another account`, 409);
      }
      throw err;
    }
    res.json({ success: true, data: sanitizeUser(r2.value || r2) });
  }),
);

r.post('/devices',
  roleGuard(['user', 'pm', 'admin', 'resource']),
  validate(z.object({ token: z.string().min(10), platform: z.enum(['android', 'ios', 'web']) })),
  asyncHandler(async (req, res) => {
    await usersCol().updateOne(
      { _id: new ObjectId(req.user.id) },
      { $addToSet: { fcmTokens: { ...req.body, createdAt: new Date() } } },
    );
    res.json({ success: true });
  }),
);

r.delete('/devices/:token',
  roleGuard(['user', 'pm', 'admin', 'resource']),
  asyncHandler(async (req, res) => {
    await usersCol().updateOne(
      { _id: new ObjectId(req.user.id) },
      { $pull: { fcmTokens: { token: req.params.token } } },
    );
    res.json({ success: true });
  }),
);

export default r;
