import * as couponsService from './coupons.service.js'
import { ApiResponse } from '#utils/ApiResponse.js'
import { asyncHandler } from '#utils/asyncHandler.js'

export const listCoupons = asyncHandler(async (req, res) => {
  const { coupons, meta } = await couponsService.listCoupons(req.query)
  ApiResponse.send(res, 200, { coupons }, meta)
})

export const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await couponsService.createCoupon(req.body)
  ApiResponse.send(res, 201, { coupon })
})

export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await couponsService.updateCoupon(req.params.id, req.body)
  ApiResponse.send(res, 200, { coupon })
})

export const deleteCoupon = asyncHandler(async (req, res) => {
  await couponsService.deleteCoupon(req.params.id)
  ApiResponse.send(res, 200, { message: 'Coupon deleted' })
})
