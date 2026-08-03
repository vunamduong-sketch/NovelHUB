import { api, apiErrorMessage } from './client.js'

export async function fetchAdminNovels(params) {
  try {
    return (await api.get('/admin/novels', { params })).data
  } catch (error) {
    throw new Error(apiErrorMessage(error), { cause: error })
  }
}

export async function fetchAdminNovel(novelId) {
  try {
    return (await api.get(`/admin/novels/${novelId}`)).data
  } catch (error) {
    throw new Error(apiErrorMessage(error), { cause: error })
  }
}
