import { api, apiErrorMessage } from './client.js'

export async function loginAdmin(identity, password) {
  try {
    const response = await api.post(
      '/auth/login',
      { identity, password },
      { skipAuthRefresh: true },
    )
    if (!response.data.user?.roles?.includes('admin')) {
      throw new Error('Tài khoản này không có quyền quản trị.')
    }
    return response.data
  } catch (error) {
    if (error instanceof Error && !error.response) throw error
    throw new Error(apiErrorMessage(error), { cause: error })
  }
}

export async function logoutAdmin(refreshToken) {
  if (!refreshToken) return
  try {
    await api.post(
      '/auth/logout',
      { refresh_token: refreshToken },
      { skipAuthRefresh: true },
    )
  } catch {
    // Local logout must still complete if the token is already invalid.
  }
}
