import request from 'supertest'
import { app } from '../../src/app.js'
import { connectTestDB, clearTestDB, disconnectTestDB } from '../setup/db.js'
import { User } from '../../src/models/User.js'
import { Tour } from '../../src/models/Tour.js'
import { Category } from '../../src/models/Category.js'
import { Destination } from '../../src/models/Destination.js'

const AUTH = '/api/v1/auth'
const TOURS = '/api/v1/tours'

beforeAll(async () => {
  await connectTestDB()
  await Promise.all([User.init(), Tour.init(), Category.init()])
}, 60_000)

afterEach(clearTestDB)
afterAll(disconnectTestDB)

// ── Test helpers ────────────────────────────────────────────────────────────

async function createAdminAndLogin() {
  const email = 'admin@wanderly.test'
  const password = 'adminpassword123'
  await User.create({ name: 'Admin', email, password, role: 'admin', isEmailVerified: true })
  const res = await request(app).post(`${AUTH}/login`).send({ email, password })
  const user = await User.findOne({ email })
  return { accessToken: res.body.data.accessToken, userId: user._id }
}

async function registerUser(overrides = {}) {
  const res = await request(app).post(`${AUTH}/register`).send({
    name: 'Test User', email: 'user@example.com', password: 'password123', ...overrides,
  })
  return res.body.data.accessToken
}

async function seedTourDeps() {
  const [category, destination] = await Promise.all([
    Category.create({ name: 'Adventure' }),
    Destination.create({ name: 'Paris', country: 'France' }),
  ])
  return { category, destination }
}

async function seedTour(createdBy, categoryId, destinationId, overrides = {}) {
  return Tour.create({
    title: 'Paris Highlights',
    summary: 'A comprehensive one-day tour of iconic Paris landmarks.',
    description: 'Start at the Eiffel Tower, continue to the Louvre, and end at Notre-Dame.',
    category: categoryId,
    destinations: [destinationId],
    duration: { days: 1, nights: 0 },
    price: 150,
    maxGroupSize: 20,
    createdBy,
    isActive: true,
    startDates: [{ date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), availableSeats: 15 }],
    ...overrides,
  })
}

// ── GET /api/v1/tours ───────────────────────────────────────────────────────

describe('GET /tours (public listing)', () => {
  it('returns an empty list when no tours exist', async () => {
    const res = await request(app).get(TOURS)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data.tours).toEqual([])
    expect(res.body.meta).toMatchObject({ page: 1, total: 0 })
  })

  it('returns active tours with pagination meta', async () => {
    const { userId } = await createAdminAndLogin()
    const { category, destination } = await seedTourDeps()
    await seedTour(userId, category._id, destination._id)

    const res = await request(app).get(TOURS)
    expect(res.status).toBe(200)
    expect(res.body.data.tours).toHaveLength(1)
    expect(res.body.data.tours[0].title).toBe('Paris Highlights')
    expect(res.body.meta.total).toBe(1)
  })

  it('excludes inactive tours from the public listing', async () => {
    const { userId } = await createAdminAndLogin()
    const { category, destination } = await seedTourDeps()
    await seedTour(userId, category._id, destination._id, { isActive: false })

    const res = await request(app).get(TOURS)
    expect(res.status).toBe(200)
    expect(res.body.data.tours).toHaveLength(0)
  })

  it('filters by difficulty', async () => {
    const { userId } = await createAdminAndLogin()
    const { category, destination } = await seedTourDeps()
    await Promise.all([
      seedTour(userId, category._id, destination._id, { title: 'Easy Tour', difficulty: 'easy' }),
      seedTour(userId, category._id, destination._id, { title: 'Hard Tour', difficulty: 'difficult' }),
    ])

    const res = await request(app).get(TOURS).query({ difficulty: 'easy' })
    expect(res.status).toBe(200)
    expect(res.body.data.tours).toHaveLength(1)
    expect(res.body.data.tours[0].title).toBe('Easy Tour')
  })

  it('applies pagination', async () => {
    const { userId } = await createAdminAndLogin()
    const { category, destination } = await seedTourDeps()
    await Promise.all([
      seedTour(userId, category._id, destination._id, { title: 'Tour A' }),
      seedTour(userId, category._id, destination._id, { title: 'Tour B' }),
      seedTour(userId, category._id, destination._id, { title: 'Tour C' }),
    ])

    const res = await request(app).get(TOURS).query({ limit: 2, page: 1 })
    expect(res.status).toBe(200)
    expect(res.body.data.tours).toHaveLength(2)
    expect(res.body.meta.totalPages).toBe(2)
  })
})

// ── GET /api/v1/tours/categories ────────────────────────────────────────────

describe('GET /tours/categories', () => {
  it('returns all active categories', async () => {
    await Category.create({ name: 'Beach' })
    await Category.create({ name: 'Mountain' })

    const res = await request(app).get(`${TOURS}/categories`)
    expect(res.status).toBe(200)
    expect(res.body.data.categories.length).toBeGreaterThanOrEqual(2)
  })
})

// ── GET /api/v1/tours/:id ───────────────────────────────────────────────────

