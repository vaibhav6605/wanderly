import mongoose from 'mongoose'
import { Review } from '#models/Review.js'
import { Booking } from '#models/Booking.js'
import { ApiError } from '#utils/ApiError.js'

export async function listReviews({ isAdmin = false, tourId, isApproved, page = 1, limit = 12 }) {
  const filter = {}
  if (tourId) filter.tour = new mongoose.Types.ObjectId(tourId)
  if (!isAdmin) {
    filter.isApproved = true
  } else if (isApproved !== undefined) {
    filter.isApproved = isApproved
  }

  const [reviews, totalCount, distributionAgg] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('user', 'name avatar')
      .populate('tour', 'title slug'),
    Review.countDocuments(filter),
    tourId
      ? Review.aggregate([
          { $match: { tour: new mongoose.Types.ObjectId(tourId), isApproved: true } },
          { $group: { _id: '$rating', count: { $sum: 1 } } },
        ])
      : Promise.resolve([]),
  ])

  const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  for (const { _id, count } of distributionAgg) ratingDistribution[_id] = count

  return {
    reviews,
    meta: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit) },
    ratingDistribution,
  }
}

export async function getMyStatus(userId, tourId) {
  const [myReview, eligibleBookings] = await Promise.all([
    Review.findOne({ user: userId, tour: tourId }),
    Booking.find({ user: userId, tour: tourId, status: { $in: ['confirmed', 'completed'] } }).select(
      '_id tourStartDate status',
    ),
  ])

  // Exclude booking already linked to existing review
  const usedId = myReview?.booking?.toString()
  const available = eligibleBookings.filter((b) => b._id.toString() !== usedId)

  return {
    myReview: myReview
      ? await myReview.populate('user', 'name avatar')
      : null,
    canReview: available.length > 0,
    eligibleBookingId: available[0]?._id ?? null,
  }
}

export async function createReview({ userId, tourId, bookingId, rating, title, comment }) {
  const booking = await Booking.findById(bookingId)
  if (!booking) throw ApiError.notFound('Booking not found')
  if (booking.user.toString() !== userId) throw ApiError.forbidden('Not your booking')
  if (booking.tour.toString() !== tourId) throw ApiError.badRequest('Booking does not match tour')
  if (!['confirmed', 'completed'].includes(booking.status)) {
    throw ApiError.badRequest('You can only review a confirmed or completed booking')
  }

  const existing = await Review.findOne({ booking: bookingId })
  if (existing) throw ApiError.conflict('You have already reviewed this booking')

  const review = await Review.create({ user: userId, tour: tourId, booking: bookingId, rating, title, comment })
  return review.populate('user', 'name avatar')
}

export async function updateReview(id, userId, isAdmin, { rating, title, comment }) {
  const review = await Review.findById(id)
  if (!review) throw ApiError.notFound('Review not found')
  if (!isAdmin && review.user.toString() !== userId) {
    throw ApiError.forbidden('You can only edit your own review')
  }

  if (rating !== undefined) review.rating = rating
  if (title !== undefined) review.title = title ?? null
  if (comment !== undefined) review.comment = comment

  await review.save()
  return Review.findById(review._id).populate('user', 'name avatar').populate('tour', 'title slug')
}

export async function approveReview(id, isApproved) {
  const review = await Review.findByIdAndUpdate(id, { isApproved }, { new: true })
    .populate('user', 'name avatar')
    .populate('tour', 'title slug')
  if (!review) throw ApiError.notFound('Review not found')
  return review
}

export async function deleteReview(id, userId, isAdmin) {
  const review = await Review.findById(id)
  if (!review) throw ApiError.notFound('Review not found')
  if (!isAdmin && review.user.toString() !== userId) {
    throw ApiError.forbidden('You can only delete your own review')
  }
  await review.deleteOne()
}
