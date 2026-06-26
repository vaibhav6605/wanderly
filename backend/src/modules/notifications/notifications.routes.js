import { Router } from 'express'
import * as notificationsController from './notifications.controller.js'
import {
  listNotificationsSchema,
  notificationIdSchema,
  sendNotificationSchema,
} from './notifications.validation.js'
import { validate } from '#middlewares/validate.js'
import { authenticate } from '#middlewares/authenticate.js'
import { requirePermission } from '#middlewares/requirePermission.js'
import { PERMISSIONS } from '#config/permissions.js'

const router = Router()

router.use(authenticate)

router.get('/unread-count', notificationsController.getUnreadCount)
router.get('/', validate(listNotificationsSchema), notificationsController.listNotifications)
router.patch('/read-all', notificationsController.markAllRead)
router.patch('/:id/read', validate(notificationIdSchema), notificationsController.markRead)

router.post(
  '/',
  requirePermission(PERMISSIONS.MANAGE_USERS),
  validate(sendNotificationSchema),
  notificationsController.sendNotification,
)

export default router