describe('GET /tours/:id (single tour)', () => {
  it('returns a tour by slug', async () => {
    const { userId } = await createAdminAndLogin()
    const { category, destination } = await seedTourDeps()
    const tour = await seedTour(userId, category._id, destination._id)

    const res = await request(app).get(`${TOURS}/${tour.slug}`)
    expect(res.status).toBe(200)
    expect(res.body.data.tour.title).toBe('Paris Highlights')
    expect(res.body.data.tour.slug).toBe(tour.slug)
  })

  it('returns a tour by MongoDB ObjectId', async () => {
    const { userId } = await createAdminAndLogin()
    const { category, destination } = await seedTourDeps()
    const tour = await seedTour(userId, category._id, destination._id)

    const res = await request(app).get(`${TOURS}/${tour._id}`)
    expect(res.status).toBe(200)
    expect(res.body.data.tour._id).toBe(tour._id.toString())
  })

  it('returns 404 for an unknown id', async () => {
    const res = await request(app).get(`${TOURS}/not-a-real-slug`)
    expect(res.status).toBe(404)
  })
})

// ── POST /api/v1/tours (admin create) ───────────────────────────────────────

describe('POST /tours (admin create)', () => {
  it('rejects an unauthenticated request with 401', async () => {
    const res = await request(app).post(TOURS).send({ title: 'Test' })
    expect(res.status).toBe(401)
  })

  it('rejects a regular user with 403', async () => {
    const userToken = await registerUser()
    const { category, destination } = await seedTourDeps()

    const res = await request(app)
      .post(TOURS)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Sneaky Tour',
        summary: 'Created by a non-admin user.',
        description: 'This should not be allowed.',
        category: category._id,
        destinations: [destination._id],
        duration: { days: 1, nights: 0 },
        price: 100,
        maxGroupSize: 10,
      })

    expect(res.status).toBe(403)
  })

  it('creates a tour and returns 201 for an admin', async () => {
    const { accessToken } = await createAdminAndLogin()
    const { category, destination } = await seedTourDeps()

    const res = await request(app)
      .post(TOURS)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Admin Created Tour',
        summary: 'This tour was created by an admin in a test.',
        description: 'Full-day tour exploring the highlights of the destination.',
        category: category._id,
        destinations: [destination._id],
        duration: { days: 2, nights: 1 },
        price: 299,
        maxGroupSize: 15,
        difficulty: 'moderate',
      })

    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.data.tour.title).toBe('Admin Created Tour')
    expect(res.body.data.tour.slug).toBeTruthy()
    expect(res.body.data.tour.isActive).toBe(true)
  })

  it('returns 422 for missing required fields', async () => {
    const { accessToken } = await createAdminAndLogin()

    const res = await request(app)
      .post(TOURS)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ title: 'Incomplete Tour' })

    expect(res.status).toBe(422)
    expect(res.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('rejects a discountPrice ≥ price', async () => {
    const { accessToken } = await createAdminAndLogin()
    const { category, destination } = await seedTourDeps()

    const res = await request(app)
      .post(TOURS)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Invalid Price Tour',
        summary: 'Tour with invalid discount price.',
        description: 'A tour where the discount price is not less than the price.',
        category: category._id,
        destinations: [destination._id],
        duration: { days: 1, nights: 0 },
        price: 100,
        discountPrice: 150,
        maxGroupSize: 10,
      })

    expect(res.status).toBe(422)
  })
})

// ── PATCH /api/v1/tours/:id (admin update) ──────────────────────────────────

describe('PATCH /tours/:id (admin update)', () => {
  it('updates tour fields for an admin', async () => {
    const { accessToken, userId } = await createAdminAndLogin()
    const { category, destination } = await seedTourDeps()
    const tour = await seedTour(userId, category._id, destination._id)

    const res = await request(app)
      .patch(`${TOURS}/${tour._id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ price: 200, difficulty: 'challenging' })

    expect(res.status).toBe(200)
    expect(res.body.data.tour.price).toBe(200)
    expect(res.body.data.tour.difficulty).toBe('challenging')
  })

  it('returns 403 for a regular user', async () => {
    const { userId } = await createAdminAndLogin()
    const { category, destination } = await seedTourDeps()
    const tour = await seedTour(userId, category._id, destination._id)
    const userToken = await registerUser()

    const res = await request(app)
      .patch(`${TOURS}/${tour._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ price: 999 })

    expect(res.status).toBe(403)
  })
})

// ── DELETE /api/v1/tours/:id (admin soft-delete) ────────────────────────────

describe('DELETE /tours/:id (admin soft-delete)', () => {
  it('marks the tour inactive rather than removing it', async () => {
    const { accessToken, userId } = await createAdminAndLogin()
    const { category, destination } = await seedTourDeps()
    const tour = await seedTour(userId, category._id, destination._id)

    const deleteRes = await request(app)
      .delete(`${TOURS}/${tour._id}`)
      .set('Authorization', `Bearer ${accessToken}`)
    expect(deleteRes.status).toBe(200)

    // Tour still exists in DB — only deactivated
    const inDb = await Tour.findById(tour._id)
    expect(inDb).not.toBeNull()
    expect(inDb.isActive).toBe(false)

    // No longer appears in the public listing
    const listRes = await request(app).get(TOURS)
    expect(listRes.body.data.tours).toHaveLength(0)
  })

  it('returns 403 for a regular user', async () => {
    const { userId } = await createAdminAndLogin()
    const { category, destination } = await seedTourDeps()
    const tour = await seedTour(userId, category._id, destination._id)
    const userToken = await registerUser()

    const res = await request(app)
      .delete(`${TOURS}/${tour._id}`)
      .set('Authorization', `Bearer ${userToken}`)

    expect(res.status).toBe(403)
  })
})
