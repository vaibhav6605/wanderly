import request from 'supertest'
import { app } from '../../src/app.js'
import { connectTestDB, clearTestDB, disconnectTestDB } from '../setup/db.js'
import { User } from '../../src/models/User.js'
import { Tour } from '../../src/models/Tour.js'
import { Category } from '../../src/models/Category.js'
import { Destination } from '../../src/models/Destination.js'
import { Booking } from '../../src/models/Booking.js'
import { Coupon } from '../../src/models/Coupon.js'

const AUTH = '/api/v1/auth'
const BOOKINGS = '/api/v1/bookings'

beforeAll(async () => {
  await connectTestDB()
  await Promise.all([User.init(), Tour.init(), Booking.init(), Category.init(), Coupon.init()])
}, 60_000)

afterEach(clearTestDB)
afterAll(disconnectTestDB)

// ── Shared seed helpers ─────────────────────────────────────────────────────

async function createAdminAndLogin() {
  const email = 'admin@wanderly.test'
  const password = 'adminpassword123'
  await User.create({ name: 'Admin', email, password, role: 'admin', isEmailVerified: true })
  const res = await request(app).post(`${AUTH}/login`).send({ email, password })
  const user = await User.findOne({ email })
  return { accessToken: res.body.data.accessToken, userId: user._id }
}

async function registerAndLogin(overrides = {}) {
  const creds = { name: 'Test User', email: 'user@example.com', password: 'userpass123', ...overrides }
  const res = await request(app).post(`${AUTH}/register`).send(creds)
  return { accessToken: res.body.data.accessToken, user: res.body.data.user }
}

async function seedTour(createdBy, overrides = {}) {
  const [category, destination] = await Promise.all([
    Category.create({ name: 'Adventure' }),
    Destination.create({ name: 'Bali', country: 'Indonesia' }),
  ])
  const futureDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
  return Tour.create({
    title: 'Bali Explorer',
    summary: 'Seven-day deep dive into Bali temples, rice fields, and coast.',
    description: 'An immersive week-long exploration of Bali.',
    category: category._id,
    destinations: [destination._id],
    duration: { days: 7, nights: 6 },
    price: 800,
    maxGroupSize: 12,
    createdBy,
    isActive: true,
    startDates: [
      { date: futureDate, availableSeats: 10 },
    ],
    ...overrides,
  })
}

async function seedCoupon(overrides = {}) {
  const now = new Date()
  return Coupon.create({
    code: 'SAVE20',
    discountType: 'percentage',
    discountValue: 20,
    validFrom: new Date(now - 1000),
    validUntil: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    isActive: true,
    minBookingAmount: 0,
    usageLimitPerUser: 5,
    ...overrides,
  })
}

function buildBookingBody(tourId, startDateId, travelerOverrides = {}) {
  return {
    tourId: tourId.toString(),
    tourStartDateId: startDateId.toString(),
    travelers: { adults: 2, children: 0 },
    travelerDetails: [
      { name: 'Alice', age: 30 },
      { name: 'Bob',   age: 28 },
    ],
    ...travelerOverrides,
  }
}

// ── POST /api/v1/bookings/validate-coupon ────────────────────────────────────

describe('POST /bookings/validate-coupon', () => {
  it('requires authentication', async () => {
    const res = await request(app).post(`${BOOKINGS}/validate-coupon`).send({ code: 'SAVE20', tourId: '000000000000000000000001', baseAmount: 1000 })
    expect(res.status).toBe(401)
  })

  it('returns discount for a valid coupon', async () => {
    const { accessToken } = await registerAndLogin()
    const { userId } = await createAdminAndLogin()
    const tour = await seedTour(userId)
    await seedCoupon()

    const res = await request(app)
      .post(`${BOOKINGS}/validate-coupon`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code: 'SAVE20', tourId: tour._id.toString(), baseAmount: 1000 })

    expect(res.status).toBe(200)
    expect(res.body.data.discountAmount).toBe(200) // 20% of 1000
    expect(res.body.data.coupon.code).toBe('SAVE20')
  })

  it('returns 404 for an unknown or expired coupon', async () => {
    const { accessToken } = await registerAndLogin()
    const { userId } = await createAdminAndLogin()
    const tour = await seedTour(userId)

    const res = await request(app)
      .post(`${BOOKINGS}/validate-coupon`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code: 'DOESNOTEXIST', tourId: tour._id.toString(), baseAmount: 500 })

    expect(res.status).toBe(404)
  })

  it('returns 409 when the coupon has reached its global usage limit', async () => {
    const { accessToken } = await registerAndLogin()
    const { userId } = await createAdminAndLogin()
    const tour = await seedTour(userId)
    await seedCoupon({ usageLimit: 1, usedCount: 1 })

    const res = await request(app)
      .post(`${BOOKINGS}/validate-coupon`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code: 'SAVE20', tourId: tour._id.toString(), baseAmount: 500 })

    expect(res.status).toBe(409)
  })
})

// ── POST /api/v1/bookings ────────────────────────────────────────────────────

