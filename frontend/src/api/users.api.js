import { axiosClient } from './axiosClient'

const unwrap = (res) => res.data.data

export const usersApi = {
  listUsers: (params) => axiosClient.get('/users', { params }).then((r) => r.data),
  getUser: (id) => axiosClient.get(`/users/${id}`).then(unwrap),
  updateMe: (data) => axiosClient.patch('/users/me', data).then(unwrap),
  setBanned: (id, isBanned) => axiosClient.patch(`/users/${id}/ban`, { isBanned }).then(unwrap),
  setRole: (id, role) => axiosClient.patch(`/users/${id}/role`, { role }).then(unwrap),
}
