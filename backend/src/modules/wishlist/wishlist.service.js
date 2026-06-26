import { Wishlist } from '#models/Wishlist.js'
import { ApiError } from '#utils/ApiError.js'

export async function listWishlist(userId, { page = 1, limit = 12 } = {}) {
  const [items, totalCount] = await Promise.all([
    Wishlist.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({
        path: 'tour',
        select: 'title slug coverImage price duration avgRating ratingsCount difficulty destination',
      }),
    Wishlist.countDocuments({ user: userId }),
  ])

  return {
    items: items.map((w) => w.tour).filter(Boolean),
    meta: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) },
  }
}

export async function getWishlistIds(userId) {
  const items = await Wishlist.find({ user: userId }).select('tour').lean()
  return items.map((w) => w.tour.toString())
}

export async function addToWishlist(userId, tourId) {
  try {
    await Wishlist.create({ user: userId, tour: tourId })
  } catch (err) {
    if (err.code === 11000) throw ApiError.conflict('Tour already in wishlist')
    throw err
  }
}

export async function removeFromWishlist(userId, tourId) {
  const result = await Wishlist.deleteOne({ user: userId, tour: tourId })
  if (result.deletedCount === 0) throw ApiError.notFound('Tour not in wishlist')
}
