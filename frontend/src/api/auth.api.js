import { authAxios } from './authAxios'

const unwrap = (res) => res.data.data

export const authApi = {
  register: (data) => authAxios.post('/auth/register', data).then(unwrap),
  login: (data) => authAxios.post('/auth/login', data).then(unwrap),
  logout: () => authAxios.post('/auth/logout').then((r) => r.data),
  refresh: () => authAxios.post('/auth/refresh').then(unwrap),
  me: (token) =>
    authAxios
      .get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(unwrap),
  forgotPassword: (data) => authAxios.post('/auth/forgot-password', data).then((r) => r.data),
  resetPassword: (data) => authAxios.post('/auth/reset-password', data).then((r) => r.data),
  verifyEmail: (data) => authAxios.post('/auth/verify-email', data).then((r) => r.data),
  resendVerification: (token) =>
    authAxios
      .post('/auth/resend-verification', null, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => r.data),
}
