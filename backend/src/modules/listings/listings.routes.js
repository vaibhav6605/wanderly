import { Router } from 'express'
import * as listingsController from './listings.controller.js'
import { createTourSchema, updateTourSchema, listToursSchema } from './listings.validation.js'
import { validate } from '#middlewares/validate.js'
import { authenticate } from '#middlewares/authenticate.js'
import { requirePermission } from '#middlewares/requirePermission.js'
import { PERMISSIONS } from '#config/permissions.js'

const router = Router()

// ── Reference data (no auth required) ─────────────────────────────────────
// Static paths MUST be registered before /:id to avoid being shadowed.
router.get('/categories', listingsController.getCategories)
router.get('/destinations', listingsController.getDestinations)
router.get('/recommended', listingsController.getRecommended)

// ── Public listing & detail ────────────────────────────────────────────────
router.get('/', validate(listToursSchema), listingsController.listTours)
router.get('/:id', listingsController.getTour)
router.get('/:id/related', listingsController.getRelatedTours)

// ── Admin: manage tours (authenticate → permission → validate → handler) ───
router.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_TOURS),
  validate(createTourSchema),
  listingsController.createTour,
)

router.patch(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_TOURS),
  validate(updateTourSchema),
  listingsController.updateTour,
)

router.delete(
  '/:id',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_TOURS),
  listingsController.deleteTour,
)

export default router
