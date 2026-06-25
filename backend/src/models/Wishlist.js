import mongoose from 'mongoose'

const { Schema } = mongoose

const wishlistSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tour: { type: Schema.Types.ObjectId, ref: 'Tour', required: true },
  },
  { timestamps: true, versionKey: false },
)

// One document per (user, tour) pair rather than an array on User — keeps
// User's document small and bounded, and makes add/remove/exists-check a
// single indexed lookup instead of an array mutation on a growing document.
wishlistSchema.index({ user: 1, tour: 1 }, { unique: true })

export const Wishlist = mongoose.model('Wishlist', wishlistSchema)