describe('POST /bookings (create)', () => {
  it('requires authentication', async () => {
    const res = await request(app).post(BOOKINGS).send({})
    expect(res.status).toBe(401)
  })

  it('creates a booking, decrements available seats, and returns 201', async () => {
    const { accessToken } = await registerAndLogin()
    const { userId } = await createAdminAndLogin()
    const tour = await seedTour(userId)
    const startDateId = tour.startDates[0]._id

    const res = await request(app)
      .post(BOOKINGS)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(buildBookingBody(tour._id, startDateId))

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.booking.status).toBe('pending_payment')
    expect(res.body.data.booking.travelers.adults).toBe(2)

    // Price: 800 × 2 adults = 1600 base; 10% tax → 1760 total
    expect(res.body.data.booking.baseAmount).toBe(1600)
    expect(res.body.data.booking.taxAmount).toBeCloseTo(160, 1)
    expect(res.body.data.booking.totalAmount).toBeCloseTo(1760, 1)

    // Seats must have been decremented atomically
    const updatedTour = await Tour.findById(tour._id)
    expect(updatedTour.startDates[0].availableSeats).toBe(8) // 10 - 2
  })

  it('applies a coupon discount during booking', async () => {
    const { accessToken } = await registerAndLogin()
    const { userId } = await createAdminAndLogin()
    const tour = await seedTour(userId)
    const startDateId = tour.startDates[0]._id
    await seedCoupon()

    const res = await request(app)
      .post(BOOKINGS)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ ...buildBookingBody(tour._id, startDateId), couponCode: 'SAVE20' })

    expect(res.status).toBe(201)
    expect(res.body.data.booking.discountAmount).toBeGreaterThan(0)
    expect(res.body.data.booking.totalAmount).toBeLessThan(res.body.data.booking.baseAmount)
  })

  it('returns 409 when there are not enough seats', async () => {
    const { accessToken } = await registerAndLogin()
    const { userId } = await createAdminAndLogin()
    const tour = await seedTour(userId, {
      startDates: [{ date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), availableSeats: 1 }],
    })
    const startDateId = tour.startDates[0]._id

    const res = await request(app)
      .post(BOOKINGS)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(buildBookingBody(tour._id, startDateId)) // requests 2 adults, only 1 seat

    expect(res.status).toBe(409)
  })

  it('returns 409 for a duplicate active booking on the same date', async () => {
    const { accessToken } = await registerAndLogin()
    const { userId } = await createAdminAndLogin()
    const tour = await seedTour(userId)
    const startDateId = tour.startDates[0]._id
    const body = buildBookingBody(tour._id, startDateId, { travelers: { adults: 1 } })

    await request(app).post(BOOKINGS).set('Authorization', `Bearer ${accessToken}`).send(body)
    const duplicate = await request(app).post(BOOKINGS).set('Authorization', `Bearer ${accessToken}`).send(body)

    expect(duplicate.status).toBe(409)
  })

  it('returns 422 for missing required traveler fields', async () => {
    const { accessToken } = await registerAndLogin()

    const res = await request(app)
      .post(BOOKINGS)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ tourId: '000000000000000000000001' }) // missing tourStartDateId, travelers

    expect(res.status).toBe(422)
  })
})

// ── GET /api/v1/bookings ─────────────────────────────────────────────────────

describe('GET /bookings (list own)', () => {
  it('requires authentication', async () => {
    const res = await request(app).get(BOOKINGS)
    expect(res.status).toBe(401)
  })

  it('returns only the current user's bookings, not others'', async () => {
    const { accessToken: tokenA, user: userA } = await registerAndLogin({ email: 'a@example.com' })
    const { accessToken: tokenB } = await registerAndLogin({ email: 'b@example.com' })
    const { userId: adminId } = await createAdminAndLogin()
    const tour = await seedTour(adminId)
    const startDateId = tour.startDates[0]._id

    // User A makes a booking
    await request(app).post(BOOKINGS).set('Authorization', `Bearer ${tokenA}`)
      .send(buildBookingBody(tour._id, startDateId, { travelers: { adults: 1 } }))

    // User B should see an empty list
    const resB = await request(app).get(BOOKINGS).set('Authorization', `Bearer ${tokenB}`)
    expect(resB.status).toBe(200)
    expect(resB.body.data.bookings).toHaveLength(0)

    // User A sees their own booking
    const resA = await request(app).get(BOOKINGS).set('Authorization', `Bearer ${tokenA}`)
    expect(resA.status).toBe(200)
    expect(resA.body.data.bookings).toHaveLength(1)
  })

  it('supports pagination via page/limit query params', async () => {
    const { accessToken } = await registerAndLogin()
    const { userId: adminId } = await createAdminAndLogin()
    const tour = await seedTour(adminId, {
      startDates: [
        { date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), availableSeats: 20 },
        { date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), availableSeats: 20 },
        { date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), availableSeats: 20 },
      ],
    })

    // Create 3 bookings on different dates
    for (const sd of tour.startDates) {
      await request(app).post(BOOKINGS).set('Authorization', `Bearer ${accessToken}`)
        .send(buildBookingBody(tour._id, sd._id, { travelers: { adults: 1 } }))
    }

    const res = await request(app).get(BOOKINGS).set('Authorization', `Bearer ${accessToken}`).query({ page: 1, limit: 2 })
    expect(res.status).toBe(200)
    expect(res.body.data.bookings).toHaveLength(2)
    expect(res.body.meta.totalPages).toBe(2)
  })
})

