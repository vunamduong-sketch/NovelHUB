import { api, apiErrorMessage } from './client.js'

export async function fetchAdminUsers(params) {
  try {
    return (await api.get('/admin/users', { params })).data
  } catch (error) {
    throw new Error(apiErrorMessage(error), { cause: error })
  }
}

export async function fetchAdminUser(userId) {
  try {
    return (await api.get(`/admin/users/${userId}`)).data
  } catch (error) {
    throw new Error(apiErrorMessage(error), { cause: error })
  }
}

export async function updateAdminUserRoles(userId, roles) {
  try {
    return (await api.patch(`/admin/users/${userId}/roles`, { roles })).data
  } catch (error) {
    throw new Error(apiErrorMessage(error), { cause: error })
  }
}
