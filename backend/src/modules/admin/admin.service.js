import mongoose from 'mongoose'
import { User } from '#models/User.js'
import { Tour } from '#models/Tour.js'
import { Booking } from '#models/Booking.js'
import { Payment } from '#models/Payment.js'
import { Review } from '#models/Review.js'

export async function getOverview() {
  const [
    totalUsers,
    totalTours,
    bookingAgg,
    revenueAgg,
    recentBookings,
    totalReviews,
  ] = await Promise.all([
    User.countDocuments({ isBanned: false }),
    Tour.countDocuments({ isActive: true }),
    Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Payment.aggregate([
      { $match: { status: 'succeeded' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Booking.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('user', 'name email')
      .populate('tour', 'title images'),
    Review.countDocuments(),
  ])

  const totalRevenue = revenueAgg[0]?.total ?? 0
  const bookingsByStatus = Object.fromEntries(bookingAgg.map((s) => [s._id, s.count]))
  const totalBookings = bookingAgg.reduce((n, s) => n + s.count, 0)

  return {
    totalUsers,
    totalTours,
    totalBookings,
    totalRevenue,
    totalReviews,
    bookingsByStatus,
    recentBookings,
  }
}

export async function getTrends({ days = 30 }) {
  const since = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000)
  since.setHours(0, 0, 0, 0)

  const [revenueDays, bookingDays] = await Promise.all([
    Payment.aggregate([
      { $match: { status: 'succeeded', createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Booking.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          bookings: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ])

  // Merge by date key
  const map = {}
  for (const r of revenueDays) map[r._id] = { ...map[r._id], revenue: r.revenue }
  for (const b of bookingDays) map[b._id] = { ...map[b._id], bookings: b.bookings }

  const trends = []
  for (let i = 0; i < days; i++) {
    const d = new Date(since)
    d.setDate(d.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    trends.push({ date: key, revenue: map[key]?.revenue ?? 0, bookings: map[key]?.bookings ?? 0 })
  }

  return trends
}

export async function getTopTours({ limit = 5 }) {
  const results = await Booking.aggregate([
    { $match: { status: { $in: ['confirmed', 'completed'] } } },
    {
      $group: {
        _id: '$tour',
        bookings: { $sum: 1 },
        revenue: { $sum: '$totalAmount' },
      },
    },
    { $sort: { bookings: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'tours',
        localField: '_id',
        foreignField: '_id',
        as: 'tour',
      },
    },
    { $unwind: '$tour' },
    {
      $project: {
        _id: 0,
        tourId: '$_id',
        title: '$tour.title',
        cover: { $arrayElemAt: ['$tour.images.url', 0] },
        bookings: 1,
        revenue: 1,
      },
    },
  ])

  return results
}
