import { axiosClient } from './axiosClient'

const unwrap = (r) => r.data

export const paymentsApi = {
  createIntent: (bookingId) =>
    axiosClient.post('/payments/create-intent', { bookingId }).then(unwrap),

  listPayments: (params = {}) =>
    axiosClient.get('/payments', { params }).then(unwrap),

  getInvoice: (bookingId) =>
    axiosClient.get(`/payments/${bookingId}/invoice`).then(unwrap),

  createRefund: (bookingId, amount, reason) =>
    axiosClient.post(`/payments/${bookingId}/refund`, { amount, reason }).then(unwrap),
}
