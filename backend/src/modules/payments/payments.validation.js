import { z } from 'zod'

export const createIntentSchema = z.object({
  body: z.object({
    bookingId: z.string().min(1),
  }),
})

export const refundSchema = z.object({
  params: z.object({ bookingId: z.string().min(1) }),
  body: z.object({
    amount: z.coerce.number().positive().optional(),
    reason: z.string().trim().max(500).optional(),
  }),
})

export const listPaymentsSchema = z.object({
  query: z.object({
    status: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  }),
})

export const bookingParamSchema = z.object({
  params: z.object({ bookingId: z.string().min(1) }),
})
