import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Header } from '../components/Header.jsx'
import { Footer } from '../components/Footer.jsx'
import { getNovelDetail, fetchCategories } from '../api/novelApi.js'

// 2D Vector Monochrome Icons
function BookOpenIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
    </svg>
  )
}

function FollowerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="8.5" cy="7" r="4"></circle>
      <polyline points="17 11 19 13 23 9"></polyline>
    </svg>
  )
}

function StarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"></circle>
      <circle cx="6" cy="12" r="3"></circle>
      <circle cx="18" cy="19" r="3"></circle>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  )
}

function ListIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"></line>
      <line x1="8" y1="12" x2="21" y2="12"></line>
      <line x1="8" y1="18" x2="21" y2="18"></line>
      <line x1="3" y1="6" x2="3.01" y2="6"></line>
      <line x1="3" y1="12" x2="3.01" y2="12"></line>
      <line x1="3" y1="18" x2="3.01" y2="18"></line>
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  )
}

export function NovelDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [novel, setNovel] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  // Interactive UI states
  const [activeTab, setActiveTab] = useState('summary') // 'summary' | 'chapters'
  const [isFollowing, setIsFollowing] = useState(false)
  const [isNominated, setIsNominated] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    loadNovelInfo()
  }, [id])

  const loadNovelInfo = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const [novelData, catsData] = await Promise.all([
        getNovelDetail(id),
        fetchCategories(),
      ])
      setNovel(novelData)
      setCategories(catsData || [])
    } catch (err) {
      setErrorMsg(err.message || 'Không thể tải thông tin tác phẩm này.')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  const handleToggleFollow = () => {
    setIsFollowing((prev) => !prev)
    showToast(isFollowing ? 'Đã hủy theo dõi tác phẩm' : 'Đã thêm tác phẩm vào tủ sách theo dõi!')
  }

  const handleNominate = () => {
    setIsNominated((prev) => !prev)
    showToast(isNominated ? 'Đã hủy đề cử' : 'Đã gửi 1 phiếu đề cử cho tác phẩm!')
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    showToast('Đã sao chép đường dẫn tác phẩm vào bộ nhớ tạm!')
  }

  if (loading) {
    return (
      <div className="home-layout">
        <Header />
        <main className="home-body">
          <div className="loading-state-card" style={{ margin: '60px auto' }}>
            <div className="spinner-ring" />
            <p>Đang tải thông tin chi tiết tác phẩm...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (errorMsg || !novel) {
    return (
      <div className="home-layout">
        <Header />
        <main className="home-body">
          <div className="empty-state-card" style={{ margin: '60px auto', maxWidth: '600px' }}>
            <div className="empty-icon-circle">
              <BookOpenIcon />
            </div>
            <h3>Không Tìm Thấy Tác Phẩm</h3>
            <p>{errorMsg || 'Tác phẩm bạn tìm kiếm không tồn tại hoặc đã bị gỡ bỏ.'}</p>
            <button 
              type="button" 
              className="primary-button" 
              style={{ marginTop: '16px' }}
              onClick={() => navigate('/')}
            >
              Trở về Trang chủ
            </button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const categoryObj = categories.find((c) => c.id === novel.category_id)

  return (
    <div className="home-layout">
      <Header />

      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="author-toast toast-success" style={{ zIndex: 2000 }}>
          <span>{toastMessage}</span>
          <button type="button" onClick={() => setToastMessage('')}>✕</button>
        </div>
      )}

      <main className="home-body">
        {/* Breadcrumb Navigation */}
        <nav className="detail-breadcrumb">
          <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Trang chủ</a>
          <ChevronRightIcon />
          <span>{categoryObj ? categoryObj.name : 'Tiểu thuyết'}</span>
          <ChevronRightIcon />
          <span className="current-page">{novel.title}</span>
        </nav>

        {/* Hero Novel Details Card */}
        <div className="novel-detail-hero-card">
          <div className="detail-hero-container">
            {/* Left Column: Novel Cover Box */}
            <div className="detail-cover-wrapper">
              {novel.cover_url ? (
                <img 
                  src={novel.cover_url} 
                  alt={novel.title} 
                  className="detail-cover-img"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'grid'
                  }}
                />
              ) : null}
              <div className="detail-cover-placeholder" style={{ display: novel.cover_url ? 'none' : 'grid' }}>
                <BookOpenIcon />
                <span>{novel.title?.[0] || 'N'}</span>
              </div>

              <span className={`detail-status-pill ${novel.status === 'completed' ? 'status-finished' : 'status-ongoing'}`}>
                {novel.status === 'completed' ? 'Đã hoàn thành' : 'Đang tiến hành'}
              </span>
            </div>

            {/* Right Column: Novel Main Info & Action Controls */}
            <div className="detail-info-wrapper">
              <h1 className="detail-novel-title">{novel.title}</h1>

              <div className="detail-meta-row">
                <div className="detail-author-badge">
                  <UserIcon />
                  <span>Tác giả: <strong>{novel.author_name || `Tác giả #${novel.author_id.substring(0, 6)}`}</strong></span>
                </div>

                {categoryObj && (
                  <span className="detail-category-badge">{categoryObj.name}</span>
                )}
                
                <span className="detail-lang-badge">Ngôn ngữ: Vi</span>
              </div>

              {/* Statistics Counters Grid */}
              <div className="detail-stats-bar">
                <div className="detail-stat-item">
                  <div className="stat-value-box text-star">
                    <StarIcon />
                    <strong>{novel.rating_average ? Number(novel.rating_average).toFixed(1) : '5.0'}</strong>
                  </div>
                  <span className="stat-label">Đánh giá</span>
                </div>

                <div className="detail-stat-divider" />

                <div className="detail-stat-item">
                  <div className="stat-value-box text-eye">
                    <EyeIcon />
                    <strong>{novel.view_count !== undefined ? novel.view_count.toLocaleString('vi-VN') : 0}</strong>
                  </div>
                  <span className="stat-label">Lượt xem</span>
                </div>

                <div className="detail-stat-divider" />

                <div className="detail-stat-item">
                  <div className="stat-value-box text-bookmark">
                    <FollowerIcon />
                    <strong>{novel.follower_count !== undefined ? novel.follower_count.toLocaleString('vi-VN') : 0}</strong>
                  </div>
                  <span className="stat-label">Lượt theo dõi</span>
                </div>

                <div className="detail-stat-divider" />

                <div className="detail-stat-item">
                  <div className="stat-value-box text-chapters">
                    <ListIcon />
                    <strong>0</strong>
                  </div>
                  <span className="stat-label">Chương</span>
                </div>
              </div>

              {/* Tag Chips */}
              {novel.tags && novel.tags.length > 0 && (
                <div className="detail-tags-row">
                  <span className="tags-label">Thẻ tag:</span>
                  {novel.tags.map((tag) => (
                    <span key={tag.id} className="detail-tag-chip">#{tag.name}</span>
                  ))}
                </div>
              )}

              {/* Action Buttons Toolbar */}
              <div className="detail-action-buttons">
                <button 
                  type="button" 
                  className="primary-button detail-cta-btn"
                  onClick={() => showToast('Chức năng đọc chương đang được hoàn thiện!')}
                >
                  <BookOpenIcon />
                  <span>Đọc Truyện</span>
                </button>

                <button 
                  type="button" 
                  className="secondary-button detail-action-btn"
                  onClick={() => showToast('Tính năng Theo dõi truyện tạm thời chưa khả dụng.')}
                >
                  <FollowerIcon />
                  <span>Theo Dõi</span>
                </button>

                <button 
                  type="button" 
                  className="secondary-button detail-action-btn"
                  onClick={handleShare}
                >
                  <ShareIcon />
                  <span>Chia Sẻ</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs & Main Content Body */}
        <section className="detail-content-section">
          {/* Sub Navigation Bar */}
          <div className="detail-tabs-bar">
            <button 
              type="button" 
              className={`detail-tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
              onClick={() => setActiveTab('summary')}
            >
              <BookOpenIcon />
              <span>Giới Thiệu & Tóm Tắt</span>
            </button>

            <button 
              type="button" 
              className={`detail-tab-btn ${activeTab === 'chapters' ? 'active' : ''}`}
              onClick={() => setActiveTab('chapters')}
            >
              <ListIcon />
              <span>Danh Sách Chương (0)</span>
            </button>
          </div>

          {/* Tab Content Display */}
          <div className="detail-tab-content">
            {activeTab === 'summary' ? (
              <div className="summary-tab-pane">
                <div className="description-formatted-box">
                  {novel.description ? (
                    novel.description.split('\n').map((paragraph, index) => (
                      paragraph.trim() ? <p key={index}>{paragraph}</p> : <br key={index} />
                    ))
                  ) : (
                    <p className="no-desc-text">Tác giả chưa cập nhật tóm tắt cho tác phẩm này.</p>
                  )}
                </div>

                {/* Copyright & Publishing Statement Card */}
                <div className="publishing-rights-card">
                  <p>
                    © Tác phẩm sáng tác và đăng tải bởi tác giả <strong>{novel.author_name || 'NovelHUB Author'}</strong> trên nền tảng NovelHUB. 
                    Mọi quyền bản quyền nội dung thuộc về tác giả sáng tác.
                  </p>
                </div>
              </div>
            ) : (
              <div className="chapters-tab-pane">
                <div className="empty-state-card sub-empty-card" style={{ padding: '48px 24px' }}>
                  <div className="empty-icon-circle">
                    <ListIcon />
                  </div>
                  <h3>Chưa Có Chương Nào Đăng Tải</h3>
                  <p>Tác giả hiện chưa xuất bản chương tiếp theo cho tác phẩm này. Nhấn <strong>"Theo Dõi"</strong> để nhận thông báo tự động ngay khi có chương mới!</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
