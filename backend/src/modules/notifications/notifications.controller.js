import * as notificationsService from './notifications.service.js'
import { ApiResponse } from '#utils/ApiResponse.js'
import { asyncHandler } from '#utils/asyncHandler.js'

export const listNotifications = asyncHandler(async (req, res) => {
  const { notifications, meta } = await notificationsService.listNotifications({
    userId: req.user.id,
    ...req.query,
  })
  ApiResponse.send(res, 200, { notifications }, meta)
})

export const markRead = asyncHandler(async (req, res) => {
  const notification = await notificationsService.markRead(req.params.id, req.user.id)
  ApiResponse.send(res, 200, { notification })
})

export const markAllRead = asyncHandler(async (req, res) => {
  await notificationsService.markAllRead(req.user.id)
  ApiResponse.send(res, 200, { message: 'All notifications marked as read' })
})

export const sendNotification = asyncHandler(async (req, res) => {
  const notification = await notificationsService.sendNotification(req.body)
  ApiResponse.send(res, 201, { notification })
})

export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await notificationsService.getUnreadCount(req.user.id)
  ApiResponse.send(res, 200, { unreadCount: count })
})
