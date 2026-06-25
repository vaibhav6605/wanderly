import mongoose from 'mongoose'

const { Schema } = mongoose

const refundSchema = new Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    reason: { type: String, trim: true, default: null },
    stripeRefundId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
)

const paymentSchema = new Schema(
  {
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    // Denormalized off Booking so "my payment history" filters by user
    // directly instead of populating through bookings first.
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true },
    // Stripe's own idempotency key — doubles as our dedup guard against
    // the same webhook event being delivered (and processed) twice.
    stripePaymentIntentId: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: [
        'requires_payment',
        'processing',
        'succeeded',
        'failed',
        'refunded',
        'partially_refunded',
      ],
      default: 'requires_payment',
    },
    paymentMethod: { type: String, default: null },
    failureReason: { type: String, default: null },
    refunds: { type: [refundSchema], default: [] },
  },
  { timestamps: true, versionKey: false },
)

paymentSchema.index({ user: 1, status: 1 })

export const Payment = mongoose.model('Payment', paymentSchema)
