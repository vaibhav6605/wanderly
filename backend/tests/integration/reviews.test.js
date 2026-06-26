import request from 'supertest'
import { app } from '../../src/app.js'
import { connectTestDB, clearTestDB, disconnectTestDB } from '../setup/db.js'
import { User } from '../../src/models/User.js'
import { Tour } from '../../src/models/Tour.js'
import { Category } from '../../src/models/Category.js'
import { Destination } from '../../src/models/Destination.js'
import { Booking } from '../../src/models/Booking.js'
import { Review } from '../../src/models/Review.js'

const AUTH = '/api/v1/auth'
const REVIEWS = '/api/v1/reviews'

beforeAll(async () => {
  await connectTestDB()
  await Promise.all([User.init(), Tour.init(), Booking.init(), Review.init(), Category.init()])
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
  const creds = { name: 'Reviewer', email: 'reviewer@example.com', password: 'pass1234!', ...overrides }
  const res = await request(app).post(`${AUTH}/register`).send(creds)
  const user = await User.findOne({ email: creds.email })
  return { accessToken: res.body.data.accessToken, userId: user._id }
}

async function seedTour(createdBy) {
  const [category, destination] = await Promise.all([
    Category.create({ name: 'Cultural' }),
    Destination.create({ name: 'Tokyo', country: 'Japan' }),
  ])
  return Tour.create({
    title: 'Tokyo Discovery',
    summary: 'An immersive journey through modern and traditional Tokyo.',
    description: 'Spend five days exploring the contrasts of Tokyo.',
    category: category._id,
    destinations: [destination._id],
    duration: { days: 5, nights: 4 },
    price: 1200,
    maxGroupSize: 8,
    createdBy,
    isActive: true,
  })
}

// Directly seed a booking in the DB in the given status — avoids going through
// the payment flow just to get a booking into 'completed' state for reviews.
async function seedBooking(userId, tourId, status = 'completed') {
  return Booking.create({
    user: userId,
    tour: tourId,
    tourStartDateId: new Booking().id, // placeholder ObjectId
    tourStartDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    travelers: { adults: 1 },
    baseAmount: 1200,
    taxAmount: 120,
    totalAmount: 1320,
    currency: 'USD',
    status,
  })
}

// ── GET /api/v1/reviews ──────────────────────────────────────────────────────

describe('GET /reviews', () => {
  it('returns an empty array when no reviews exist', async () => {
    const { userId: adminId } = await createAdminAndLogin()
    const tour = await seedTour(adminId)

    const res = await request(app).get(REVIEWS).query({ tourId: tour._id.toString() })
    expect(res.status).toBe(200)
    expect(res.body.data.reviews).toEqual([])
  })

  it('includes ratingDistribution when a tourId filter is provided', async () => {
    const { userId: adminId, accessToken: adminToken } = await createAdminAndLogin()
    const { accessToken, userId } = await registerAndLogin()
    const tour = await seedTour(adminId)
    const booking = await seedBooking(userId, tour._id)

    await request(app)
      .post(REVIEWS)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ tourId: tour._id.toString(), bookingId: booking._id.toString(), rating: 4, comment: 'Really loved it overall.' })

    const res = await request(app).get(REVIEWS).query({ tourId: tour._id.toString() })
    expect(res.status).toBe(200)
    expect(res.body.data.ratingDistribution).toBeDefined()
    expect(res.body.data.ratingDistribution[4]).toBe(1)
    expect(res.body.data.ratingDistribution[5]).toBe(0)
  })

  it('does not include ratingDistribution without a tourId param', async () => {
    const res = await request(app).get(REVIEWS)
    expect(res.status).toBe(200)
    expect(res.body.data.ratingDistribution).toBeUndefined()
  })
})

// ── GET /api/v1/reviews/my-status ────────────────────────────────────────────

