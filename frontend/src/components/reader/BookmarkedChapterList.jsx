import { useEffect, useState } from 'react'
import {
  Link,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import { fetchNovelBookmarks } from '../../api/bookmarkApi.js'
import { useAuth } from '../../auth/useAuth.js'
import '../../styles/bookmark.css'

function BookmarkIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" />
    </svg>
  )
}

export function BookmarkedChapterList({ novelId }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
  let active = true

  if (!user) {
    return () => {
      active = false
    }
  }

  Promise.resolve()
    .then(() => {
      if (!active) return null

      setLoading(true)
      setError('')

      return fetchNovelBookmarks(novelId)
    })
    .then((data) => {
      if (active && data !== null) {
        setBookmarks(data || [])
      }
    })
    .catch((requestError) => {
      if (active) {
        setError(
          requestError.message || 'Không thể tải chương đã đánh dấu.',
        )
      }
    })
    .finally(() => {
      if (active) {
        setLoading(false)
      }
    })

  return () => {
    active = false
  }
}, [novelId, user])

  if (!user) {
    return (
      <div className="empty-state-card bookmark-empty-state">
        <div className="empty-icon-circle">
          <BookmarkIcon />
        </div>

        <h3>Đăng nhập để xem chương đã đánh dấu</h3>

        <p>
          Danh sách đánh dấu được lưu riêng cho từng tài khoản.
        </p>

        <button
          type="button"
          className="primary-button"
          onClick={() =>
            navigate('/login', {
              state: {
                from: location.pathname,
              },
            })
          }
        >
          Đăng nhập
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="loading-state-card bookmark-state-card">
        <div className="spinner-ring" />
        <p>Đang tải chương đã đánh dấu...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="empty-state-card bookmark-state-card">
        <h3>Không thể tải danh sách</h3>
        <p>{error}</p>
      </div>
    )
  }

  if (bookmarks.length === 0) {
    return (
      <div className="empty-state-card bookmark-empty-state">
        <div className="empty-icon-circle">
          <BookmarkIcon />
        </div>

        <h3>Chưa đánh dấu chương nào</h3>

        <p>
          Trong trang đọc, nhấn “Đánh dấu” để lưu một chương vào đây.
        </p>
      </div>
    )
  }

  return (
    <div className="custom-chapter-section">
      <div className="chapter-vertical-list">
        {bookmarks.map((bookmark) => (
          <Link
            key={bookmark.chapter_id}
            to={`/novels/${novelId}/chapters/${bookmark.chapter_id}`}
            className="chapter-vertical-item bookmarked-chapter-item"
          >
            <div className="chapter-num-badge">
              {Number(bookmark.chapter_number)}
            </div>

            <div className="bookmarked-chapter-copy">
              <strong>
                {bookmark.chapter_title}
              </strong>

              <span>
                Đánh dấu ngày{' '}
                {new Date(
                  bookmark.updated_at,
                ).toLocaleDateString('vi-VN')}
              </span>
            </div>

            <BookmarkIcon />
          </Link>
        ))}
      </div>
    </div>
  )
}