import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Header } from '../../components/Header.jsx'
import { Footer } from '../../components/Footer.jsx'
import { getNovelDetail, fetchCategories } from '../../api/novelApi.js'
import { fetchPublicChapters } from '../../api/chapterApi.js'

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
  const [chapters, setChapters] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  // Interactive UI states
  const [activeTab, setActiveTab] = useState('summary') // 'summary' | 'chapters'
  const [isFollowing, setIsFollowing] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  useEffect(() => {
    const init = async () => {
      await Promise.resolve()
      setLoading(true)
      setErrorMsg('')
      try {
        const [novelData, catsData, chaptersData] = await Promise.all([
          getNovelDetail(id),
          fetchCategories(),
          fetchPublicChapters(id),
        ])
        setNovel(novelData)
        setCategories(catsData || [])
        setChapters(chaptersData || [])
      } catch (err) {
        setErrorMsg(err.message || 'Không thể tải thông tin tác phẩm này.')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [id])

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  const handleToggleFollow = () => {
    setIsFollowing((prev) => !prev)
    showToast(isFollowing ? 'Đã hủy theo dõi tác phẩm' : 'Đã thêm tác phẩm vào tủ sách theo dõi!')
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    showToast('Đã sao chép đường dẫn tác phẩm vào bộ nhớ tạm!')
  }

  const filteredChapters = chapters.filter((ch) => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return true
    return (
      ch.title.toLowerCase().includes(query) ||
      Number(ch.chapter_number).toString().includes(query)
    )
  })

  const totalPages = Math.ceil(filteredChapters.length / ITEMS_PER_PAGE)
  const paginatedChapters = filteredChapters.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

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
                    <strong>{chapters.length}</strong>
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
                  onClick={() => {
                    if (chapters.length > 0) {
                      navigate(`/novels/${novel.id}/chapters/${chapters[0].id}`)
                    } else {
                      showToast('Truyện này hiện chưa có chương nào được xuất bản.')
                    }
                  }}
                >
                  <BookOpenIcon />
                  <span>Đọc Truyện</span>
                </button>

                <button
                  type="button"
                  className={`secondary-button detail-action-btn ${isFollowing ? 'active' : ''}`}
                  onClick={handleToggleFollow}
                >
                  <FollowerIcon />
                  <span>{isFollowing ? 'Đã Theo Dõi' : 'Theo Dõi'}</span>
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
          <style>{`
            .detail-tabs-bar {
              display: flex !important;
              border-bottom: 2px solid #e5e7eb !important;
              margin-bottom: 20px !important;
              width: 100% !important;
              background: transparent !important;
              gap: 0 !important;
            }
            .detail-tab-btn {
              flex: 1 !important;
              background: none !important;
              border: none !important;
              border-radius: 0 !important;
              padding: 14px 16px !important;
              font-size: 16px !important;
              font-weight: 600 !important;
              color: #4b5563 !important;
              cursor: pointer !important;
              position: relative !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              gap: 8px !important;
              transition: all 0.2s ease !important;
              box-shadow: none !important;
            }
            .detail-tab-btn:hover {
              color: #111827 !important;
              background: #f3f4f6 !important;
            }
            .detail-tab-btn.active {
              color: #111827 !important;
              background: transparent !important;
              box-shadow: none !important;
            }
            .detail-tab-btn.active::after {
              content: '' !important;
              position: absolute !important;
              bottom: -2px !important;
              left: 0 !important;
              right: 0 !important;
              height: 3px !important;
              background-color: #3b82f6 !important;
            }

            .custom-chapter-section {
              background: #ffffff;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 20px;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            }
            .chapter-search-box {
              position: relative;
              display: flex;
              align-items: center;
              margin-bottom: 16px;
            }
            .chapter-search-box .search-icon {
              position: absolute;
              left: 14px;
              color: #9ca3af;
            }
            .chapter-search-box input {
              width: 100%;
              padding: 12px 12px 12px 42px;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              font-size: 14px;
              outline: none;
              color: #1f2937;
              background-color: #f9fafb;
              transition: all 0.2s ease;
            }
            .chapter-search-box input:focus {
              border-color: #3b82f6;
              background-color: #ffffff;
              box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
            }
            .chapter-vertical-list {
              max-height: 480px;
              overflow-y: auto;
              display: flex;
              flex-direction: column;
              gap: 8px;
              padding-right: 6px;
            }
            .chapter-vertical-list::-webkit-scrollbar {
              width: 8px;
            }
            .chapter-vertical-list::-webkit-scrollbar-track {
              background: #f1f5f9;
              border-radius: 4px;
            }
            .chapter-vertical-list::-webkit-scrollbar-thumb {
              background: #cbd5e1;
              border-radius: 4px;
            }
            .chapter-vertical-list::-webkit-scrollbar-thumb:hover {
              background: #94a3b8;
            }
            .chapter-vertical-item {
              display: flex;
              align-items: center;
              gap: 16px;
              padding: 12px 16px;
              border-radius: 6px;
              background-color: #f9fafb;
              border: 1px solid #f3f4f6;
              text-decoration: none;
              color: #1f2937;
              transition: all 0.2s ease;
            }
            .chapter-vertical-item:hover {
              background-color: #f3f4f6;
              border-color: #e5e7eb;
              transform: translateX(4px);
            }
            .chapter-num-badge {
              display: flex;
              align-items: center;
              justify-content: center;
              min-width: 32px;
              height: 28px;
              background-color: #ffffff;
              border: 1px solid #e5e7eb;
              border-radius: 4px;
              font-size: 13px;
              font-weight: 700;
              color: #4b5563;
            }
            .chapter-item-title {
              font-size: 15px;
              font-weight: 500;
            }
            .chapter-pagination {
              display: flex;
              justify-content: center;
              align-items: center;
              gap: 8px;
              margin-top: 20px;
            }
            .page-btn {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              min-width: 32px;
              height: 32px;
              padding: 0 10px;
              border: 1px solid #e5e7eb;
              background-color: #ffffff;
              border-radius: 4px;
              color: #4b5563;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.2s ease;
            }
            .page-btn:hover {
              background-color: #f9fafb;
              border-color: #cbd5e1;
            }
            .page-btn.active {
              background-color: #3b82f6;
              border-color: #3b82f6;
              color: #ffffff;
            }
            .no-search-results {
              text-align: center;
              color: #6b7280;
              padding: 30px;
              font-size: 15px;
            }
          `}</style>

          {/* Sub Navigation Bar */}
          <div className="detail-tabs-bar">
            <button
              type="button"
              className={`detail-tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
              onClick={() => setActiveTab('summary')}
            >
              <span>Tóm tắt</span>
            </button>

            <button
              type="button"
              className={`detail-tab-btn ${activeTab === 'chapters' ? 'active' : ''}`}
              onClick={() => setActiveTab('chapters')}
            >
              <span>DS. chương</span>
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
                {chapters.length === 0 ? (
                  <div className="empty-state-card sub-empty-card" style={{ padding: '48px 24px' }}>
                    <div className="empty-icon-circle">
                      <ListIcon />
                    </div>
                    <h3>Chưa Có Chương Nào Đăng Tải</h3>
                    <p>Tác giả hiện chưa xuất bản chương tiếp theo cho tác phẩm này. Nhấn <strong>"Theo Dõi"</strong> để nhận thông báo tự động ngay khi có chương mới!</p>
                  </div>
                ) : (
                  <div className="custom-chapter-section">
                    {/* Search Input */}
                    <div className="chapter-search-box">
                      <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      </svg>
                      <input
                        type="text"
                        placeholder="Tìm theo số chương hoặc tên chương"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                      />
                    </div>

                    {/* Chapter Scrollable List */}
                    <div className="chapter-vertical-list">
                      {paginatedChapters.length === 0 ? (
                        <p className="no-search-results">Không tìm thấy chương phù hợp.</p>
                      ) : (
                        paginatedChapters.map((ch) => (
                          <Link
                            key={ch.id}
                            to={`/novels/${novel.id}/chapters/${ch.id}`}
                            className="chapter-vertical-item"
                          >
                            <div className="chapter-num-badge">
                              {Number(ch.chapter_number)}
                            </div>
                            <div className="chapter-item-title">
                              {ch.title}
                            </div>
                          </Link>
                        ))
                      )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="chapter-pagination">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            type="button"
                            className={`page-btn ${currentPage === page ? 'active' : ''}`}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </button>
                        ))}
                        {currentPage < totalPages && (
                          <>
                            <button
                              type="button"
                              className="page-btn"
                              onClick={() => setCurrentPage(currentPage + 1)}
                            >
                              &gt;
                            </button>
                            <button
                              type="button"
                              className="page-btn"
                              onClick={() => setCurrentPage(totalPages)}
                            >
                              Cuối
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