describe('GET /reviews/my-status', () => {
  it('requires authentication', async () => {
    const { userId: adminId } = await createAdminAndLogin()
    const tour = await seedTour(adminId)

    const res = await request(app).get(`${REVIEWS}/my-status`).query({ tourId: tour._id.toString() })
    expect(res.status).toBe(401)
  })

  it('returns canReview:true and the eligible booking for a completed booking', async () => {
    const { userId: adminId } = await createAdminAndLogin()
    const { accessToken, userId } = await registerAndLogin()
    const tour = await seedTour(adminId)
    const booking = await seedBooking(userId, tour._id, 'completed')

    const res = await request(app)
      .get(`${REVIEWS}/my-status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ tourId: tour._id.toString() })

    expect(res.status).toBe(200)
    expect(res.body.data.canReview).toBe(true)
    expect(res.body.data.eligibleBookingId).toBe(booking._id.toString())
    expect(res.body.data.myReview).toBeNull()
  })

  it('returns canReview:false when the user has not completed a booking', async () => {
    const { userId: adminId } = await createAdminAndLogin()
    const { accessToken, userId } = await registerAndLogin()
    const tour = await seedTour(adminId)
    await seedBooking(userId, tour._id, 'pending_payment')

    const res = await request(app)
      .get(`${REVIEWS}/my-status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ tourId: tour._id.toString() })

    expect(res.status).toBe(200)
    expect(res.body.data.canReview).toBe(false)
  })

  it('returns the existing review when the user has already reviewed', async () => {
    const { userId: adminId } = await createAdminAndLogin()
    const { accessToken, userId } = await registerAndLogin()
    const tour = await seedTour(adminId)
    const booking = await seedBooking(userId, tour._id)

    await request(app)
      .post(REVIEWS)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ tourId: tour._id.toString(), bookingId: booking._id.toString(), rating: 5, comment: 'Absolutely incredible experience!' })

    const res = await request(app)
      .get(`${REVIEWS}/my-status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .query({ tourId: tour._id.toString() })

    expect(res.status).toBe(200)
    expect(res.body.data.canReview).toBe(false)
    expect(res.body.data.myReview).not.toBeNull()
    expect(res.body.data.myReview.rating).toBe(5)
  })
})

// ── POST /api/v1/reviews ──────────────────────────────────────────────────────

describe('POST /reviews (create)', () => {
  it('requires authentication', async () => {
    const res = await request(app).post(REVIEWS).send({ tourId: '000000000000000000000001', bookingId: '000000000000000000000002', rating: 5, comment: 'Great tour!' })
    expect(res.status).toBe(401)
  })

  it('creates a review for a completed booking and updates Tour.avgRating', async () => {
    const { userId: adminId } = await createAdminAndLogin()
    const { accessToken, userId } = await registerAndLogin()
    const tour = await seedTour(adminId)
    const booking = await seedBooking(userId, tour._id)

    const res = await request(app)
      .post(REVIEWS)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ tourId: tour._id.toString(), bookingId: booking._id.toString(), rating: 5, comment: 'Absolutely fantastic from start to finish!' })

    expect(res.status).toBe(201)
    expect(res.body.data.review.rating).toBe(5)
    expect(res.body.data.review.booking).toBe(booking._id.toString())

    // Review hook must have synced the Tour's denormalized fields
    const updatedTour = await Tour.findById(tour._id)
    expect(updatedTour.avgRating).toBe(5)
    expect(updatedTour.ratingsCount).toBe(1)
  })

  it('rejects a review without a completed booking', async () => {
    const { userId: adminId } = await createAdminAndLogin()
    const { accessToken, userId } = await registerAndLogin()
    const tour = await seedTour(adminId)
    const booking = await seedBooking(userId, tour._id, 'pending_payment')

    const res = await request(app)
      .post(REVIEWS)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ tourId: tour._id.toString(), bookingId: booking._id.toString(), rating: 3, comment: 'Tried to review before completing booking.' })

    expect(res.status).toBe(403)
  })

  it('prevents two reviews for the same booking (unique constraint)', async () => {
    const { userId: adminId } = await createAdminAndLogin()
    const { accessToken, userId } = await registerAndLogin()
    const tour = await seedTour(adminId)
    const booking = await seedBooking(userId, tour._id)
    const body = { tourId: tour._id.toString(), bookingId: booking._id.toString(), rating: 4, comment: 'Great tour, would recommend!' }

    await request(app).post(REVIEWS).set('Authorization', `Bearer ${accessToken}`).send(body)
    const duplicate = await request(app).post(REVIEWS).set('Authorization', `Bearer ${accessToken}`).send(body)

    expect(duplicate.status).toBe(409)
  })

  it('returns 422 for a comment shorter than 10 characters', async () => {
    const { userId: adminId } = await createAdminAndLogin()
    const { accessToken, userId } = await registerAndLogin()
    const tour = await seedTour(adminId)
    const booking = await seedBooking(userId, tour._id)

    const res = await request(app)
      .post(REVIEWS)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ tourId: tour._id.toString(), bookingId: booking._id.toString(), rating: 4, comment: 'Short' })

    expect(res.status).toBe(422)
  })
})

// ── PATCH /api/v1/reviews/:id (update) ───────────────────────────────────────

describe('PATCH /reviews/:id (update)', () => {
  async function createReview(accessToken, tourId, bookingId, rating = 4) {
    const res = await request(app)
      .post(REVIEWS)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ tourId: tourId.toString(), bookingId: bookingId.toString(), rating, comment: 'Really enjoyed this tour, highly recommend.' })
    return res.body.data.review
  }

  it('allows the owner to update their review', async () => {
    const { userId: adminId } = await createAdminAndLogin()
    const { accessToken, userId } = await registerAndLogin()
    const tour = await seedTour(adminId)
    const booking = await seedBooking(userId, tour._id)
    const review = await createReview(accessToken, tour._id, booking._id)

    const res = await request(app)
      .patch(`${REVIEWS}/${review._id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ rating: 5, comment: 'On reflection, it was even better than I thought!' })

    expect(res.status).toBe(200)
    expect(res.body.data.review.rating).toBe(5)
  })

  it('returns 403 when a different user tries to edit the review', async () => {
    const { userId: adminId } = await createAdminAndLogin()
    const { accessToken: ownerToken, userId } = await registerAndLogin()
    const { accessToken: intruderToken } = await registerAndLogin({ email: 'intruder@example.com' })
    const tour = await seedTour(adminId)
    const booking = await seedBooking(userId, tour._id)
    const review = await createReview(ownerToken, tour._id, booking._id)

    const res = await request(app)
      .patch(`${REVIEWS}/${review._id}`)
      .set('Authorization', `Bearer ${intruderToken}`)
      .send({ rating: 1, comment: 'Trying to sabotage someone else is review!' })

    expect(res.status).toBe(403)
  })

  it('syncs Tour.avgRating after an update', async () => {
    const { userId: adminId } = await createAdminAndLogin()
    const { accessToken, userId } = await registerAndLogin()
    const tour = await seedTour(adminId)
    const booking = await seedBooking(userId, tour._id)
    const review = await createReview(accessToken, tour._id, booking._id, 2)

    await request(app)
      .patch(`${REVIEWS}/${review._id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ rating: 5, comment: 'Changed my mind — this tour was outstanding!' })

    const updatedTour = await Tour.findById(tour._id)
    expect(updatedTour.avgRating).toBe(5)
  })
})

// ── DELETE /api/v1/reviews/:id ───────────────────────────────────────────────

describe('DELETE /reviews/:id', () => {
  async function createReview(accessToken, tourId, bookingId) {
    const res = await request(app)
      .post(REVIEWS)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ tourId: tourId.toString(), bookingId: bookingId.toString(), rating: 3, comment: 'It was an okay experience overall.' })
    return res.body.data.review
  }

  it('allows the owner to delete their own review and resets Tour.avgRating', async () => {
    const { userId: adminId } = await createAdminAndLogin()
    const { accessToken, userId } = await registerAndLogin()
    const tour = await seedTour(adminId)
    const booking = await seedBooking(userId, tour._id)
    const review = await createReview(accessToken, tour._id, booking._id)

    const res = await request(app)
      .delete(`${REVIEWS}/${review._id}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(res.status).toBe(200)

    // Tour ratings are reset to zero when the only review is removed
    const updatedTour = await Tour.findById(tour._id)
    expect(updatedTour.ratingsCount).toBe(0)
    expect(updatedTour.avgRating).toBe(0)
  })

  it('returns 403 when a non-owner, non-admin tries to delete', async () => {
    const { userId: adminId } = await createAdminAndLogin()
    const { accessToken: ownerToken, userId } = await registerAndLogin()
    const { accessToken: intruderToken } = await registerAndLogin({ email: 'intruder@example.com' })
    const tour = await seedTour(adminId)
    const booking = await seedBooking(userId, tour._id)
    const review = await createReview(ownerToken, tour._id, booking._id)

    const res = await request(app)
      .delete(`${REVIEWS}/${review._id}`)
      .set('Authorization', `Bearer ${intruderToken}`)

    expect(res.status).toBe(403)
  })

  it('allows an admin to delete any review', async () => {
    const { userId: adminId, accessToken: adminToken } = await createAdminAndLogin()
    const { accessToken, userId } = await registerAndLogin()
    const tour = await seedTour(adminId)
    const booking = await seedBooking(userId, tour._id)
    const review = await createReview(accessToken, tour._id, booking._id)

    const res = await request(app)
      .delete(`${REVIEWS}/${review._id}`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(res.status).toBe(200)
  })
})

