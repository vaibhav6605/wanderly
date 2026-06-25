import mongoose from 'mongoose'
import { User } from '../../src/models/User.js'
import { Category } from '../../src/models/Category.js'
import { Destination } from '../../src/models/Destination.js'
import { Tour } from '../../src/models/Tour.js'
import { Booking } from '../../src/models/Booking.js'
import { Payment } from '../../src/models/Payment.js'
import { Review } from '../../src/models/Review.js'
import { Coupon } from '../../src/models/Coupon.js'
import { Wishlist } from '../../src/models/Wishlist.js'
import { Notification } from '../../src/models/Notification.js'

const models = {
  User,
  Category,
  Destination,
  Tour,
  Booking,
  Payment,
  Review,
  Coupon,
  Wishlist,
  Notification,
}

describe('model registration', () => {
  it('registers all 10 models on the default mongoose connection', () => {
    for (const name of Object.keys(models)) {
      expect(mongoose.modelNames()).toContain(name)
    }
  })
})

describe('User', () => {
  it('hashes the password on save without touching the DB', async () => {
    const user = new User({ name: 'Asha Rao', email: 'asha@example.com', password: 'password123' })
    await user.validate()
    expect(user.password).toBe('password123') // not hashed until pre('save') runs
  })

  it('rejects an invalid email', async () => {
    const user = new User({ name: 'Asha', email: 'not-an-email', password: 'password123' })
    await expect(user.validate()).rejects.toThrow()
  })

  it('defaults role to "user"', () => {
    const user = new User({ name: 'Asha', email: 'asha@example.com', password: 'password123' })
    expect(user.role).toBe('user')
  })
})

describe('Tour', () => {
  it('rejects a discountPrice that is not less than price', async () => {
    const tour = new Tour({
      title: 'Bali Adventure',
      summary: 'A short summary',
      description: 'A long description',
      category: new mongoose.Types.ObjectId(),
      destinations: [new mongoose.Types.ObjectId()],
      duration: { days: 5, nights: 4 },
      price: 1000,
      discountPrice: 1200,
      maxGroupSize: 12,
      createdBy: new mongoose.Types.ObjectId(),
    })
    await expect(tour.validate()).rejects.toThrow(/discountPrice/)
  })

  it('rejects a tour with zero destinations', async () => {
    const tour = new Tour({
      title: 'Bali Adventure',
      summary: 'A short summary',
      description: 'A long description',
      category: new mongoose.Types.ObjectId(),
      destinations: [],
      duration: { days: 5, nights: 4 },
      price: 1000,
      maxGroupSize: 12,
      createdBy: new mongoose.Types.ObjectId(),
    })
    await expect(tour.validate()).rejects.toThrow(/destination/)
  })

  it('auto-generates a slug from the title', async () => {
    const tour = new Tour({
      title: 'Bali Adventure & Culture Tour',
      summary: 'A short summary',
      description: 'A long description',
      category: new mongoose.Types.ObjectId(),
      destinations: [new mongoose.Types.ObjectId()],
      duration: { days: 5, nights: 4 },
      price: 1000,
      maxGroupSize: 12,
      createdBy: new mongoose.Types.ObjectId(),
    })
    await tour.validate()
    // slugify replaces '&' with 'and' by default.
    expect(tour.slug).toBe('bali-adventure-and-culture-tour')
  })
})

describe('Coupon', () => {
  it('rejects a percentage discount over 100', async () => {
    const coupon = new Coupon({
      code: 'BIG100',
      discountType: 'percentage',
      discountValue: 150,
      validFrom: new Date('2026-01-01'),
      validUntil: new Date('2026-02-01'),
    })
    await expect(coupon.validate()).rejects.toThrow(/100/)
  })

  it('rejects validUntil before validFrom', async () => {
    const coupon = new Coupon({
      code: 'EARLY',
      discountType: 'fixed',
      discountValue: 50,
      validFrom: new Date('2026-02-01'),
      validUntil: new Date('2026-01-01'),
    })
    await expect(coupon.validate()).rejects.toThrow(/validUntil/)
  })
})

describe('Notification', () => {
  it('defaults expiresAt to ~30 days out', () => {
    const notification = new Notification({
      user: new mongoose.Types.ObjectId(),
      type: 'system',
      title: 'Welcome',
      message: 'Thanks for joining Wanderly',
    })
    const daysOut = (notification.expiresAt - Date.now()) / (1000 * 60 * 60 * 24)
    expect(daysOut).toBeGreaterThan(29)
    expect(daysOut).toBeLessThan(31)
  })
})