// ── GET /api/v1/bookings/:id ─────────────────────────────────────────────────

describe('GET /bookings/:id (single)', () => {
  it('returns the booking for its owner', async () => {
    const { accessToken } = await registerAndLogin()
    const { userId: adminId } = await createAdminAndLogin()
    const tour = await seedTour(adminId)
    const startDateId = tour.startDates[0]._id

    const createRes = await request(app).post(BOOKINGS).set('Authorization', `Bearer ${accessToken}`)
      .send(buildBookingBody(tour._id, startDateId, { travelers: { adults: 1 } }))
    const bookingId = createRes.body.data.booking._id

    const res = await request(app).get(`${BOOKINGS}/${bookingId}`).set('Authorization', `Bearer ${accessToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data.booking._id).toBe(bookingId)
  })

  it('returns 403 when another user tries to access the booking', async () => {
    const { accessToken: ownerToken } = await registerAndLogin({ email: 'owner@example.com' })
    const { accessToken: intruderToken } = await registerAndLogin({ email: 'intruder@example.com' })
    const { userId: adminId } = await createAdminAndLogin()
    const tour = await seedTour(adminId)
    const startDateId = tour.startDates[0]._id

    const createRes = await request(app).post(BOOKINGS).set('Authorization', `Bearer ${ownerToken}`)
      .send(buildBookingBody(tour._id, startDateId, { travelers: { adults: 1 } }))
    const bookingId = createRes.body.data.booking._id

    const res = await request(app).get(`${BOOKINGS}/${bookingId}`).set('Authorization', `Bearer ${intruderToken}`)
    expect(res.status).toBe(403)
  })
})

// ── POST /api/v1/bookings/:id/cancel ─────────────────────────────────────────

describe('POST /bookings/:id/cancel', () => {
  it('cancels the booking and releases seats back to the tour', async () => {
    const { accessToken } = await registerAndLogin()
    const { userId: adminId } = await createAdminAndLogin()
    const tour = await seedTour(adminId)
    const startDateId = tour.startDates[0]._id
    const seatsBefore = tour.startDates[0].availableSeats

    const createRes = await request(app).post(BOOKINGS).set('Authorization', `Bearer ${accessToken}`)
      .send(buildBookingBody(tour._id, startDateId))
    const bookingId = createRes.body.data.booking._id

    const cancelRes = await request(app)
      .post(`${BOOKINGS}/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ reason: 'Change of plans' })

    expect(cancelRes.status).toBe(200)
    expect(cancelRes.body.data.booking.status).toBe('cancelled')
    expect(cancelRes.body.data.booking.cancellationReason).toBe('Change of plans')

    // Seats must have been released
    const updatedTour = await Tour.findById(tour._id)
    expect(updatedTour.startDates[0].availableSeats).toBe(seatsBefore)
  })

  it('returns 400 when trying to cancel an already-cancelled booking', async () => {
    const { accessToken } = await registerAndLogin()
    const { userId: adminId } = await createAdminAndLogin()
    const tour = await seedTour(adminId)
    const startDateId = tour.startDates[0]._id

    const createRes = await request(app).post(BOOKINGS).set('Authorization', `Bearer ${accessToken}`)
      .send(buildBookingBody(tour._id, startDateId, { travelers: { adults: 1 } }))
    const bookingId = createRes.body.data.booking._id

    // First cancel succeeds
    await request(app).post(`${BOOKINGS}/${bookingId}/cancel`).set('Authorization', `Bearer ${accessToken}`)

    // Second cancel is rejected
    const res = await request(app).post(`${BOOKINGS}/${bookingId}/cancel`).set('Authorization', `Bearer ${accessToken}`)
    expect(res.status).toBe(400)
  })

  it('returns 403 when a different user tries to cancel someone else's booking', async () => {
    const { accessToken: ownerToken } = await registerAndLogin({ email: 'owner2@example.com' })
    const { accessToken: intruderToken } = await registerAndLogin({ email: 'intruder2@example.com' })
    const { userId: adminId } = await createAdminAndLogin()
    const tour = await seedTour(adminId)
    const startDateId = tour.startDates[0]._id

    const createRes = await request(app).post(BOOKINGS).set('Authorization', `Bearer ${ownerToken}`)
      .send(buildBookingBody(tour._id, startDateId, { travelers: { adults: 1 } }))
    const bookingId = createRes.body.data.booking._id

    const res = await request(app).post(`${BOOKINGS}/${bookingId}/cancel`).set('Authorization', `Bearer ${intruderToken}`)
    expect(res.status).toBe(403)
  })
})
