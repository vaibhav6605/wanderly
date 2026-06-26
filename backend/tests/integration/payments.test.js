// jest.mock is hoisted before imports — must be at module top level.
// This replaces the real Stripe SDK with a lightweight in-memory double so
// tests never touch the Stripe API and don't need a STRIPE_SECRET_KEY that
// works. The fake key in tests/setup/env.js satisfies the "is configured?"
// guard in payments.service.js before the mock constructor is called.
jest.mock('stripe', () => {
  const intent = { id: 'pi_test_123', client_secret: 'pi_test_123_secret_test' }
  const mockCreate = jest.fn().mockResolvedValue(intent)
  const mockRetrieve = jest.fn().mockResolvedValue({ ...intent, status: 'requires_payment_method' })
  const mockRefundCreate = jest.fn().mockResolvedValue({ id: 're_test_123' })

  return jest.fn(() => ({
    paymentIntents: { create: mockCreate, retrieve: mockRetrieve },
    refunds: { create: mockRefundCreate },
  }))
})

import request from 'supertest'
import { app } from '../../src/app.js'
import { connectTestDB, clearTestDB, disconnectTestDB } from '../setup/db.js'
import { User } from '../../src/models/User.js'
import { Tour } from '../../src/models/Tour.js'
import { Category } from '../../src/models/Category.js'
import { Destination } from '../../src/models/Destination.js'
import { Booking } from '../../src/models/Booking.js'
import { Payment } from '../../src/models/Payment.js'

const AUTH = '/api/v1/auth'
const PAYMENTS = '/api/v1/payments'
const BOOKINGS = '/api/v1/bookings'

beforeAll(async () => {
  await connectTestDB()
  await Promise.all([User.init(), Tour.init(), Booking.init(), Payment.init(), Category.init()])
}, 60_000)

afterEach(clearTestDB)
afterAll(disconnectTestDB)

// ── Seed helpers ─────────────────────────────────────────────────────────────

async function createAdminAndLogin() {
  const email = 'admin@wanderly.test'
  const password = 'adminpassword123'
  await User.create({ name: 'Admin', email, password, role: 'admin', isEmailVerified: true })
  const res = await request(app).post(`${AUTH}/login`).send({ email, password })
  const user = await User.findOne({ email })
  return { accessToken: res.body.data.accessToken, userId: user._id }
}

async function registerAndLogin(overrides = {}) {
  const creds = { name: 'Payer', email: 'payer@example.com', password: 'payerpass123', ...overrides }
  const res = await request(app).post(`${AUTH}/register`).send(creds)
  const user = await User.findOne({ email: creds.email })
  return { accessToken: res.body.data.accessToken, userId: user._id }
}

async function seedTourWithDeps(createdBy) {
  const [category, destination] = await Promise.all([
    Category.create({ name: 'Scenic' }),
    Destination.create({ name: 'Santorini', country: 'Greece' }),
  ])
  return Tour.create({
    title: 'Santorini Sunrise',
    summary: 'Watch sunrise over the caldera from the rim of the volcano.',
    description: 'Three-day island escape featuring sunrise hikes and catamaran cruises.',
    category: category._id,
    destinations: [destination._id],
    duration: { days: 3, nights: 2 },
    price: 600,
    maxGroupSize: 10,
    createdBy,
    isActive: true,
    startDates: [{ date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), availableSeats: 10 }],
  })
}

// Create a booking in pending_payment state via the API so seat-reservation
// side-effects (atomic decrement) are tested as part of real flow.
async function createPendingBooking(userToken, tour) {
  const startDateId = tour.startDates[0]._id
  const res = await request(app)
    .post(BOOKINGS)
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      tourId: tour._id.toString(),
      tourStartDateId: startDateId.toString(),
      travelers: { adults: 1 },
      travelerDetails: [{ name: 'Traveler', age: 30 }],
    })
  return res.body.data.booking
}

