import { useEffect, useState } from 'react'
import {
  useLocation,
  useNavigate,
} from 'react-router-dom'

import {
  getChapterBookmark,
  removeChapterBookmark,
  saveChapterBookmark,
} from '../../api/bookmarkApi.js'
import { useAuth } from '../../auth/useAuth.js'
import '../../styles/bookmark.css'


function BookmarkIcon({ filled }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
    </svg>
  )
}

export function BookmarkButton({ chapterId, getPosition }) {

  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [isBookmarked, setIsBookmarked] =
    useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
  let active = true

  if (!user || !chapterId) {
    Promise.resolve().then(() => {
      if (active) {
        setMessage('')
        setIsBookmarked(false)
      }
    })

    return () => {
      active = false
    }
  }

  getChapterBookmark(chapterId)
    .then((data) => {
      if (active) {
        setMessage('')
        setIsBookmarked(Boolean(data?.is_bookmarked))
      }
    })
    .catch(() => {
      if (active) {
        setMessage('')
        setIsBookmarked(false)
      }
    })

  return () => {
    active = false
  }
}, [chapterId, user])

  const handleToggleBookmark = async () => {
    if (!user) {
      navigate('/login', {
        state: {
          from: location.pathname,
        },
      })

      return
    }

    setLoading(true)
    setMessage('')

    try {
      if (isBookmarked) {
        await removeChapterBookmark(chapterId)

        setIsBookmarked(false)
        setMessage('Đã bỏ đánh dấu chương.')
      } else {
        const position = getPosition?.() || { position_offset: 0 }

        await saveChapterBookmark(chapterId, {
          position_offset: position.position_offset,
          note: null,
        })

        setIsBookmarked(true)
        setMessage('Đã đánh dấu chương.')
      }
    } catch (error) {
      setMessage(
        error.message ||
          'Không thể cập nhật đánh dấu.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="reader-bookmark-control">
      <button
        type="button"
        className={`chapter-bookmark-button ${
          isBookmarked ? 'active' : ''
        }`}
        onClick={handleToggleBookmark}
        disabled={loading}
        aria-pressed={isBookmarked}
      >
        <BookmarkIcon filled={isBookmarked} />

        {loading
          ? 'Đang lưu...'
          : isBookmarked
            ? 'Đã đánh dấu'
            : 'Đánh dấu'}
      </button>

      {message && (
        <span className="reader-bookmark-message">
          {message}
        </span>
      )}
    </div>
  )
}