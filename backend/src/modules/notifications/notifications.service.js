import { Notification } from '#models/Notification.js'
import { ApiError } from '#utils/ApiError.js'

export async function listNotifications({ userId, isRead, page = 1, limit = 20 }) {
  const filter = { user: userId }
  if (isRead !== undefined) filter.isRead = isRead

  const [notifications, totalCount, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: userId, isRead: false }),
  ])

  return {
    notifications,
    meta: { page, limit, totalCount, totalPages: Math.ceil(totalCount / limit), unreadCount },
  }
}

export async function markRead(id, userId) {
  const notification = await Notification.findOneAndUpdate(
    { _id: id, user: userId },
    { isRead: true, readAt: new Date() },
    { new: true },
  )
  if (!notification) throw ApiError.notFound('Notification not found')
  return notification
}

export async function markAllRead(userId) {
  await Notification.updateMany(
    { user: userId, isRead: false },
    { isRead: true, readAt: new Date() },
  )
}

export async function sendNotification({ userId, type, title, message, relatedEntity }) {
  return Notification.create({ user: userId, type, title, message, relatedEntity })
}

export async function getUnreadCount(userId) {
  return Notification.countDocuments({ user: userId, isRead: false })
}
