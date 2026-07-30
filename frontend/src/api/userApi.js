import { api } from './client.js'

function translateErrorMessage(msg) {
  if (!msg || typeof msg !== 'string') return null
  const trimmed = msg.trim()
  if (trimmed.includes('Current password is incorrect')) {
    return 'Mật khẩu hiện tại không chính xác.'
  }
  if (trimmed.includes('User is not available')) {
    return 'Tài khoản không tồn tại hoặc đã bị khóa.'
  }
  if (trimmed.includes('same as current') || trimmed.includes('same as the current')) {
    return 'Mật khẩu mới không được trùng với mật khẩu hiện tại.'
  }
  return null
}

function messageFrom(error) {
  const detail = error.response?.data?.detail
  if (Array.isArray(detail)) {
    const firstMsg = detail[0]?.msg
    const translated = translateErrorMessage(firstMsg)
    if (translated) return translated
    return firstMsg ?? 'Vui lòng kiểm tra lại các trường thông tin.'
  }
  if (typeof detail === 'string') {
    const translated = translateErrorMessage(detail)
    if (translated) return translated
    return detail
  }
  return 'Không thể kết nối đến máy chủ NovelHUB. Vui lòng thử lại sau.'
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