// Directly seed a Payment + update the Booking status to 'confirmed' so that
// refund tests don't need to go through a real Stripe webhook.
async function seedConfirmedPayment(booking, userId) {
  const payment = await Payment.create({
    booking: booking._id,
    user: userId,
    amount: booking.totalAmount,
    currency: booking.currency,
    stripePaymentIntentId: 'pi_existing_test',
    status: 'succeeded',
  })
  await Booking.findByIdAndUpdate(booking._id, { payment: payment._id, status: 'confirmed' })
  return payment
}

// ── POST /api/v1/payments/create-intent ──────────────────────────────────────

describe('POST /payments/create-intent', () => {
  it('requires authentication', async () => {
    const res = await request(app).post(`${PAYMENTS}/create-intent`).send({ bookingId: '000000000000000000000001' })
    expect(res.status).toBe(401)
  })

  it('returns 404 when the booking does not exist', async () => {
    const { accessToken } = await registerAndLogin()

    const res = await request(app)
      .post(`${PAYMENTS}/create-intent`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ bookingId: '000000000000000000000001' })

    expect(res.status).toBe(404)
  })

  it('returns 403 when the booking belongs to a different user', async () => {
    const { accessToken: ownerToken, userId: ownerId } = await registerAndLogin()
    const { accessToken: intruderToken } = await registerAndLogin({ email: 'intruder@example.com' })
    const { userId: adminId } = await createAdminAndLogin()
    const tour = await seedTourWithDeps(adminId)
    const booking = await createPendingBooking(ownerToken, tour)

    const res = await request(app)
      .post(`${PAYMENTS}/create-intent`)
      .set('Authorization', `Bearer ${intruderToken}`)
      .send({ bookingId: booking._id })

    expect(res.status).toBe(403)
  })

  it('returns 400 when the booking is not in pending_payment status', async () => {
    const { accessToken, userId } = await registerAndLogin()
    const { userId: adminId } = await createAdminAndLogin()
    const tour = await seedTourWithDeps(adminId)
    const booking = await createPendingBooking(accessToken, tour)
    await Booking.findByIdAndUpdate(booking._id, { status: 'confirmed' })

    const res = await request(app)
      .post(`${PAYMENTS}/create-intent`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ bookingId: booking._id })

    expect(res.status).toBe(400)
  })

  it('calls Stripe and returns a clientSecret for a valid pending booking', async () => {
    const { accessToken } = await registerAndLogin()
    const { userId: adminId } = await createAdminAndLogin()
    const tour = await seedTourWithDeps(adminId)
    const booking = await createPendingBooking(accessToken, tour)

    const res = await request(app)
      .post(`${PAYMENTS}/create-intent`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ bookingId: booking._id })

    expect(res.status).toBe(200)
    expect(res.body.data.clientSecret).toBe('pi_test_123_secret_test')

    // A Payment record must have been created for the booking
    const payment = await Payment.findOne({ booking: booking._id })
    expect(payment).not.toBeNull()
    expect(payment.stripePaymentIntentId).toBe('pi_test_123')
    expect(payment.status).toBe('requires_payment')
  })

  it('is idempotent — returns the same intent on a second call', async () => {
    const { accessToken } = await registerAndLogin()
    const { userId: adminId } = await createAdminAndLogin()
    const tour = await seedTourWithDeps(adminId)
    const booking = await createPendingBooking(accessToken, tour)

    // First call creates the intent
    await request(app)
      .post(`${PAYMENTS}/create-intent`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ bookingId: booking._id })

    // Second call must return the same secret from the existing Payment record
    const res = await request(app)
      .post(`${PAYMENTS}/create-intent`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ bookingId: booking._id })

    expect(res.status).toBe(200)
    expect(res.body.data.clientSecret).toBeTruthy()

    // Only one Payment record should exist
    const count = await Payment.countDocuments({ booking: booking._id })
    expect(count).toBe(1)
  })
})

// ── GET /api/v1/payments ──────────────────────────────────────────────────────

