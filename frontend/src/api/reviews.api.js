import { axiosClient } from './axiosClient'

const unwrap = (r) => r.data

export const reviewsApi = {
  listReviews: (params = {}) => axiosClient.get('/reviews', { params }).then(unwrap),
  getMyStatus: (tourId) => axiosClient.get('/reviews/my-status', { params: { tourId } }).then(unwrap),
  createReview: (data) => axiosClient.post('/reviews', data).then(unwrap),
  updateReview: (id, data) => axiosClient.patch(`/reviews/${id}`, data).then(unwrap),
  approveReview: (id, isApproved) => axiosClient.patch(`/reviews/${id}/approve`, { isApproved }).then(unwrap),
  deleteReview: (id) => axiosClient.delete(`/reviews/${id}`).then(unwrap),
}
