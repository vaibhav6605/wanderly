import { z } from 'zod'

export const listReviewsSchema = z.object({
  query: z.object({
    tourId: z.string().optional(),
    isApproved: z
      .enum(['true', 'false'])
      .transform((v) => v === 'true')
      .optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
  }),
})

export const myStatusSchema = z.object({
  query: z.object({ tourId: z.string().min(1) }),
})

export const reviewIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
})

export const approveReviewSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ isApproved: z.boolean() }),
})

export const createReviewSchema = z.object({
  body: z.object({
    tourId: z.string().min(1),
    bookingId: z.string().min(1),
    rating: z.coerce.number().int().min(1).max(5),
    title: z.string().trim().max(100).optional(),
    comment: z.string().trim().min(10).max(1000),
  }),
})

export const updateReviewSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    rating: z.coerce.number().int().min(1).max(5).optional(),
    title: z.string().trim().max(100).nullish(),
    comment: z.string().trim().min(10).max(1000).optional(),
  }),
})
