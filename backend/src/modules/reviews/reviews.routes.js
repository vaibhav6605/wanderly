import { Router } from 'express'
import * as reviewsController from './reviews.controller.js'
import {
  listReviewsSchema,
  myStatusSchema,
  reviewIdSchema,
  approveReviewSchema,
  createReviewSchema,
  updateReviewSchema,
} from './reviews.validation.js'
import { validate } from '#middlewares/validate.js'
import { authenticate } from '#middlewares/authenticate.js'
import { requirePermission } from '#middlewares/requirePermission.js'
import { PERMISSIONS } from '#config/permissions.js'

const router = Router()

// Static paths BEFORE /:id
router.get('/', validate(listReviewsSchema), reviewsController.listReviews)

// my-status must come before /:id to avoid being shadowed
router.get(
  '/my-status',
  authenticate,
  requirePermission(PERMISSIONS.REVIEW_TOURS),
  validate(myStatusSchema),
  reviewsController.getMyStatus,
)

router.post(
  '/',
  authenticate,
  requirePermission(PERMISSIONS.REVIEW_TOURS),
  validate(createReviewSchema),
  reviewsController.createReview,
)

// Owner or admin — ownership enforced in service
router.patch(
  '/:id',
  authenticate,
  validate(updateReviewSchema),
  reviewsController.updateReview,
)

router.patch(
  '/:id/approve',
  authenticate,
  requirePermission(PERMISSIONS.MANAGE_REVIEWS),
  validate(approveReviewSchema),
  reviewsController.approveReview,
)

// Owner or admin — ownership enforced in service
router.delete(
  '/:id',
  authenticate,
  validate(reviewIdSchema),
  reviewsController.deleteReview,
)

export default router
