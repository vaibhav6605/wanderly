import { Router } from 'express'
import { z } from 'zod'
import * as wishlistController from './wishlist.controller.js'
import { validate } from '#middlewares/validate.js'
import { authenticate } from '#middlewares/authenticate.js'
import { requirePermission } from '#middlewares/requirePermission.js'
import { PERMISSIONS } from '#config/permissions.js'

const router = Router()

const paginationSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
  }),
})

const addSchema = z.object({
  body: z.object({ tourId: z.string().min(1) }),
})

const removeSchema = z.object({
  params: z.object({ tourId: z.string().min(1) }),
})

const guard = [authenticate, requirePermission(PERMISSIONS.MANAGE_WISHLIST)]

// /ids must come before /:tourId to avoid shadowing
router.get('/ids', ...guard, wishlistController.getWishlistIds)
router.get('/', ...guard, validate(paginationSchema), wishlistController.listWishlist)
router.post('/', ...guard, validate(addSchema), wishlistController.addToWishlist)
router.delete('/:tourId', ...guard, validate(removeSchema), wishlistController.removeFromWishlist)

export default router
