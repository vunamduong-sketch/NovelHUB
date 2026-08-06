import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { fetchReadingHistory } from '../../api/readingHistoryApi.js'
import { Footer } from '../../components/Footer.jsx'
import { Header } from '../../components/Header.jsx'
import '../../styles/reading-history.css'

function BookOpenIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  )
}

function formatDate(value) {
  if (!value) return ''

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function ReadingHistoryPage() {
  const navigate = useNavigate()

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    fetchReadingHistory()
      .then((data) => {
        if (active) {
          setItems(data || [])
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError.message ||
              'Không thể tải lịch sử đọc.',
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
  }, [])

  return (
    <div className="home-layout">
      <Header />

      <main className="home-body reading-history-page">
        <div className="reading-history-heading">
          <span>Thư viện cá nhân</span>
          <h1>Lịch sử đọc</h1>
          <p>
            Tiếp tục từ chương gần nhất của từng tác phẩm.
          </p>
        </div>

        {loading ? (
          <div className="loading-state-card reading-history-state">
            <div className="spinner-ring" />
            <p>Đang tải lịch sử đọc...</p>
          </div>
        ) : error ? (
          <div className="empty-state-card reading-history-state">
            <h3>Không thể tải lịch sử</h3>
            <p>{error}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="empty-state-card reading-history-state">
            <div className="empty-icon-circle">
              <BookOpenIcon />
            </div>

            <h3>Chưa có lịch sử đọc</h3>

            <p>
              Khi bạn mở một chương, tác phẩm đó sẽ xuất
              hiện tại đây.
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={() => navigate('/')}
            >
              Khám phá truyện
            </button>
          </div>
        ) : (
          <div className="reading-history-list">
            {items.map((item) => {
              const progress = Math.max(
                0,
                Math.min(
                  100,
                  Number(item.progress_percent || 0),
                ),
              )

              const target = item.chapter_id
                ? `/novels/${item.novel_id}/chapters/${item.chapter_id}`
                : `/novels/${item.novel_id}`

              return (
                <article
                  className="reading-history-card"
                  key={item.novel_id}
                >
                  <button
                    type="button"
                    className="reading-history-cover-button"
                    onClick={() =>
                      navigate(`/novels/${item.novel_id}`)
                    }
                    aria-label={`Mở ${item.novel_title}`}
                  >
                    {item.cover_url ? (
                      <img
                        src={item.cover_url}
                        alt=""
                        className="reading-history-cover"
                      />
                    ) : (
                      <span className="reading-history-cover reading-history-cover-placeholder">
                        <BookOpenIcon />
                      </span>
                    )}
                  </button>

                  <div className="reading-history-content">
                    <div>
                      <span className="reading-history-date">
                        Đọc gần nhất:{' '}
                        {formatDate(item.last_read_at)}
                      </span>

                      <h2>{item.novel_title}</h2>

                      <p>
                        {item.chapter_id
                          ? `Chương ${Number(
                              item.chapter_number,
                            )}: ${item.chapter_title}`
                          : 'Chương đã đọc không còn khả dụng'}
                      </p>
                    </div>

                    <div>
                      <div className="reading-progress-label">
                        <span>Tiến độ chương</span>
                        <strong>
                          {Math.round(progress)}%
                        </strong>
                      </div>

                      <div className="reading-progress-track">
                        <div
                          className="reading-progress-value"
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <button
                        type="button"
                        className="primary-button"
                        onClick={() => navigate(target)}
                      >
                        {item.chapter_id
                          ? 'Đọc tiếp'
                          : 'Xem tác phẩm'}
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}