// ── PATCH /api/v1/reviews/:id/approve ────────────────────────────────────────

describe('PATCH /reviews/:id/approve (admin moderation)', () => {
  it('allows an admin to disapprove a review', async () => {
    const { userId: adminId, accessToken: adminToken } = await createAdminAndLogin()
    const { accessToken, userId } = await registerAndLogin()
    const tour = await seedTour(adminId)
    const booking = await seedBooking(userId, tour._id)

    const createRes = await request(app)
      .post(REVIEWS)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ tourId: tour._id.toString(), bookingId: booking._id.toString(), rating: 1, comment: 'Terrible experience, would not recommend.' })

    const reviewId = createRes.body.data.review._id

    const res = await request(app)
      .patch(`${REVIEWS}/${reviewId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isApproved: false })

    expect(res.status).toBe(200)
    expect(res.body.data.review.isApproved).toBe(false)
  })

  it('returns 403 for a regular user', async () => {
    const { userId: adminId } = await createAdminAndLogin()
    const { accessToken, userId } = await registerAndLogin()
    const tour = await seedTour(adminId)
    const booking = await seedBooking(userId, tour._id)

    const createRes = await request(app)
      .post(REVIEWS)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ tourId: tour._id.toString(), bookingId: booking._id.toString(), rating: 4, comment: 'Wonderful tour with stunning scenery.' })

    const reviewId = createRes.body.data.review._id

    const res = await request(app)
      .patch(`${REVIEWS}/${reviewId}/approve`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ isApproved: false })

    expect(res.status).toBe(403)
  })
})
