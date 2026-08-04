import { api, apiErrorMessage } from './client.js'

export async function fetchAdminTags() {
  try {
    return (await api.get('/admin/tags')).data
  } catch (error) {
    throw new Error(apiErrorMessage(error), { cause: error })
  }
}

export async function createAdminTag(payload) {
  try {
    return (await api.post('/admin/tags', payload)).data
  } catch (error) {
    throw new Error(apiErrorMessage(error), { cause: error })
  }
}

export async function updateAdminTag(tagId, payload) {
  try {
    return (await api.patch(`/admin/tags/${tagId}`, payload)).data
  } catch (error) {
    throw new Error(apiErrorMessage(error), { cause: error })
  }
}

export async function deleteAdminTag(tagId) {
  try {
    return (await api.delete(`/admin/tags/${tagId}`)).data
  } catch (error) {
    throw new Error(apiErrorMessage(error), { cause: error })
  }
}
