import { api } from './client.js'


function getErrorMessage(error) {
  const detail = error.response?.data?.detail

  if (typeof detail === 'string') {
    if (detail === 'Chapter is not available') {
      return 'Chương không tồn tại hoặc chưa được xuất bản.'
    }

    if (detail === 'Bookmark does not exist') {
      return 'Chương này chưa được đánh dấu.'
    }

    return detail
  }

  if (Array.isArray(detail)) {
    return detail[0]?.msg || 'Dữ liệu không hợp lệ.'
  }

  return 'Không thể kết nối tới máy chủ. Vui lòng thử lại.'
}


export async function getChapterBookmark(chapterId) {
  try {
    const response = await api.get(
      `/chapters/${chapterId}/bookmark`,
    )

    return response.data
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}


export async function saveChapterBookmark(
  chapterId,
  {
    position_offset = 0,
    note = null,
  } = {},
) {
  try {
    const response = await api.put(
      `/chapters/${chapterId}/bookmark`,
      {
        position_offset: Math.max(
          0,
          Math.round(position_offset),
        ),
        note,
      },
    )

    return response.data
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}


export async function removeChapterBookmark(chapterId) {
  try {
    const response = await api.delete(
      `/chapters/${chapterId}/bookmark`,
    )

    return response.data
  } catch (error) {
    throw new Error(getErrorMessage(error))
  }
}


export async function fetchNovelBookmarks(novelId) {
  try {
    const response = await api.get(
      `/novels/${novelId}/bookmarks`,
    )

    return response.data
  } catch (error) {
    throw new Error(
      getErrorMessage(error),
      { cause: error },
    )
  }
}