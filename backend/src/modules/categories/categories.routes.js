import { Router } from 'express'
import * as categoriesController from './categories.controller.js'
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
} from './categories.validation.js'
import { validate } from '#middlewares/validate.js'
import { authenticate } from '#middlewares/authenticate.js'
import { requirePermission } from '#middlewares/requirePermission.js'
import { PERMISSIONS } from '#config/permissions.js'

const router = Router()
const adminOnly = [authenticate, requirePermission(PERMISSIONS.MANAGE_CATEGORIES)]

router.get('/', categoriesController.listCategories)

router.post('/', ...adminOnly, validate(createCategorySchema), categoriesController.createCategory)

router.patch(
  '/:id',
  ...adminOnly,
  validate(updateCategorySchema),
  categoriesController.updateCategory,
)

router.delete(
  '/:id',
  ...adminOnly,
  validate(categoryIdSchema),
  categoriesController.deleteCategory,
)

export default router