describe('GET /payments (list)', () => {
  it('requires authentication', async () => {
    const res = await request(app).get(PAYMENTS)
    expect(res.status).toBe(401)
  })

  it('returns only the current user's own payments', async () => {
    const { accessToken: tokenA, userId: userAId } = await registerAndLogin()
    const { accessToken: tokenB, userId: userBId } = await registerAndLogin({ email: 'b@example.com' })
    const { userId: adminId } = await createAdminAndLogin()
    const tour = await seedTourWithDeps(adminId)

    const bookingA = await createPendingBooking(tokenA, tour)
    await seedConfirmedPayment(bookingA, userAId)

    // User B has no payments
    const resB = await request(app).get(PAYMENTS).set('Authorization', `Bearer ${tokenB}`)
    expect(resB.status).toBe(200)
    expect(resB.body.data.payments).toHaveLength(0)

    // User A sees their own payment
    const resA = await request(app).get(PAYMENTS).set('Authorization', `Bearer ${tokenA}`)
    expect(resA.status).toBe(200)
    expect(resA.body.data.payments).toHaveLength(1)
    expect(resA.body.data.payments[0].stripePaymentIntentId).toBe('pi_existing_test')
  })
})

// ── GET /api/v1/payments/:bookingId/invoice ───────────────────────────────────

describe('GET /payments/:bookingId/invoice', () => {
  it('returns an invoice for the booking owner', async () => {
    const { accessToken, userId } = await registerAndLogin()
    const { userId: adminId } = await createAdminAndLogin()
    const tour = await seedTourWithDeps(adminId)
    const booking = await createPendingBooking(accessToken, tour)
    await seedConfirmedPayment(booking, userId)

    const res = await request(app)
      .get(`${PAYMENTS}/${booking._id}/invoice`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data.invoice.invoiceNumber).toMatch(/^WND-/)
    expect(res.body.data.invoice.total).toBe(booking.totalAmount)
    expect(res.body.data.invoice.bookingStatus).toBe('pending_payment')
  })

  it('returns 403 when a different user requests the invoice', async () => {
    const { accessToken: ownerToken, userId } = await registerAndLogin()
    const { accessToken: intruderToken } = await registerAndLogin({ email: 'intruder@example.com' })
    const { userId: adminId } = await createAdminAndLogin()
    const tour = await seedTourWithDeps(adminId)
    const booking = await createPendingBooking(ownerToken, tour)
    await seedConfirmedPayment(booking, userId)

    const res = await request(app)
      .get(`${PAYMENTS}/${booking._id}/invoice`)
      .set('Authorization', `Bearer ${intruderToken}`)

    expect(res.status).toBe(403)
  })
})

// ── POST /api/v1/payments/:bookingId/refund ───────────────────────────────────

describe('POST /payments/:bookingId/refund (admin)', () => {
  it('requires admin permission (regular user gets 403)', async () => {
    const { accessToken, userId } = await registerAndLogin()
    const { userId: adminId } = await createAdminAndLogin()
    const tour = await seedTourWithDeps(adminId)
    const booking = await createPendingBooking(accessToken, tour)

    const res = await request(app)
      .post(`${PAYMENTS}/${booking._id}/refund`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})

    expect(res.status).toBe(403)
  })

  it('returns 404 when there is no payment for the booking', async () => {
    const { accessToken: userToken } = await registerAndLogin()
    const { accessToken: adminToken, userId: adminId } = await createAdminAndLogin()
    const tour = await seedTourWithDeps(adminId)
    const booking = await createPendingBooking(userToken, tour)

    const res = await request(app)
      .post(`${PAYMENTS}/${booking._id}/refund`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})

    expect(res.status).toBe(404)
  })

  it('issues a refund via Stripe and marks the booking as refunded', async () => {
    const { accessToken: userToken, userId } = await registerAndLogin()
    const { accessToken: adminToken, userId: adminId } = await createAdminAndLogin()
    const tour = await seedTourWithDeps(adminId)
    const booking = await createPendingBooking(userToken, tour)
    await seedConfirmedPayment(booking, userId)

    const res = await request(app)
      .post(`${PAYMENTS}/${booking._id}/refund`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Customer request' })

    expect(res.status).toBe(200)
    expect(res.body.data.payment.status).toBe('refunded')
    expect(res.body.data.payment.refunds).toHaveLength(1)
    expect(res.body.data.payment.refunds[0].stripeRefundId).toBe('re_test_123')

    const updatedBooking = await Booking.findById(booking._id)
    expect(updatedBooking.status).toBe('refunded')
  })
})
