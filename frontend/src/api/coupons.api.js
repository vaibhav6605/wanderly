import { axiosClient } from './axiosClient'

const unwrap = (r) => r.data

export const couponsApi = {
  listCoupons: (params = {}) => axiosClient.get('/coupons', { params }).then(unwrap),
  createCoupon: (data) => axiosClient.post('/coupons', data).then(unwrap),
  updateCoupon: (id, data) => axiosClient.patch(`/coupons/${id}`, data).then(unwrap),
  deleteCoupon: (id) => axiosClient.delete(`/coupons/${id}`).then(unwrap),
}
