import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  fetchFollowedAuthors,
  fetchFollowedNovels,
} from '../../api/communityApi.js'
import { Footer } from '../../components/Footer.jsx'
import { Header } from '../../components/Header.jsx'
import '../../styles/community.css'
import { useAuth } from '../../auth/useAuth.js'


function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('vi-VN')
}


export function FollowedLibraryPage() {
  const navigate = useNavigate()
  const { accessToken, user } = useAuth()
  const [novels, setNovels] = useState([])
  const [authors, setAuthors] = useState([])
  const [activeTab, setActiveTab] = useState('novels')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadFollowedItems = useCallback(async () => {
    if (!accessToken) {
      setLoading(false)
      return
    }

      setLoading(true)
      setError('')
      try {
        const [novelData, authorData] = await Promise.all([
          fetchFollowedNovels(),
          fetchFollowedAuthors(),
        ])
        setNovels(Array.isArray(novelData) ? novelData : [])
        setAuthors(Array.isArray(authorData) ? authorData : [])
      } catch (err) {
        setError(err.message || 'Không thể tải danh sách theo dõi.')
      } finally {
        setLoading(false)
      }
  }, [accessToken])

  useEffect(() => {
    loadFollowedItems()
    window.addEventListener('focus', loadFollowedItems)
    window.addEventListener('novelhub:follow-changed', loadFollowedItems)
    return () => {
      window.removeEventListener('focus', loadFollowedItems)
      window.removeEventListener('novelhub:follow-changed', loadFollowedItems)
    }
  }, [loadFollowedItems, user?.id])

  return (
    <div className="home-layout">
      <Header />
      <main className="followed-page">
        <div className="reading-history-heading">
          <span>Thư viện độc giả</span>
          <h1>Danh sách đang theo dõi</h1>
          <p>Quản lý những truyện và tác giả bạn đang quan tâm.</p>
        </div>

        <div className="community-tabs">
          <button
            type="button"
            className={activeTab === 'novels' ? 'active' : ''}
            onClick={() => setActiveTab('novels')}
          >
            Truyện đang theo dõi ({novels.length})
          </button>
          <button
            type="button"
            className={activeTab === 'authors' ? 'active' : ''}
            onClick={() => setActiveTab('authors')}
          >
            Tác giả đang theo dõi ({authors.length})
          </button>
        </div>

        {error && <p className="community-error">{error}</p>}

        {loading ? (
          <div className="community-state">Đang tải danh sách theo dõi...</div>
        ) : activeTab === 'novels' ? (
          <div className="followed-grid">
            {novels.length === 0 ? (
              <div className="community-state">Bạn chưa theo dõi truyện nào.</div>
            ) : novels.map((item) => (
              <article key={item.novel_id} className="followed-card">
                <button
                  type="button"
                  className="followed-cover-button"
                  onClick={() => navigate(`/novels/${item.novel_id}`)}
                >
                  {item.cover_url ? (
                    <img src={item.cover_url} alt={item.title} />
                  ) : (
                    <span>{item.title?.[0] || 'N'}</span>
                  )}
                </button>
                <div>
                  <h2>{item.title}</h2>
                  <p>Tác giả: {item.author_name || 'Tác giả NovelHub'}</p>
                  <span>Theo dõi từ {formatDate(item.followed_at)}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="followed-grid">
            {authors.length === 0 ? (
              <div className="community-state">Bạn chưa theo dõi tác giả nào.</div>
            ) : authors.map((item) => (
              <article key={item.author_id} className="followed-card followed-author-card">
                <div className="followed-author-avatar">
                  {item.avatar_url ? (
                    <img src={item.avatar_url} alt={item.username} />
                  ) : (
                    <span>{(item.display_name || item.username)?.[0] || 'A'}</span>
                  )}
                </div>
                <div>
                  <h2>{item.display_name || item.username}</h2>
                  <p>@{item.username}</p>
                  <span>Theo dõi từ {formatDate(item.followed_at)}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
