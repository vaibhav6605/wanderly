import express from 'express'
import request from 'supertest'
import mongoose from 'mongoose'
import { connectTestDB, clearTestDB, disconnectTestDB } from '../setup/db.js'
import { Booking } from '../../src/models/Booking.js'
import { requireOwnership } from '../../src/middlewares/requireOwnership.js'
import { errorHandler } from '../../src/middlewares/errorHandler.js'
import { PERMISSIONS } from '../../src/config/permissions.js'

beforeAll(async () => {
  await connectTestDB()
}, 60_000)

afterEach(async () => {
  await clearTestDB()
})

afterAll(async () => {
  await disconnectTestDB()
})

function buildApp(reqUser) {
  const testApp = express()
  testApp.use((req, res, next) => {
    req.user = reqUser
    next()
  })
  testApp.get(
    '/bookings/:id',
    requireOwnership(Booking, { bypassPermission: PERMISSIONS.MANAGE_BOOKINGS }),
    (req, res) => {
      res.json({ resourceId: req.resource._id.toString() })
    },
  )
  testApp.use(errorHandler)
  return testApp
}

function createBooking(userId) {
  return Booking.create({
    user: userId,
    tour: new mongoose.Types.ObjectId(),
    tourStartDateId: new mongoose.Types.ObjectId(),
    tourStartDate: new Date(),
    travelers: { adults: 1 },
    totalAmount: 1000,
    currency: 'USD',
  })
}

describe('requireOwnership', () => {
  it('allows the owner through and attaches req.resource', async () => {
    const ownerId = new mongoose.Types.ObjectId()
    const booking = await createBooking(ownerId)

    const res = await request(buildApp({ id: ownerId.toString(), role: 'user' })).get(
      `/bookings/${booking._id}`,
    )

    expect(res.status).toBe(200)
    expect(res.body.resourceId).toBe(booking._id.toString())
  })

  it('rejects a non-owner who lacks the bypass permission', async () => {
    const ownerId = new mongoose.Types.ObjectId()
    const otherUserId = new mongoose.Types.ObjectId()
    const booking = await createBooking(ownerId)

    const res = await request(buildApp({ id: otherUserId.toString(), role: 'user' })).get(
      `/bookings/${booking._id}`,
    )

    expect(res.status).toBe(403)
  })

  it('allows a non-owner who holds the bypass permission (admin)', async () => {
    const ownerId = new mongoose.Types.ObjectId()
    const adminId = new mongoose.Types.ObjectId()
    const booking = await createBooking(ownerId)

    const res = await request(buildApp({ id: adminId.toString(), role: 'admin' })).get(
      `/bookings/${booking._id}`,
    )

    expect(res.status).toBe(200)
  })

  it('returns 404 for a resource that does not exist', async () => {
    const res = await request(
      buildApp({ id: new mongoose.Types.ObjectId().toString(), role: 'user' }),
    ).get(`/bookings/${new mongoose.Types.ObjectId()}`)

    expect(res.status).toBe(404)
  })
})
