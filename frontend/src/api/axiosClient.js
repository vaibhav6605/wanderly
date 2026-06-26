import axios from 'axios'
import { authAxios } from './authAxios'
import { store } from '@/app/store'
import { setCredentials, clearCredentials } from '@/features/auth/authSlice'

export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
})

// Attach the current access token from Redux on every request
axiosClient.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Silent token refresh on 401
let isRefreshing = false
let queue = []

function processQueue(error, token = null) {
  queue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token)))
  queue = []
}

axiosClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }
    original._retry = true

    if (isRefreshing) {
      return new Promise((resolve, reject) => queue.push({ resolve, reject })).then((token) => {
        original.headers.Authorization = `Bearer ${token}`
        return axiosClient(original)
      })
    }

    isRefreshing = true
    try {
      // Use authAxios (no interceptors) to avoid an infinite loop
      const { data } = await authAxios.post('/auth/refresh')
      const { accessToken, user } = data.data
      store.dispatch(setCredentials({ accessToken, user }))
      processQueue(null, accessToken)
      original.headers.Authorization = `Bearer ${accessToken}`
      return axiosClient(original)
    } catch (refreshError) {
      store.dispatch(clearCredentials())
      processQueue(refreshError)
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)
