import { z } from 'zod'

const travelerDetailSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  age: z.coerce.number().int().min(0).max(120),
  passportNumber: z.string().trim().nullable().optional(),
})

export const createBookingSchema = z.object({
  body: z.object({
    tourId: z.string().min(1),
    tourStartDateId: z.string().min(1),
    travelers: z.object({
      adults: z.coerce.number().int().min(1),
      children: z.coerce.number().int().min(0).default(0),
    }),
    travelerDetails: z.array(travelerDetailSchema).default([]),
    couponCode: z.string().trim().toUpperCase().optional(),
  }),
})

export const cancelBookingSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    reason: z.string().trim().max(500).optional(),
  }),
})

export const validateCouponSchema = z.object({
  body: z.object({
    code: z.string().trim().toUpperCase().min(1),
    tourId: z.string().min(1),
    baseAmount: z.coerce.number().min(0),
  }),
})

export const listBookingsSchema = z.object({
  query: z.object({
    status: z.enum(['pending_payment', 'confirmed', 'cancelled', 'completed', 'refunded']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  }),
})

export const bookingIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
})
