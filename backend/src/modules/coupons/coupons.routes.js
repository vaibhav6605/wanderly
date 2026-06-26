import { Router } from 'express'
import * as couponsController from './coupons.controller.js'
import {
  createCouponSchema,
  updateCouponSchema,
  couponIdSchema,
  listCouponsSchema,
} from './coupons.validation.js'
import { validate } from '#middlewares/validate.js'
import { authenticate } from '#middlewares/authenticate.js'
import { requirePermission } from '#middlewares/requirePermission.js'
import { PERMISSIONS } from '#config/permissions.js'

const router = Router()
const adminOnly = [authenticate, requirePermission(PERMISSIONS.MANAGE_COUPONS)]

router.get('/', ...adminOnly, validate(listCouponsSchema), couponsController.listCoupons)
router.post('/', ...adminOnly, validate(createCouponSchema), couponsController.createCoupon)
router.patch('/:id', ...adminOnly, validate(updateCouponSchema), couponsController.updateCoupon)
router.delete('/:id', ...adminOnly, validate(couponIdSchema), couponsController.deleteCoupon)

export default router
