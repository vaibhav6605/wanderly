import mongoose from 'mongoose'
import slugify from 'slugify'

const { Schema } = mongoose

// Day-by-day plan: positional and only ever read as part of its parent
// Tour, so subdocuments don't need their own _id.
const itinerarySchema = new Schema(
  {
    day: { type: Number, required: true, min: 1 },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: null },
  },
  { _id: false },
)

// Each scheduled departure DOES keep its auto _id — Booking references it
// directly (see Booking.tourStartDateId) to atomically decrement seats.
const startDateSchema = new Schema({
  date: { type: Date, required: true },
  availableSeats: { type: Number, required: true, min: 0 },
  isCancelled: { type: Boolean, default: false },
})

const tourSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, unique: true, lowercase: true },
    summary: { type: String, required: true, maxlength: 300 },
    description: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    destinations: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Destination' }],
      validate: {
        validator: (arr) => arr.length > 0,
        message: 'A tour must have at least one destination',
      },
    },
    duration: {
      days: { type: Number, required: true, min: 1 },
      nights: { type: Number, required: true, min: 0 },
    },
    // Stored in the smallest currency unit (e.g. cents) — money as a JS
    // float invites rounding bugs the moment you apply a coupon or refund.
    price: { type: Number, required: true, min: 0 },
    discountPrice: {
      type: Number,
      min: 0,
      default: null,
      validate: {
        validator: function (value) {
          return value == null || value < this.price
        },
        message: 'discountPrice must be less than price',
      },
    },
    currency: { type: String, enum: ['USD', 'INR', 'EUR'], default: 'USD' },
    maxGroupSize: { type: Number, required: true, min: 1 },
    difficulty: {
      type: String,
      enum: ['easy', 'moderate', 'challenging', 'difficult'],
      default: 'easy',
    },
    images: {
      type: [{ url: String, publicId: String, order: Number }],
      default: [],
    },
    itinerary: { type: [itinerarySchema], default: [] },
    inclusions: { type: [String], default: [] },
    exclusions: { type: [String], default: [] },
    startDates: { type: [startDateSchema], default: [] },
    // Denormalized aggregates kept in sync by Review hooks — every tour
    // card render needs these, so recomputing via aggregation on each
    // request would trade a write-time cost for a much more frequent
    // read-time one.
    avgRating: { type: Number, default: 0, min: 0, max: 5 },
    ratingsCount: { type: Number, default: 0, min: 0 },
    bookingsCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, versionKey: false },
)

// No `next` param: zero declared arguments tells Mongoose 9 this hook is
// synchronous, so it runs to completion without a callback.
tourSchema.pre('validate', function setSlug() {
  if (!this.slug && this.title) {
    this.slug = slugify(this.title, { lower: true, strict: true })
  }
})

tourSchema.index({ category: 1, price: 1 })
tourSchema.index({ destinations: 1 })
tourSchema.index({ avgRating: -1 })
tourSchema.index({ isActive: 1 })
tourSchema.index({ title: 'text', summary: 'text', description: 'text' })

export const Tour = mongoose.model('Tour', tourSchema)
