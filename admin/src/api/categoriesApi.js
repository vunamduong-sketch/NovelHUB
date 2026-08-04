import { api, apiErrorMessage } from './client.js'

export async function fetchAdminCategories() {
  try {
    return (await api.get('/admin/categories')).data
  } catch (error) {
    throw new Error(apiErrorMessage(error), { cause: error })
  }
}

export async function createAdminCategory(payload) {
  try {
    return (await api.post('/admin/categories', payload)).data
  } catch (error) {
    throw new Error(apiErrorMessage(error), { cause: error })
  }
}

export async function updateAdminCategory(categoryId, payload) {
  try {
    return (await api.patch(`/admin/categories/${categoryId}`, payload)).data
  } catch (error) {
    throw new Error(apiErrorMessage(error), { cause: error })
  }
}

export async function deleteAdminCategory(categoryId) {
  try {
    return (await api.delete(`/admin/categories/${categoryId}`)).data
  } catch (error) {
    throw new Error(apiErrorMessage(error), { cause: error })
  }
}
