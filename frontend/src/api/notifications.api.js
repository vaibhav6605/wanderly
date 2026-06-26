import { axiosClient } from './axiosClient'

const unwrap = (r) => r.data

export const notificationsApi = {
  listNotifications: (params = {}) => axiosClient.get('/notifications', { params }).then(unwrap),
  getUnreadCount: () => axiosClient.get('/notifications/unread-count').then(unwrap),
  markRead: (id) => axiosClient.patch(`/notifications/${id}/read`).then(unwrap),
  markAllRead: () => axiosClient.patch('/notifications/read-all').then(unwrap),
  sendNotification: (data) => axiosClient.post('/notifications', data).then(unwrap),
}
