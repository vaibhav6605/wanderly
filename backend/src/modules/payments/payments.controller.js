import * as paymentsService from './payments.service.js'
import { ApiResponse } from '#utils/ApiResponse.js'
import { asyncHandler } from '#utils/asyncHandler.js'
import { roleHasPermission } from '#config/permissions.js'
import { PERMISSIONS } from '#config/permissions.js'

const isAdmin = (req) => roleHasPermission(req.user?.role, PERMISSIONS.MANAGE_PAYMENTS)

export const createPaymentIntent = asyncHandler(async (req, res) => {
  const { clientSecret } = await paymentsService.createPaymentIntent(
    req.body.bookingId,
    req.user.id,
  )
  ApiResponse.send(res, 200, { clientSecret })
})

export const listPayments = asyncHandler(async (req, res) => {
  const { payments, meta } = await paymentsService.listPayments({
    userId: req.user.id,
    isAdmin: isAdmin(req),
    ...req.query,
  })
  ApiResponse.send(res, 200, { payments }, meta)
})

export const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await paymentsService.getInvoice(
    req.params.bookingId,
    req.user.id,
    isAdmin(req),
  )
  ApiResponse.send(res, 200, { invoice })
})

export const createRefund = asyncHandler(async (req, res) => {
  const { payment } = await paymentsService.createRefund(
    req.params.bookingId,
    req.body.amount,
    req.body.reason,
  )
  ApiResponse.send(res, 200, { payment })
})
