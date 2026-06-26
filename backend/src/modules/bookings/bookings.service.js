import { Tour } from '#models/Tour.js'
import { Booking } from '#models/Booking.js'
import { Coupon } from '#models/Coupon.js'
import { ApiError } from '#utils/ApiError.js'

const TAX_RATE = 0.10 // 10 %

const BOOKING_POPULATE = [
  { path: 'tour', select: 'title slug images currency price duration' },
  { path: 'coupon', select: 'code discountType discountValue' },
]

// ── Helpers ────────────────────────────────────────────────────────────────

function round2(n) {
  return Math.round(n * 100) / 100
}

function computeDiscount(coupon, base) {
  let discount =
    coupon.discountType === 'percentage'
      ? (base * coupon.discountValue) / 100
      : coupon.discountValue

  if (coupon.maxDiscountAmount !== null) {
    discount = Math.min(discount, coupon.maxDiscountAmount)
  }
  return round2(Math.min(discount, base))
}

// ── Coupon validation (shared by validate-coupon endpoint & createBooking) ──

export async function validateCoupon({ code, tourId, baseAmount, userId }) {
  const now = new Date()

  const coupon = await Coupon.findOne({
    code: code.toUpperCase(),
    isActive: true,
    validFrom: { $lte: now },
    validUntil: { $gte: now },
  })

  if (!coupon) throw ApiError.notFound('Coupon not found or expired')

  // Global usage cap
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    throw ApiError.conflict('This coupon has reached its usage limit')
  }

  // Per-user cap (query bookings — avoids an unbounded usedBy array)
  if (userId) {
    const userUsageCount = await Booking.countDocuments({
      user: userId,
      coupon: coupon._id,
      status: { $in: ['pending_payment', 'confirmed', 'completed'] },
    })
    if (userUsageCount >= coupon.usageLimitPerUser) {
      throw ApiError.conflict('You have already used this coupon the maximum number of times')
    }
  }

  // Minimum booking amount
  if (baseAmount < coupon.minBookingAmount) {
    throw ApiError.badRequest(
      `This coupon requires a minimum booking amount of ${coupon.minBookingAmount}`,
    )
  }

  // Tour allowlist
  if (coupon.applicableTours.length > 0) {
    const tourAllowed = coupon.applicableTours.some((id) => id.toString() === tourId)
    if (!tourAllowed) throw ApiError.badRequest('This coupon is not valid for this tour')
  }

  // Category allowlist
  if (coupon.applicableCategories.length > 0) {
    const tour = await Tour.findById(tourId).select('category').lean()
    const catAllowed =
      tour &&
      coupon.applicableCategories.some((id) => id.toString() === tour.category?.toString())
    if (!catAllowed) throw ApiError.badRequest('This coupon is not valid for this tour category')
  }

  const discountAmount = computeDiscount(coupon, baseAmount)
  return { coupon, discountAmount }
}

// ── Create booking ─────────────────────────────────────────────────────────

