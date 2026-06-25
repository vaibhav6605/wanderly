import mongoose from 'mongoose'

const { Schema } = mongoose

const reviewSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tour: { type: Schema.Types.ObjectId, ref: 'Tour', required: true },
    // Unique on booking, not on (user, tour) — enforces "must have actually
    // completed THIS booking to review," not just "booked this tour once."
    booking: { type: Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 100, default: null },
    comment: { type: String, required: true, trim: true, maxlength: 1000 },
    images: { type: [{ url: String, publicId: String }], default: [] },
    isApproved: { type: Boolean, default: true },
    helpfulVotes: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, versionKey: false },
)

reviewSchema.index({ tour: 1, rating: -1 })
reviewSchema.index({ tour: 1, createdAt: -1 })

export const Review = mongoose.model('Review', reviewSchema)
