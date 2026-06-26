import Stripe from 'stripe'
import { env } from '#config/env.js'
import { Booking } from '#models/Booking.js'
import { Payment } from '#models/Payment.js'
import { Tour } from '#models/Tour.js'
import { Coupon } from '#models/Coupon.js'
import { ApiError } from '#utils/ApiError.js'

// Lazily initialized so the module loads even if STRIPE_SECRET_KEY is absent
// (e.g. in tests or local dev without Stripe configured).
let _stripe = null
function getStripe() {
  if (!_stripe) {
    if (!env.stripe.secretKey) throw ApiError.internal('Stripe is not configured on this server')
    _stripe = new Stripe(env.stripe.secretKey)
  }
  return _stripe
}

// Stripe expects amounts in the smallest currency unit.
function toStripeAmount(amount) {
  return Math.round(amount * 100)
}

// Stripe currency codes must be lowercase.
const CURRENCY_MAP = { USD: 'usd', INR: 'inr', EUR: 'eur' }

const BOOKING_POPULATE = [
  { path: 'tour', select: 'title slug images currency price duration' },
  { path: 'coupon', select: 'code discountType discountValue' },
]

const PAYMENT_POPULATE = [
  { path: 'booking', populate: BOOKING_POPULATE },
]

// ── Create PaymentIntent ────────────────────────────────────────────────────

export async function createPaymentIntent(bookingId, userId) {
  const booking = await Booking.findById(bookingId).populate('tour', 'title').lean()
  if (!booking) throw ApiError.notFound('Booking not found')
  if (booking.user.toString() !== userId) throw ApiError.forbidden('Access denied')

  if (booking.status !== 'pending_payment') {
    throw ApiError.badRequest(
      `Cannot pay for a booking with status "${booking.status}"`,
    )
  }

  // Idempotency: return existing intent if one was already created
  const existing = await Payment.findOne({ booking: bookingId })
  if (existing) {
    const pi = await getStripe().paymentIntents.retrieve(existing.stripePaymentIntentId)
    if (pi.status === 'succeeded') {
      throw ApiError.badRequest('This booking has already been paid')
    }
    return { clientSecret: pi.client_secret }
  }

  const currency = CURRENCY_MAP[booking.currency] ?? 'usd'
  const amount = toStripeAmount(booking.totalAmount)

  const pi = await getStripe().paymentIntents.create({
    amount,
    currency,
    // Metadata lets the webhook look up which booking to confirm without an
    // extra DB query to find the Payment record first.
    metadata: { bookingId: booking._id.toString(), userId },
    description: `Wanderly – ${booking.tour?.title ?? bookingId}`,
    automatic_payment_methods: { enabled: true },
  })

  const payment = await Payment.create({
    booking: booking._id,
    user: userId,
    amount: booking.totalAmount,
    currency: booking.currency,
    stripePaymentIntentId: pi.id,
    status: 'requires_payment',
  })

  await Booking.findByIdAndUpdate(bookingId, { payment: payment._id })

  return { clientSecret: pi.client_secret }
}

// ── List payment history ────────────────────────────────────────────────────

export async function listPayments({ userId, isAdmin, status, page, limit }) {
  const filter = {}
  if (!isAdmin) filter.user = userId
  if (status) filter.status = status

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate(PAYMENT_POPULATE)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Payment.countDocuments(filter),
  ])

  return { payments, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
}

// ── Invoice ─────────────────────────────────────────────────────────────────

export async function getInvoice(bookingId, userId, isAdmin) {
  const booking = await Booking.findById(bookingId)
    .populate([
      { path: 'tour', select: 'title slug images duration category', populate: { path: 'category', select: 'name' } },
      { path: 'coupon', select: 'code discountType discountValue' },
      { path: 'payment', select: 'stripePaymentIntentId status paymentMethod createdAt' },
    ])
    .lean()

  if (!booking) throw ApiError.notFound('Booking not found')
  if (!isAdmin && booking.user.toString() !== userId) {
    throw ApiError.forbidden('Access denied')
  }

  const invoiceNumber = `WND-${new Date(booking.createdAt).getFullYear()}-${booking._id.toString().slice(-6).toUpperCase()}`
  const sym = { USD: '$', INR: '₹', EUR: '€' }[booking.currency] ?? '$'

  const lineItems = [
    {
      description: `Adult × ${booking.travelers.adults}`,
      unitPrice: booking.tour?.price ?? 0,
      quantity: booking.travelers.adults,
      total: (booking.tour?.price ?? 0) * booking.travelers.adults,
    },
  ]
  if (booking.travelers.children > 0) {
    lineItems.push({
      description: `Child × ${booking.travelers.children}`,
      unitPrice: booking.tour?.price ?? 0,
      quantity: booking.travelers.children,
      total: (booking.tour?.price ?? 0) * booking.travelers.children,
    })
  }

  return {
    invoiceNumber,
    issueDate: booking.createdAt,
    tour: booking.tour,
    departure: booking.tourStartDate,
    travelers: booking.travelers,
    travelerDetails: booking.travelerDetails ?? [],
    lineItems,
    subtotal: booking.baseAmount,
    discount: booking.discountAmount,
    tax: booking.taxAmount,
    total: booking.totalAmount,
    currency: booking.currency,
    currencySymbol: sym,
    coupon: booking.coupon,
    payment: booking.payment,
    bookingStatus: booking.status,
  }
}

