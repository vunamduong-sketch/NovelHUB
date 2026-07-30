import { api } from '../api/client.js'

function messageFrom(error) {
  const detail = error.response?.data?.detail
  if (Array.isArray(detail)) return detail[0]?.msg ?? 'Please review the form fields.'
  return detail || 'Unable to reach NovelHUB. Please try again.'
}

async function authPost(path, payload) {
  try { return (await api.post(path, payload, { skipAuthRefresh: true })).data } catch (error) { throw new Error(messageFrom(error), { cause: error }) }
}

export function registerAccount(payload) { return authPost('/auth/register', payload) }
export async function loginAccount(identity, password) {
  try { return await authPost('/auth/login', { identity, password }) } catch (error) {
    if (error.cause?.response?.status === 401) throw new Error('Incorrect email/username or password.', { cause: error })
    throw error
  }
}
export function refreshSession(refreshToken) { return authPost('/auth/refresh', { refresh_token: refreshToken }) }
export async function logoutAccount(refreshToken) {
  try { await authPost('/auth/logout', { refresh_token: refreshToken }) } catch { /* local session must still be cleared */ }
}
export function requestPasswordReset(email) { return authPost('/auth/password-reset/request', { email }) }
export function confirmPasswordReset(token, newPassword) { return authPost('/auth/password-reset/confirm', { token, new_password: newPassword }) }

export async function fetchUserProfile() {
  try {
    const response = await api.get('/users/me')
    return response.data
  } catch (error) {
    throw new Error(messageFrom(error), { cause: error })
  }
}