export async function createBooking({
  userId,
  tourId,
  tourStartDateId,
  travelers,
  travelerDetails,
  couponCode,
}) {
  const totalTravelers = travelers.adults + (travelers.children ?? 0)

  // 1. Load tour (need price, currency, startDates)
  const tour = await Tour.findById(tourId)
  if (!tour || !tour.isActive) throw ApiError.notFound('Tour not found')

  // 2. Find the requested start date subdocument
  const startDate = tour.startDates.id(tourStartDateId)
  if (!startDate) throw ApiError.notFound('Departure date not found on this tour')
  if (startDate.isCancelled) throw ApiError.badRequest('This departure date has been cancelled')

  // 3. Seat availability (optimistic check — the atomic update is the real guard)
  if (startDate.availableSeats < totalTravelers) {
    throw ApiError.conflict(
      `Only ${startDate.availableSeats} seat(s) remaining for this departure`,
    )
  }

  // 4. Prevent double booking
  const duplicate = await Booking.findOne({
    user: userId,
    tour: tourId,
    tourStartDateId,
    status: { $in: ['pending_payment', 'confirmed'] },
  })
  if (duplicate) {
    throw ApiError.conflict('You already have an active booking for this tour on this date')
  }

  // 5. Price calculation
  const baseAmount = round2(tour.price * totalTravelers)
  let discountAmount = 0
  let couponDoc = null

  if (couponCode) {
    const result = await validateCoupon({ code: couponCode, tourId, baseAmount, userId })
    discountAmount = result.discountAmount
    couponDoc = result.coupon
  }

  const taxable = round2(baseAmount - discountAmount)
  const taxAmount = round2(taxable * TAX_RATE)
  const totalAmount = round2(taxable + taxAmount)

  // 6. Atomic seat reservation — this is the definitive check against races.
  //    The query condition ensures we only decrement if seats are still available.
  const updated = await Tour.findOneAndUpdate(
    {
      _id: tourId,
      'startDates._id': tourStartDateId,
      'startDates.availableSeats': { $gte: totalTravelers },
      'startDates.isCancelled': false,
    },
    { $inc: { 'startDates.$.availableSeats': -totalTravelers } },
    { new: true },
  )

  if (!updated) {
    // Another request won the race — seats no longer sufficient
    throw ApiError.conflict(
      'Seats are no longer available for this departure. Please select another date.',
    )
  }

  // 7. Persist booking
  const booking = await Booking.create({
    user: userId,
    tour: tourId,
    tourStartDateId,
    tourStartDate: startDate.date,
    travelers,
    travelerDetails,
    baseAmount,
    discountAmount,
    taxAmount,
    totalAmount,
    currency: tour.currency,
    coupon: couponDoc?._id ?? null,
    status: 'pending_payment',
  })

  // 8. Increment coupon global usage counter
  if (couponDoc) {
    await Coupon.findByIdAndUpdate(couponDoc._id, { $inc: { usedCount: 1 } })
  }

  await booking.populate(BOOKING_POPULATE)
  return booking
}

// ── List bookings ──────────────────────────────────────────────────────────

export async function listBookings({ userId, isAdmin, status, page, limit }) {
  const filter = {}
  if (!isAdmin) filter.user = userId
  if (status) filter.status = status

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate(BOOKING_POPULATE)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Booking.countDocuments(filter),
  ])

  return {
    bookings,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
}

// ── Get single booking ─────────────────────────────────────────────────────

export async function getBooking(id, userId, isAdmin) {
  const booking = await Booking.findById(id).populate(BOOKING_POPULATE).lean()
  if (!booking) throw ApiError.notFound('Booking not found')

  if (!isAdmin && booking.user.toString() !== userId) {
    throw ApiError.forbidden('You do not have access to this booking')
  }

  return booking
}

// ── Cancel booking ─────────────────────────────────────────────────────────

export async function cancelBooking(id, userId, isAdmin, reason) {
  const booking = await Booking.findById(id)
  if (!booking) throw ApiError.notFound('Booking not found')

  if (!isAdmin && booking.user.toString() !== userId) {
    throw ApiError.forbidden('You do not have access to this booking')
  }

  const cancellable = ['pending_payment', 'confirmed']
  if (!cancellable.includes(booking.status)) {
    throw ApiError.badRequest(`Cannot cancel a booking with status "${booking.status}"`)
  }

  const totalTravelers = booking.travelers.adults + booking.travelers.children

  // Release seats back to the departure
  await Tour.findOneAndUpdate(
    { _id: booking.tour, 'startDates._id': booking.tourStartDateId },
    { $inc: { 'startDates.$.availableSeats': totalTravelers } },
  )

  booking.status = 'cancelled'
  booking.cancellationReason = reason ?? null
  booking.cancelledAt = new Date()
  await booking.save()

  // Decrement coupon counter so the slot opens up for other users
  if (booking.coupon) {
    await Coupon.findByIdAndUpdate(booking.coupon, { $inc: { usedCount: -1 } })
  }

  await booking.populate(BOOKING_POPULATE)
  return booking
}
