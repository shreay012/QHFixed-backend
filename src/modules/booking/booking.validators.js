import { z } from 'zod';

export const createBookingSchema = z.object({
  serviceId: z.string().regex(/^[0-9a-f]{24}$/),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  duration: z.number().int().min(1).max(720),
  requirements: z.string().max(5000).optional(),
  technologies: z.array(z.string().max(40)).max(20).optional(),
});

export const updateBookingSchema = z.object({
  requirements: z.string().max(5000).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  technologies: z.array(z.string()).optional(),
});

export const cancelSchema = z.object({
  reason: z.string().min(2).max(500),
});

export const extendSchema = z.object({
  additionalHours: z.number().int().min(1).max(720),
  newEndTime: z.string().datetime().optional(), // optional — backend can calculate if not provided
  hourlyRate: z.number().optional(),
  subtotal: z.number().optional(),
  gst: z.number().optional(),
  total: z.number().optional(),
});

export const transitionSchema = z.object({
  status: z.enum(['confirmed', 'assigned_to_pm', 'in_progress', 'completed', 'cancelled']),
  note: z.string().max(500).optional(),
});
