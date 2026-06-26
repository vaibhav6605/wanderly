import { axiosClient } from './axiosClient'

const unwrap = (r) => r.data

export const categoriesApi = {
  listCategories: () => axiosClient.get('/categories').then(unwrap),
  createCategory: (data) => axiosClient.post('/categories', data).then(unwrap),
  updateCategory: (id, data) => axiosClient.patch(`/categories/${id}`, data).then(unwrap),
  deleteCategory: (id) => axiosClient.delete(`/categories/${id}`).then(unwrap),
}
