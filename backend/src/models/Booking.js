import mongoose from 'mongoose'

const { Schema } = mongoose

const travelerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 0, max: 120 },
    passportNumber: { type: String, trim: true, default: null },
  },
  { _id: false },
)

const bookingSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tour: { type: Schema.Types.ObjectId, ref: 'Tour', required: true },
    // Points at the specific subdocument in Tour.startDates (operational —
    // used to release/reserve seats atomically). No `ref` here: `ref` only
    // resolves top-level collections, not another document's subarray.
    tourStartDateId: { type: Schema.Types.ObjectId, required: true },
    // Snapshotted alongside it so this booking still reads correctly even
    // if that departure is later edited or removed from the tour.
    tourStartDate: { type: Date, required: true },
    travelers: {
      adults: { type: Number, required: true, min: 1 },
      children: { type: Number, default: 0, min: 0 },
    },
    travelerDetails: { type: [travelerSchema], default: [] },
    // Snapshotted at booking time — never recompute from the tour's
    // current price; prices change, past invoices must not.
    totalAmount: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    currency: { type: String, required: true },
    coupon: { type: Schema.Types.ObjectId, ref: 'Coupon', default: null },
    status: {
      type: String,
      enum: ['pending_payment', 'confirmed', 'cancelled', 'completed', 'refunded'],
      default: 'pending_payment',
    },
    payment: { type: Schema.Types.ObjectId, ref: 'Payment', default: null },
    cancellationReason: { type: String, default: null },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
)

bookingSchema.index({ user: 1, status: 1 })
bookingSchema.index({ tour: 1, tourStartDate: 1 })
// Backs the cron job that releases expired pending_payment holds.
bookingSchema.index({ status: 1, createdAt: 1 })

export const Booking = mongoose.model('Booking', bookingSchema)
