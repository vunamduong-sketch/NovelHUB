import axios from 'axios'
import { clearSession, getSession, saveSession } from '../auth/sessionStore.js'

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
export const api = axios.create({ baseURL: configuredBaseUrl ? `${configuredBaseUrl}/api/v1` : '/api/v1' })

let refreshPromise = null

api.interceptors.request.use((config) => {
  const accessToken = getSession()?.access_token
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

api.interceptors.response.use(undefined, async (error) => {
  const request = error.config
  const session = getSession()
  if (error.response?.status !== 401 || request?.skipAuthRefresh || request?._retried || !session?.refresh_token) return Promise.reject(error)

  request._retried = true
  try {
    refreshPromise ??= api.post('/auth/refresh', { refresh_token: session.refresh_token }, { skipAuthRefresh: true })
      .then((response) => { saveSession(response.data); return response.data })
      .finally(() => { refreshPromise = null })
    const nextSession = await refreshPromise
    request.headers.Authorization = `Bearer ${nextSession.access_token}`
    return api(request)
  } catch (refreshError) {
    clearSession()
    return Promise.reject(refreshError)
  }
})
