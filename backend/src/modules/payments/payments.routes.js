import { Router } from 'express'
import * as paymentsController from './payments.controller.js'
import {
  createIntentSchema,
  refundSchema,
  listPaymentsSchema,
  bookingParamSchema,
} from './payments.validation.js'
import { validate } from '#middlewares/validate.js'
import { authenticate } from '#middlewares/authenticate.js'
import { requirePermission } from '#middlewares/requirePermission.js'
import { PERMISSIONS } from '#config/permissions.js'

const router = Router()

router.use(authenticate)

// Create PaymentIntent — any authenticated user for their own booking
router.post(
  '/create-intent',
  requirePermission(PERMISSIONS.BOOK_TOURS),
  validate(createIntentSchema),
  paymentsController.createPaymentIntent,
)

// Payment history — own records; admin can see all
router.get(
  '/',
  validate(listPaymentsSchema),
  paymentsController.listPayments,
)

// Invoice — booking owner or admin
router.get(
  '/:bookingId/invoice',
  validate(bookingParamSchema),
  paymentsController.getInvoice,
)

// Refund — admin only
router.post(
  '/:bookingId/refund',
  requirePermission(PERMISSIONS.MANAGE_PAYMENTS),
  validate(refundSchema),
  paymentsController.createRefund,
)

export default router
