import * as bookingsService from './bookings.service.js'
import { ApiResponse } from '#utils/ApiResponse.js'
import { asyncHandler } from '#utils/asyncHandler.js'
import { PERMISSIONS } from '#config/permissions.js'
import { roleHasPermission } from '#config/permissions.js'

const isAdmin = (req) => roleHasPermission(req.user?.role, PERMISSIONS.MANAGE_BOOKINGS)

export const createBooking = asyncHandler(async (req, res) => {
  const booking = await bookingsService.createBooking({
    userId: req.user.id,
    ...req.body,
  })
  ApiResponse.send(res, 201, { booking })
})

export const validateCoupon = asyncHandler(async (req, res) => {
  const { code, tourId, baseAmount } = req.body
  const { coupon, discountAmount } = await bookingsService.validateCoupon({
    code,
    tourId,
    baseAmount,
    userId: req.user.id,
  })
  ApiResponse.send(res, 200, {
    coupon: {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscountAmount: coupon.maxDiscountAmount,
    },
    discountAmount,
  })
})

export const listBookings = asyncHandler(async (req, res) => {
  const { bookings, meta } = await bookingsService.listBookings({
    userId: req.user.id,
    isAdmin: isAdmin(req),
    ...req.query,
  })
  ApiResponse.send(res, 200, { bookings }, meta)
})

export const getBooking = asyncHandler(async (req, res) => {
  const booking = await bookingsService.getBooking(req.params.id, req.user.id, isAdmin(req))
  ApiResponse.send(res, 200, { booking })
})

export const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await bookingsService.cancelBooking(
    req.params.id,
    req.user.id,
    isAdmin(req),
    req.body.reason,
  )
  ApiResponse.send(res, 200, { booking })
})
