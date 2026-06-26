import { z } from 'zod'

const NOTIFICATION_TYPES = [
  'booking_confirmed',
  'booking_cancelled',
  'payment_failed',
  'review_reminder',
  'coupon_offer',
  'tour_update',
  'system',
]

export const listNotificationsSchema = z.object({
  query: z.object({
    isRead: z
      .enum(['true', 'false'])
      .transform((v) => v === 'true')
      .optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  }),
})

export const notificationIdSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
})

export const sendNotificationSchema = z.object({
  body: z.object({
    userId: z.string().min(1),
    type: z.enum(NOTIFICATION_TYPES),
    title: z.string().trim().min(1).max(100),
    message: z.string().trim().min(1).max(500),
    relatedEntity: z
      .object({
        entityType: z.enum(['Booking', 'Tour', 'Payment', 'Coupon']),
        entityId: z.string().min(1),
      })
      .optional(),
  }),
})
