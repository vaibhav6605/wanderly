import { z } from 'zod'

const couponBody = z.object({
  code: z.string().trim().toUpperCase().min(3).max(30),
  description: z.string().trim().max(200).optional(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.coerce.number().min(0),
  maxDiscountAmount: z.coerce.number().min(0).nullish(),
  minBookingAmount: z.coerce.number().min(0).default(0),
  applicableTours: z.array(z.string()).default([]),
  applicableCategories: z.array(z.string()).default([]),
  usageLimit: z.coerce.number().int().min(1).nullish(),
  usageLimitPerUser: z.coerce.number().int().min(1).default(1),
  validFrom: z.coerce.date(),
  validUntil: z.coerce.date(),
  isActive: z.boolean().default(true),
})

export const createCouponSchema = z.object({ body: couponBody })

export const updateCouponSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: couponBody.partial(),
})

export const couponIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
})

export const listCouponsSchema = z.object({
  query: z.object({
    isActive: z
      .enum(['true', 'false'])
      .transform((v) => v === 'true')
      .optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  }),
})
