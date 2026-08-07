import { api } from './client.js'


function getErrorMessage(error) {
  const detail = error.response?.data?.detail

  if (typeof detail === 'string') {
    return detail
  }

  if (Array.isArray(detail)) {
    return detail[0]?.msg || 'Du lieu khong hop le.'
  }

  return 'Khong the ket noi toi may chu. Vui long thu lai.'
}


async function request(call) {
  try {
    const response = await call()
    return response.data
  } catch (error) {
    throw new Error(getErrorMessage(error), { cause: error })
  }
}


export function fetchChapterComments(chapterId) {
  return request(() => api.get(`/chapters/${chapterId}/comments`))
}


export function createChapterComment(chapterId, content) {
  return request(() => api.post(`/chapters/${chapterId}/comments`, { content }))
}


export function replyComment(commentId, content) {
  return request(() => api.post(`/comments/${commentId}/replies`, { content }))
}


export function getNovelRatingStatus(novelId) {
  return request(() => api.get(`/novels/${novelId}/rating`))
}


export function rateNovel(novelId, { score, review_text = null }) {
  return request(() => api.put(`/novels/${novelId}/rating`, {
    score,
    review_text,
  }))
}


export function followNovel(novelId, notifications_enabled = true) {
  return request(() => api.put(`/novels/${novelId}/follow`, {
    notifications_enabled,
  }))
}


export function unfollowNovel(novelId) {
  return request(() => api.delete(`/novels/${novelId}/follow`))
}


export function followAuthor(authorId, notifications_enabled = true) {
  return request(() => api.put(`/authors/${authorId}/follow`, {
    notifications_enabled,
  }))
}


export function unfollowAuthor(authorId) {
  return request(() => api.delete(`/authors/${authorId}/follow`))
}


export function fetchFollowedNovels() {
  return request(() => api.get('/me/followed-novels'))
}


export function fetchFollowedAuthors() {
  return request(() => api.get('/me/followed-authors'))
}

