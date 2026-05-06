import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { roleGuard } from '../../middleware/role.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { getDb } from '../../config/db.js';
import { s3 } from '../../config/aws.js';
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';
import { nanoid } from 'nanoid';
import * as chatService from './chat.service.js';

const r = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

const ATTACH_MIMES = new Set([
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/zip',
  'text/plain',
]);

// GET /api/chat/messages/:customerId?serviceId=...&before=...&limit=50
r.get('/messages/:customerId',
  roleGuard(['user', 'pm', 'admin']),
  asyncHandler(async (req, res) => {
    const { customerId } = req.params;
    const { serviceId, before, limit, bookingId } = req.query;
    if (!serviceId && !bookingId) throw new AppError('VALIDATION_ERROR', 'serviceId or bookingId required', 422);
    try {
      const result = await chatService.getHistory({
        user: req.user, customerId, serviceId, bookingId, before,
        limit: Number(limit) || 50,
      });
      res.json({ success: true, data: result.items, meta: { roomId: result.roomId } });
    } catch (e) {
      // Graceful degradation: never fail chat history page load
      res.json({ success: true, data: [], meta: { error: e.code } });
    }
  }),
);

// POST /api/chat/send/:customerId
const sendSchema = z.object({
  msg: z.string().max(5000).optional().default(''),
  serviceId: z.string().regex(/^[0-9a-f]{24}$/),
  bookingId: z.string().regex(/^[0-9a-f]{24}$/).optional(),
  msg_type: z.coerce.number().default(0),
  first_msg: z.coerce.number().default(0),
  attachmentKey: z.string().optional(),
});

r.post('/send/:customerId',
  roleGuard(['user', 'pm', 'admin']),
  upload.single('attachment'),
  asyncHandler(async (req, res) => {
    const body = sendSchema.parse(req.body);
    const { customerId } = req.params;

    let attachment = null;

    if (req.file) {
      if (!ATTACH_MIMES.has(req.file.mimetype)) {
        throw new AppError('VALIDATION_ERROR', 'Unsupported file type', 422);
      }
      if (!env.S3_BUCKET_CHAT) throw new AppError('CONFIG_ERROR', 'S3 bucket not configured', 500);
      const key = `chat/${customerId}/${nanoid(10)}-${req.file.originalname}`;
      await s3.send(new PutObjectCommand({
        Bucket: env.S3_BUCKET_CHAT,
        Key: key,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      }));
      attachment = {
        url: `https://${env.S3_BUCKET_CHAT}.s3.${env.AWS_REGION}.amazonaws.com/${key}`,
        key,
        mime: req.file.mimetype,
        size: req.file.size,
        name: req.file.originalname,
      };
    } else if (body.attachmentKey) {
      attachment = { key: body.attachmentKey, url: `https://${env.S3_BUCKET_CHAT}.s3.${env.AWS_REGION}.amazonaws.com/${body.attachmentKey}` };
    }

    // BOOKING_ROOM_ROUTES_FIX_V1: prefer booking-scoped room when bookingId is given.
    // Falls back to legacy pairwise convention for non-booking flows (pre-booking chat).
    const roomId = body.bookingId
      ? `booking_${body.bookingId}`
      : (customerId === body.serviceId
        ? chatService.roomIdFor({ serviceId: body.serviceId, userId: req.user.id })
        : chatService.roomIdFor({ pmId: customerId, serviceId: body.serviceId }));

    const message = await chatService.persistAndBroadcast({
      sender: req.user,
      roomId,
      msgType: attachment ? 1 : (Number(body.msg_type) || 0),
      msg: body.msg,
      attachment,
      serviceId: body.serviceId,
      bookingId: body.bookingId,
      firstMsg: body.first_msg,
    });

    res.json({ success: true, data: message });
  }),
);

// POST /api/chat/seen/:messageId  (also accept GET for FE compatibility)
const seenHandler = asyncHandler(async (req, res) => {
  await chatService.markSeen(req.params.messageId, req.user.id);
  res.json({ success: true });
});
r.post('/seen/:messageId', roleGuard(['user', 'pm', 'admin']), seenHandler);
r.get('/seen/:messageId', roleGuard(['user', 'pm', 'admin']), seenHandler);

// POST /api/chat/typing/:customerId  — broadcast typing to room (no persistence)
r.post('/typing/:customerId',
  roleGuard(['user', 'pm', 'admin']),
  asyncHandler(async (req, res) => {
    const { customerId } = req.params;
    const { isTyping, serviceId } = req.body || {};
    if (!serviceId) return res.json({ success: true });
    const roomId = customerId === serviceId
      ? chatService.roomIdFor({ serviceId, userId: req.user.id })
      : chatService.roomIdFor({ pmId: customerId, serviceId });
    const { emitTo } = await import('../../socket/index.js');
    const payload = { userId: req.user.id, senderId: req.user.id, isTyping: !!isTyping };
    emitTo(roomId, 'typing', payload);
    emitTo(roomId, 'user_typing', payload);
    res.json({ success: true });
  }),
);

// POST /api/chat/upload-url  → presigned PUT URL for direct browser upload
const uploadUrlSchema = z.object({
  mime: z.string(),
  size: z.number().int().positive().max(25 * 1024 * 1024),
  name: z.string().max(200),
});
r.post('/upload-url',
  roleGuard(['user', 'pm', 'admin']),
  validate(uploadUrlSchema),
  asyncHandler(async (req, res) => {
    if (!ATTACH_MIMES.has(req.body.mime)) {
      throw new AppError('VALIDATION_ERROR', 'Unsupported file type', 422);
    }
    if (!env.S3_BUCKET_CHAT) throw new AppError('CONFIG_ERROR', 'S3 bucket not configured', 500);
    const key = `chat/${req.user.id}/${nanoid(10)}-${req.body.name}`;
    const cmd = new PutObjectCommand({
      Bucket: env.S3_BUCKET_CHAT,
      Key: key,
      ContentType: req.body.mime,
    });
    const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 300 });
    res.json({ success: true, data: { uploadUrl, key, expiresIn: 300 } });
  }),
);

// GET /api/chat/attachment-url?key=chat/...  → presigned GET URL for private S3 objects
r.get('/attachment-url',
  roleGuard(['user', 'pm', 'admin']),
  asyncHandler(async (req, res) => {
    const key = req.query.key;
    if (!key || !String(key).startsWith('chat/')) {
      throw new AppError('VALIDATION_ERROR', 'Invalid attachment key', 400);
    }
    if (!env.S3_BUCKET_CHAT) throw new AppError('CONFIG_ERROR', 'S3 bucket not configured', 500);
    const cmd = new GetObjectCommand({ Bucket: env.S3_BUCKET_CHAT, Key: key });
    const url = await getSignedUrl(s3, cmd, { expiresIn: 3600 });
    res.json({ success: true, data: { url, expiresIn: 3600 } });
  }),
);

export default r;
