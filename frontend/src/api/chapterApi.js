import { api } from './client.js'

function translateErrorMessage(msg) {
  if (!msg || typeof msg !== 'string') return null
  const trimmed = msg.trim()
  if (trimmed.includes('Chapter number') && trimmed.includes('already exists')) {
    return 'Số chương này đã tồn tại trong bộ truyện.'
  }
  if (trimmed.includes('Chapter title is required before publishing')) {
    return 'Cần nhập tiêu đề chương trước khi xuất bản.'
  }
  if (trimmed.includes('Chapter is not available')) {
    return 'Chương không tồn tại hoặc đã bị gỡ bỏ.'
  }
  if (trimmed.includes('Novel is not available')) {
    return 'Truyện không tồn tại hoặc đã bị gỡ bỏ.'
  }
  if (trimmed.includes('Title must not be empty')) {
    return 'Tiêu đề chương không được để trống.'
  }
  if (trimmed.includes('At least one field must be provided')) {
    return 'Vui lòng thay đổi ít nhất một thông tin trước khi cập nhật.'
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

export async function fetchPublicChapters(novelId) {
  try {
    const response = await api.get(`/novels/${novelId}/chapters`)
    return response.data
  } catch {
    return []
  }
}

export async function fetchMyChapters(novelId) {
  try {
    const response = await api.get(`/novels/${novelId}/chapters/me`)
    return response.data
  } catch (error) {
    throw new Error(messageFrom(error), { cause: error })
  }
}

export async function getPublicChapterDetail(chapterId) {
  try {
    const response = await api.get(`/chapters/${chapterId}`)
    return response.data
  } catch (error) {
    throw new Error(messageFrom(error), { cause: error })
  }
}

export async function getAuthorChapterDetail(chapterId) {
  try {
    const response = await api.get(`/chapters/${chapterId}/author`)
    return response.data
  } catch (error) {
    throw new Error(messageFrom(error), { cause: error })
  }
}

export async function createChapter(novelId, { title, chapter_number, content, summary, status = 'draft' }) {
  try {
    const payload = {
      title,
      chapter_number: parseFloat(chapter_number),
      content: content || '',
      summary: summary || null,
      status,
    }
    const response = await api.post(`/novels/${novelId}/chapters`, payload)
    return response.data
  } catch (error) {
    throw new Error(messageFrom(error), { cause: error })
  }
}

export async function updateChapter(chapterId, fields) {
  try {
    const payload = {}
    if (fields.title !== undefined) payload.title = fields.title
    if (fields.chapter_number !== undefined) payload.chapter_number = parseFloat(fields.chapter_number)
    if (fields.content !== undefined) payload.content = fields.content || ''
    if (fields.summary !== undefined) payload.summary = fields.summary || null
    if (fields.status !== undefined) payload.status = fields.status

    const response = await api.patch(`/chapters/${chapterId}`, payload)
    return response.data
  } catch (error) {
    throw new Error(messageFrom(error), { cause: error })
  }
}

export async function deleteChapter(chapterId) {
  try {
    const response = await api.delete(`/chapters/${chapterId}`)
    return response.data
  } catch (error) {
    throw new Error(messageFrom(error), { cause: error })
  }
}

export async function publishChapter(chapterId) {
  try {
    const response = await api.post(`/chapters/${chapterId}/publish`)
    return response.data
  } catch (error) {
    throw new Error(messageFrom(error), { cause: error })
  }
}
