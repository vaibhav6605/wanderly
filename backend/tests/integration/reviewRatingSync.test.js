import mongoose from 'mongoose'
import { connectTestDB, clearTestDB, disconnectTestDB } from '../setup/db.js'
import { User } from '../../src/models/User.js'
import { Category } from '../../src/models/Category.js'
import { Destination } from '../../src/models/Destination.js'
import { Tour } from '../../src/models/Tour.js'
import { Booking } from '../../src/models/Booking.js'
import { Review } from '../../src/models/Review.js'

beforeAll(async () => {
  await connectTestDB()
  // Mongoose builds indexes in the background after connecting; the
  // unique-booking test below needs the unique index to actually exist
  // before it asserts the duplicate write is rejected.
  await Promise.all(
    [User, Category, Destination, Tour, Booking, Review].map((model) => model.init()),
  )
}, 60_000)

afterEach(async () => {
  await clearTestDB()
})

afterAll(async () => {
  await disconnectTestDB()
})

async function seedTourWithBookings(bookingCount) {
  const admin = await User.create({
    name: 'Admin',
    email: 'admin@wanderly.test',
    password: 'password123',
  })
  const category = await Category.create({ name: 'Adventure' })
  const destination = await Destination.create({ name: 'Bali', country: 'Indonesia' })

  const tour = await Tour.create({
    title: 'Bali Adventure Tour',
    summary: 'A short summary',
    description: 'A long description',
    category: category._id,
    destinations: [destination._id],
    duration: { days: 5, nights: 4 },
    price: 100000,
    maxGroupSize: 12,
    createdBy: admin._id,
    startDates: [{ date: new Date('2026-08-01'), availableSeats: 10 }],
  })

  const guest = await User.create({
    name: 'Guest',
    email: 'guest@wanderly.test',
    password: 'password123',
  })

  const bookings = []
  for (let i = 0; i < bookingCount; i += 1) {
    bookings.push(
      await Booking.create({
        user: guest._id,
        tour: tour._id,
        tourStartDateId: tour.startDates[0]._id,
        tourStartDate: tour.startDates[0].date,
        travelers: { adults: 1 },
        totalAmount: 100000,
        currency: 'USD',
        status: 'completed',
      }),
    )
  }

  return { tour, guest, bookings }
}

describe('Review -> Tour rating sync', () => {
  it('updates avgRating/ratingsCount when a review is created via save()', async () => {
    const { tour, guest, bookings } = await seedTourWithBookings(2)

    await Review.create({
      user: guest._id,
      tour: tour._id,
      booking: bookings[0]._id,
      rating: 4,
      comment: 'Good trip',
    })
    await Review.create({
      user: guest._id,
      tour: tour._id,
      booking: bookings[1]._id,
      rating: 5,
      comment: 'Loved it',
    })

    const updatedTour = await Tour.findById(tour._id)
    expect(updatedTour.avgRating).toBe(4.5)
    expect(updatedTour.ratingsCount).toBe(2)
  })

  it('re-syncs when a review is edited via save()', async () => {
    const { tour, guest, bookings } = await seedTourWithBookings(1)
    const review = await Review.create({
      user: guest._id,
      tour: tour._id,
      booking: bookings[0]._id,
      rating: 3,
      comment: 'Okay',
    })

    review.rating = 5
    await review.save()

    const updatedTour = await Tour.findById(tour._id)
    expect(updatedTour.avgRating).toBe(5)
  })

  it('re-syncs when a review is edited via findByIdAndUpdate', async () => {
    const { tour, guest, bookings } = await seedTourWithBookings(1)
    const review = await Review.create({
      user: guest._id,
      tour: tour._id,
      booking: bookings[0]._id,
      rating: 2,
      comment: 'Meh',
    })

    await Review.findByIdAndUpdate(review._id, { rating: 4 })

    const updatedTour = await Tour.findById(tour._id)
    expect(updatedTour.avgRating).toBe(4)
  })

  it('re-syncs when a review is deleted via findByIdAndDelete', async () => {
    const { tour, guest, bookings } = await seedTourWithBookings(2)
    const reviewA = await Review.create({
      user: guest._id,
      tour: tour._id,
      booking: bookings[0]._id,
      rating: 2,
      comment: 'Meh',
    })
    await Review.create({
      user: guest._id,
      tour: tour._id,
      booking: bookings[1]._id,
      rating: 4,
      comment: 'Good',
    })

    await Review.findByIdAndDelete(reviewA._id)

    const updatedTour = await Tour.findById(tour._id)
    expect(updatedTour.avgRating).toBe(4)
    expect(updatedTour.ratingsCount).toBe(1)
  })

  it('resets avgRating/ratingsCount to 0 when the last review is removed via deleteOne()', async () => {
    const { tour, guest, bookings } = await seedTourWithBookings(1)
    const review = await Review.create({
      user: guest._id,
      tour: tour._id,
      booking: bookings[0]._id,
      rating: 5,
      comment: 'Great',
    })

    await review.deleteOne()

    const updatedTour = await Tour.findById(tour._id)
    expect(updatedTour.avgRating).toBe(0)
    expect(updatedTour.ratingsCount).toBe(0)
  })

  it('rejects a second review against the same booking (unique index)', async () => {
    const { tour, guest, bookings } = await seedTourWithBookings(1)
    await Review.create({
      user: guest._id,
      tour: tour._id,
      booking: bookings[0]._id,
      rating: 5,
      comment: 'Great',
    })

    await expect(
      Review.create({
        user: guest._id,
        tour: tour._id,
        booking: bookings[0]._id,
        rating: 1,
        comment: 'Again',
      }),
    ).rejects.toThrow()
  })
})

afterAll(() => {
  mongoose.connection.removeAllListeners()
})
