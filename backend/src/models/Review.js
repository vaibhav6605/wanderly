import mongoose from 'mongoose'
import { Tour } from './Tour.js'

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

// Recomputes Tour.avgRating/ratingsCount from the Review collection itself —
// this is the write-side cost of keeping that denormalized read-side cache
// correct. Called from every hook below instead of duplicating the
// aggregation in each one.
reviewSchema.statics.syncTourRatings = async function syncTourRatings(tourId) {
  const [stats] = await this.aggregate([
    { $match: { tour: tourId } },
    { $group: { _id: '$tour', avgRating: { $avg: '$rating' }, ratingsCount: { $sum: 1 } } },
  ])

  await Tour.findByIdAndUpdate(tourId, {
    avgRating: stats ? Math.round(stats.avgRating * 10) / 10 : 0,
    ratingsCount: stats ? stats.ratingsCount : 0,
  })
}

// Covers both create and any edit made via `review.save()`. Zero declared
// params + returning the promise, not an async function with a `next`
// callback — see the Mongoose 9 hook-arity note on User.hashPassword.
reviewSchema.post('save', function syncRatingsOnSave() {
  return this.constructor.syncTourRatings(this.tour)
})

// Covers `review.deleteOne()` (document middleware: `this` is the review
// being deleted, not a query, so its `tour` field is still available here).
reviewSchema.post('deleteOne', { document: true, query: false }, function syncRatingsOnDocDelete() {
  return this.constructor.syncTourRatings(this.tour)
})

// Covers `Review.findByIdAndDelete()` / `findOneAndDelete()` and
// `findByIdAndUpdate()` / `findOneAndUpdate()` (query middleware: `this` is
// the Query, which only knows the filter — not which document it matched —
// so the affected review has to be looked up before the query runs and
// before it potentially disappears).
reviewSchema.pre(
  ['findOneAndDelete', 'findOneAndUpdate'],
  async function captureReviewBeforeChange() {
    this._reviewBeforeChange = await this.model.findOne(this.getQuery())
  },
)

reviewSchema.post(
  ['findOneAndDelete', 'findOneAndUpdate'],
  async function syncRatingsAfterQueryChange() {
    if (this._reviewBeforeChange) {
      await this.model.syncTourRatings(this._reviewBeforeChange.tour)
    }
  },
)

// Not handled: deleteMany/updateMany. Those can touch reviews across many
// different tours in one call, which needs a different approach (collect
// distinct tour ids from the matched set, then sync each) — left until a
// real bulk-delete use case (e.g. cascading a Tour deletion) exists.

export const Review = mongoose.model('Review', reviewSchema)
