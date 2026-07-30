import { api } from './client.js'

function translateErrorMessage(msg) {
  if (!msg || typeof msg !== 'string') return null
  const trimmed = msg.trim()
  if (trimmed.includes('Novel title is required before publishing')) {
    return 'Cần nhập tiêu đề truyện trước khi xuất bản.'
  }
  if (trimmed.includes('Novel is not available')) {
    return 'Truyện không tồn tại hoặc đã bị gỡ bỏ.'
  }
  if (trimmed.includes('Category is not available')) {
    return 'Thể loại đã chọn không khả dụng.'
  }
  if (trimmed.includes('One or more tags are not available')) {
    return 'Một hoặc nhiều thẻ (tag) đã chọn không tồn tại.'
  }
  if (trimmed.includes('Title must not be empty')) {
    return 'Tiêu đề truyện không được để trống.'
  }
  if (trimmed.includes('At least one field must be provided')) {
    return 'Vui lòng thay đổi ít nhất một thông tin trước khi cập nhật.'
  }
  if (trimmed.includes('String should have at most') || trimmed.includes('at most 65535') || trimmed.includes('65535 characters')) {
    return 'Đường dẫn hoặc tệp ảnh bìa quá lớn. Vui lòng chọn tệp ảnh dung lượng nhỏ hơn hoặc sử dụng đường dẫn ngắn hơn.'
  }
  return null
}

function messageFrom(error) {
  const detail = error.response?.data?.detail
  if (Array.isArray(detail)) {
    const firstMsg = detail[0]?.msg
    const translated = translateErrorMessage(firstMsg)
    if (translated) return translated
    return firstMsg ?? 'Vui lòng kiểm tra lại thông tin nhập vào.'
  }
  if (typeof detail === 'string') {
    const translated = translateErrorMessage(detail)
    if (translated) return translated
    return detail
  }
  return 'Không thể kết nối đến máy chủ NovelHUB. Vui lòng thử lại sau.'
}

export async function fetchPublicNovels(params = {}) {
  try {
    const response = await api.get('/novels/', { params })
    return response.data
  } catch (error) {
    return []
  }
}

export async function fetchMyNovels(params = {}) {
  try {
    const response = await api.get('/novels/me', { params })
    return response.data
  } catch (error) {
    throw new Error(messageFrom(error), { cause: error })
  }
}

export async function createNovel({ title, description, cover_url, language_code = 'vi', category_id = null, tag_ids = [] }) {
  try {
    const payload = {
      title,
      description: description || null,
      cover_url: cover_url || null,
      language_code,
    }
    if (category_id) payload.category_id = category_id
    if (Array.isArray(tag_ids) && tag_ids.length > 0) payload.tag_ids = tag_ids

    const response = await api.post('/novels/', payload)
    return response.data
  } catch (error) {
    throw new Error(messageFrom(error), { cause: error })
  }
}

export async function updateNovel(novelId, fields) {
  try {
    const payload = {}
    if (fields.title !== undefined) payload.title = fields.title
    if (fields.description !== undefined) payload.description = fields.description || null
    if (fields.cover_url !== undefined) payload.cover_url = fields.cover_url || null
    if (fields.status !== undefined) payload.status = fields.status
    if (fields.category_id !== undefined) payload.category_id = fields.category_id
    if (fields.tag_ids !== undefined) payload.tag_ids = fields.tag_ids

    const response = await api.patch(`/novels/${novelId}`, payload)
    return response.data
  } catch (error) {
    throw new Error(messageFrom(error), { cause: error })
  }
}

export async function deleteNovel(novelId) {
  try {
    const response = await api.delete(`/novels/${novelId}`)
    return response.data
  } catch (error) {
    throw new Error(messageFrom(error), { cause: error })
  }
}

export async function publishNovel(novelId) {
  try {
    const response = await api.post(`/novels/${novelId}/publish`)
    return response.data
  } catch (error) {
    throw new Error(messageFrom(error), { cause: error })
  }
}

export async function getNovelDetail(novelId) {
  try {
    const response = await api.get(`/novels/${novelId}`)
    return response.data
  } catch (error) {
    throw new Error(messageFrom(error), { cause: error })
  }
}

export async function fetchCategories() {
  try {
    const response = await api.get('/novels/categories')
    return response.data
  } catch (error) {
    return []
  }
}

export async function fetchTags() {
  try {
    const response = await api.get('/novels/tags')
    return response.data
  } catch (error) {
    return []
  }
}
