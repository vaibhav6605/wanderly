import { axiosClient } from './axiosClient'

const unwrap = (r) => r.data

export const adminApi = {
  getOverview: () => axiosClient.get('/admin/analytics/overview').then(unwrap),
  getTrends: (days = 30) => axiosClient.get('/admin/analytics/trends', { params: { days } }).then(unwrap),
  getTopTours: (limit = 5) => axiosClient.get('/admin/analytics/top-tours', { params: { limit } }).then(unwrap),
}