// ── Refund ──────────────────────────────────────────────────────────────────

export async function createRefund(bookingId, refundAmount, reason) {
  const booking = await Booking.findById(bookingId)
  if (!booking) throw ApiError.notFound('Booking not found')

  const payment = await Payment.findOne({ booking: bookingId })
  if (!payment) throw ApiError.notFound('No payment found for this booking')
  if (payment.status !== 'succeeded') {
    throw ApiError.badRequest(`Cannot refund a payment with status "${payment.status}"`)
  }

  const stripe = getStripe()
  const amountToRefund = refundAmount != null
    ? toStripeAmount(refundAmount)
    : toStripeAmount(payment.amount)

  const refund = await stripe.refunds.create({
    payment_intent: payment.stripePaymentIntentId,
    amount: amountToRefund,
    reason: 'requested_by_customer',
    metadata: { bookingId: bookingId.toString(), reason: reason ?? '' },
  })

  const isPartial = amountToRefund < toStripeAmount(payment.amount)

  payment.refunds.push({
    amount: amountToRefund / 100,
    reason: reason ?? null,
    stripeRefundId: refund.id,
  })
  payment.status = isPartial ? 'partially_refunded' : 'refunded'
  await payment.save()

  // Update booking status and release seats if fully refunded
  booking.status = 'refunded'
  await booking.save()

  if (!isPartial) {
    const totalTravelers = booking.travelers.adults + booking.travelers.children
    await Tour.findOneAndUpdate(
      { _id: booking.tour, 'startDates._id': booking.tourStartDateId },
      { $inc: { 'startDates.$.availableSeats': totalTravelers } },
    )
    if (booking.coupon) {
      await Coupon.findByIdAndUpdate(booking.coupon, { $inc: { usedCount: -1 } })
    }
  }

  return { payment, refund }
}

// ── Webhook helpers (called from stripe.webhook.js) ─────────────────────────

export async function handlePaymentSucceeded(paymentIntent) {
  const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id })
  if (!payment) return // Unknown intent — ignore

  if (payment.status !== 'succeeded') {
    payment.status = 'succeeded'
    payment.paymentMethod = paymentIntent.payment_method?.toString() ?? null
    await payment.save()
  }

  const booking = await Booking.findById(payment.booking)
  if (booking && booking.status === 'pending_payment') {
    booking.status = 'confirmed'
    await booking.save()
  }
}

export async function handlePaymentFailed(paymentIntent) {
  const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntent.id })
  if (!payment) return

  payment.status = 'failed'
  payment.failureReason =
    paymentIntent.last_payment_error?.message ?? 'Payment failed'
  await payment.save()

  const booking = await Booking.findById(payment.booking)
  if (!booking || !['pending_payment', 'confirmed'].includes(booking.status)) return

  const totalTravelers = booking.travelers.adults + booking.travelers.children

  await Tour.findOneAndUpdate(
    { _id: booking.tour, 'startDates._id': booking.tourStartDateId },
    { $inc: { 'startDates.$.availableSeats': totalTravelers } },
  )

  booking.status = 'cancelled'
  booking.cancellationReason = 'Payment failed'
  booking.cancelledAt = new Date()
  await booking.save()

  if (booking.coupon) {
    await Coupon.findByIdAndUpdate(booking.coupon, { $inc: { usedCount: -1 } })
  }
}

export async function handleChargeRefunded(charge) {
  if (!charge.payment_intent) return

  const payment = await Payment.findOne({ stripePaymentIntentId: charge.payment_intent })
  if (!payment) return

  // Stripe fires charge.refunded AFTER our createRefund call has already
  // updated the record — only update if we haven't recorded it yet.
  const totalRefunded = charge.amount_refunded / 100
  const isFullRefund = charge.refunded

  if (isFullRefund && payment.status !== 'refunded') {
    payment.status = 'refunded'
    await payment.save()
  } else if (!isFullRefund && payment.status !== 'partially_refunded') {
    payment.status = 'partially_refunded'
    await payment.save()
  }
}
