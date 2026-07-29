import { api } from './client.js'

function messageFrom(error) {
  const detail = error.response?.data?.detail
  if (Array.isArray(detail)) return detail[0]?.msg ?? 'Vui lòng kiểm tra lại các trường thông tin.'
  return detail || 'Không thể kết nối đến máy chủ NovelHUB. Vui lòng thử lại sau.'
}

export async function fetchMyProfile() {
  try {
    const response = await api.get('/users/me')
    return response.data
  } catch (error) {
    throw new Error(messageFrom(error), { cause: error })
  }
}

export async function updateMyProfile({ display_name, bio, username }) {
  try {
    const payload = {}
    if (display_name !== undefined) payload.display_name = display_name
    if (bio !== undefined) payload.bio = bio
    if (username !== undefined) payload.username = username

    const response = await api.patch('/users/me', payload)
    return response.data
  } catch (error) {
    throw new Error(messageFrom(error), { cause: error })
  }
}

export async function uploadMyAvatar(file) {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.put('/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  } catch (error) {
    throw new Error(messageFrom(error), { cause: error })
  }
}

export async function changeMyPassword({ current_password, new_password }) {
  try {
    const response = await api.post('/users/me/change-password', {
      current_password,
      new_password,
    })
    return response.data
  } catch (error) {
    throw new Error(messageFrom(error), { cause: error })
  }
}
