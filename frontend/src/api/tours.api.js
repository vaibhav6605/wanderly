import { axiosClient } from './axiosClient'
import { apiCache } from './apiCache'

// TTLs in ms — tune to match how frequently data actually changes
const TTL = {
  LIST:       60_000,       // tour list: 60 s
  CATEGORIES: 5 * 60_000,  // categories: 5 min
  DETAIL:     2 * 60_000,  // single tour: 2 min
  RELATED:    5 * 60_000,  // related tours: 5 min
}

export const toursApi = {
  listTours: async (params = {}) => {
    const key = `list:${JSON.stringify(params)}`
    const cached = apiCache.get(key)
    if (cached) return cached

    const res = await axiosClient.get('/tours', { params })
    const data = { tours: res.data.data.tours, meta: res.data.meta }
    apiCache.set(key, data, TTL.LIST)
    return data
  },

  getCategories: async () => {
    const cached = apiCache.get('categories')
    if (cached) return cached

    const data = await axiosClient.get('/tours/categories').then((r) => r.data.data.categories)
    apiCache.set('categories', data, TTL.CATEGORIES)
    return data
  },

  getDestinations: (params) =>
    axiosClient.get('/tours/destinations', { params }).then((r) => r.data.data.destinations),

  getRecommended: () =>
    axiosClient.get('/tours/recommended').then((r) => r.data.data.tours),

  getTour: async (id) => {
    const key = `detail:${id}`
    const cached = apiCache.get(key)
    if (cached) return cached

    const data = await axiosClient.get(`/tours/${id}`).then((r) => r.data.data.tour)
    apiCache.set(key, data, TTL.DETAIL)
    return data
  },

  getRelatedTours: async (id) => {
    const key = `related:${id}`
    const cached = apiCache.get(key)
    if (cached) return cached

    const data = await axiosClient.get(`/tours/${id}/related`).then((r) => r.data.data.tours)
    apiCache.set(key, data, TTL.RELATED)
    return data
  },

  createTour: async (data) => {
    const result = await axiosClient.post('/tours', data).then((r) => r.data.data.tour)
    // Invalidate list cache so fresh data appears immediately
    apiCache.invalidatePrefix('list:')
    return result
  },

  updateTour: async (id, data) => {
    const result = await axiosClient.patch(`/tours/${id}`, data).then((r) => r.data.data.tour)
    apiCache.invalidatePrefix('list:')
    apiCache.delete(`detail:${id}`)
    return result
  },

  deleteTour: async (id) => {
    const result = await axiosClient.delete(`/tours/${id}`).then((r) => r.data)
    apiCache.invalidatePrefix('list:')
    apiCache.delete(`detail:${id}`)
    return result
  },
}
