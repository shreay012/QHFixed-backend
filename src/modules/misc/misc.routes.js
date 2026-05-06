import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { validate } from '../../middleware/validate.middleware.js';
import { getDb } from '../../config/db.js';

const r = Router();

// FE sends: { name, email, phone_number, organization, description }
// We accept that and a few legacy aliases (mobile, message, subject) for safety.
const contactSchema = z
  .object({
    name: z.string().min(2),
    email: z.string().email(),
    phone_number: z.string().regex(/^\+?[\d\s\-()+]{6,20}$/).optional(),
    mobile: z.string().regex(/^\+?[\d\s\-()+]{6,20}$/).optional(),
    organization: z.string().max(200).optional().default(''),
    subject: z.string().max(200).optional().default(''),
    description: z.string().min(2).max(5000).optional(),
    message: z.string().min(2).max(5000).optional(),
  })
  .refine((d) => d.description || d.message, { message: 'description required', path: ['description'] });

// Public
r.post('/contact-us', validate(contactSchema), asyncHandler(async (req, res) => {
  await getDb().collection('contact_submissions').insertOne({
    ...req.body, createdAt: new Date(),
  });
  res.json({ success: true, message: 'Thanks, we will get back to you.' });
}));

export default r;
