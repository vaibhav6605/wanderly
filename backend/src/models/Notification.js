import mongoose from 'mongoose'

const { Schema } = mongoose

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'booking_confirmed',
        'booking_cancelled',
        'payment_failed',
        'review_reminder',
        'coupon_offer',
        'tour_update',
        'system',
      ],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    // Polymorphic-ish pointer so a notification can deep-link to whatever
    // it's about without a separate optional ref field per entity type.
    relatedEntity: {
      entityType: { type: String, enum: ['Booking', 'Tour', 'Payment', 'Coupon'], default: null },
      entityId: { type: Schema.Types.ObjectId, default: null },
    },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date, default: null },
    // TTL index below auto-deletes once this passes — notifications are
    // disposable inbox items, not an audit trail.
    expiresAt: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  },
  { timestamps: true, versionKey: false },
)

notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 })
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const Notification = mongoose.model('Notification', notificationSchema)
