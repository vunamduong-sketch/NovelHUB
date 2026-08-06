import { api } from './client.js'

function messageFrom(error) {
  const detail = error.response?.data?.detail

  if (typeof detail === 'string') {
    if (detail.includes('Chapter is not available')) {
      return 'Chương không tồn tại hoặc chưa được xuất bản.'
    }

    return detail
  }

  if (Array.isArray(detail)) {
    return detail[0]?.msg || 'Dữ liệu không hợp lệ.'
  }

  return 'Không thể kết nối đến máy chủ NovelHUB. Vui lòng thử lại sau.'
}

export async function recordReadingProgress(
  chapterId,
  { position_offset = 0, progress_percent = 0 } = {},
) {
  const normalizedPercent = Number(progress_percent)

  try {
    const response = await api.put(
      `/chapters/${chapterId}/reading-progress`,
      {
        position_offset: Math.max(0, Math.round(position_offset)),
        progress_percent: Math.max(
          0,
          Math.min(100, Number(normalizedPercent.toFixed(2))),
        ),
      },
    )

    return response.data
  } catch (error) {
    throw new Error(messageFrom(error), { cause: error })
  }
}

export async function fetchReadingHistory() {
  try {
    const response = await api.get('/reading-history')
    return response.data
  } catch (error) {
    throw new Error(messageFrom(error), { cause: error })
  }
}