import { axiosClient } from './axiosClient'

const unwrap = (r) => r.data

export const bookingsApi = {
  createBooking: (data) =>
    axiosClient.post('/bookings', data).then(unwrap),

  listBookings: (params = {}) =>
    axiosClient.get('/bookings', { params }).then(unwrap),

  getBooking: (id) =>
    axiosClient.get(`/bookings/${id}`).then(unwrap),

  cancelBooking: (id, reason) =>
    axiosClient.post(`/bookings/${id}/cancel`, { reason }).then(unwrap),

  validateCoupon: (data) =>
    axiosClient.post('/bookings/validate-coupon', data).then(unwrap),
}
