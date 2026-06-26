import { axiosClient } from './axiosClient'

const unwrap = (r) => r.data

export const wishlistApi = {
  getIds: () => axiosClient.get('/wishlist/ids').then(unwrap),
  listWishlist: (params = {}) => axiosClient.get('/wishlist', { params }).then(unwrap),
  add: (tourId) => axiosClient.post('/wishlist', { tourId }).then(unwrap),
  remove: (tourId) => axiosClient.delete(`/wishlist/${tourId}`).then(unwrap),
}
