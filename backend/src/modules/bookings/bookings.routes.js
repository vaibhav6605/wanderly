import { Router } from 'express'
import * as bookingsController from './bookings.controller.js'
import {
  createBookingSchema,
  cancelBookingSchema,
  validateCouponSchema,
  listBookingsSchema,
  bookingIdSchema,
} from './bookings.validation.js'
import { validate } from '#middlewares/validate.js'
import { authenticate } from '#middlewares/authenticate.js'
import { requirePermission } from '#middlewares/requirePermission.js'
import { PERMISSIONS } from '#config/permissions.js'

const router = Router()

// All booking routes require authentication
router.use(authenticate)

// ── Coupon validation (before /:id to avoid shadowing) ────────────────────
router.post(
  '/validate-coupon',
  requirePermission(PERMISSIONS.BOOK_TOURS),
  validate(validateCouponSchema),
  bookingsController.validateCoupon,
)

// ── User: create & list own bookings ──────────────────────────────────────
router.post(
  '/',
  requirePermission(PERMISSIONS.BOOK_TOURS),
  validate(createBookingSchema),
  bookingsController.createBooking,
)

router.get(
  '/',
  validate(listBookingsSchema),
  bookingsController.listBookings,
)

// ── Single booking (ownership enforced in service) ────────────────────────
router.get(
  '/:id',
  validate(bookingIdSchema),
  bookingsController.getBooking,
)

router.post(
  '/:id/cancel',
  validate(cancelBookingSchema),
  bookingsController.cancelBooking,
)

export default router
