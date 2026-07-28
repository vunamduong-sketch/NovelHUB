import axios from 'axios'

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
const api = axios.create({ baseURL: configuredBaseUrl ? `${configuredBaseUrl}/api/v1` : '/api/v1' })

function messageFrom(error) {
  const detail = error.response?.data?.detail
  if (Array.isArray(detail)) return detail[0]?.msg ?? 'Please review the form fields.'
  return detail || 'Unable to reach NovelHUB. Please try again.'
}

export async function registerAccount(payload) {
  try { return (await api.post('/auth/register', payload)).data } catch (error) { throw new Error(messageFrom(error), { cause: error }) }
}

export async function loginAccount(identity, password) {
  try { return (await api.post('/auth/login', { identity, password })).data } catch (error) {
    const message = error.response?.status === 401 ? 'Incorrect email/username or password.' : messageFrom(error)
    throw new Error(message, { cause: error })
  }
}

export async function refreshSession(refreshToken) {
  try { return (await api.post('/auth/refresh', { refresh_token: refreshToken })).data } catch (error) { throw new Error(messageFrom(error), { cause: error }) }
}

export async function logoutAccount(refreshToken) {
  try { await api.post('/auth/logout', { refresh_token: refreshToken }) } catch { /* local session must still be cleared */ }
}
