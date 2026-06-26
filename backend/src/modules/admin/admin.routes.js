import { Router } from 'express'
import * as adminController from './admin.controller.js'
import { authenticate } from '#middlewares/authenticate.js'
import { requirePermission } from '#middlewares/requirePermission.js'
import { PERMISSIONS } from '#config/permissions.js'

const router = Router()

const adminOnly = [authenticate, requirePermission(PERMISSIONS.MANAGE_TOURS)]

router.get('/analytics/overview', ...adminOnly, adminController.overview)
router.get('/analytics/trends', ...adminOnly, adminController.trends)
router.get('/analytics/top-tours', ...adminOnly, adminController.topTours)

export default router
