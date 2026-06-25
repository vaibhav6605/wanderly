import axios from 'axios'

// withCredentials lets the browser send the httpOnly refresh-token cookie
// on cross-origin requests; the access token is attached per-request by
// the auth feature once login/refresh flows are implemented.
export const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
})
