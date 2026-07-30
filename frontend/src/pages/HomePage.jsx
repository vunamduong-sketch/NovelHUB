import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Header } from '../components/Header.jsx'
import { Footer } from '../components/Footer.jsx'
import { fetchPublicNovels, fetchCategories } from '../api/novelApi.js'
import { useAuth } from '../auth/useAuth.js'

// 2D Vector Monochrome Icons (Matching Menu Drawer Icons 100%)
function NewReleasesIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>
  )
}

function TopFeaturedIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
  )
}

function CompletedIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  )
}

function SparklesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"></path>
    </svg>
  )
}

function CreationIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"></path>
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"></line>
      <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
  )
}

function BookOpenIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  )
}

function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
  )
}

function FollowerIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="8.5" cy="7" r="4"></circle>
      <polyline points="17 11 19 13 23 9"></polyline>
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  )
}

export function HomePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  // Real backend state for Newly Released Novels
  const [publishedNovels, setPublishedNovels] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [authorAlertModal, setAuthorAlertModal] = useState(false)

  // URL search parameter handling
  const searchParams = new URLSearchParams(location.search)
  const searchQuery = searchParams.get('search') || ''

  useEffect(() => {
    loadHomePageData()
  }, [searchQuery])

  const loadHomePageData = async () => {
    setLoading(true)
    try {
      const [novelsData, catsData] = await Promise.all([
        fetchPublicNovels(searchQuery ? { search: searchQuery } : {}),
        fetchCategories(),
      ])
      setPublishedNovels(novelsData || [])
      setCategories(catsData || [])
    } catch (err) {
      setPublishedNovels([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNovelRedirect = () => {
    if (!user) {
      navigate('/login')
      return
    }
    const userRoles = user?.roles?.map((r) => r.toLowerCase()) || []
    const isAuthor = userRoles.includes('author') || userRoles.includes('creator') || userRoles.includes('admin')
    if (isAuthor) {
      navigate('/author/compositions')
    } else {
      setAuthorAlertModal(true)
    }
  }

  return (
    <div className="home-layout">
      <Header />

      {authorAlertModal && (
        <div className="author-modal-backdrop" onClick={() => setAuthorAlertModal(false)}>
          <div className="author-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="author-modal-header">
              <div className="author-icon-badge">
                <CreationIcon />
              </div>
              <button
                type="button"
                className="close-modal-btn"
                onClick={() => setAuthorAlertModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="author-alert-content">
              <h3>Tính năng dành cho Tác giả</h3>
              <p>Tính năng này dành cho tác giả. Vui lòng đăng ký quyền tác giả để bắt đầu đăng sáng tác của bạn trên NovelHUB.</p>
              <button
                type="button"
                className="primary-button modal-confirm-btn"
                onClick={() => setAuthorAlertModal(false)}
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="home-body">
        {/* ========================================================
            1. JUMBOTRON HERO BANNER (Mang tính trang trí)
           ======================================================== */}
        <section className="jumbotron-hero-section">
          <div className="jumbotron-container">
            <div className="jumbotron-badge">
              <SparklesIcon />
              <span>Nền Tảng Sáng Tác & Đọc Tiểu Thuyết Hiện Đại</span>
            </div>

            <h1 className="jumbotron-title">
              Khám Phá Thế Giới <span className="highlight-text">Sáng Tác Của Bạn</span>
            </h1>

            <p className="jumbotron-subtitle">
              Nơi hội tụ hàng ngàn câu chuyện hấp dẫn từ các tác giả tài năng. 
              Trải nghiệm không gian đọc mượt mà, kết nối cộng đồng yêu tiểu thuyết và tự do sáng tạo tác phẩm của riêng mình.
            </p>

            {/* Cân đối nút Khám Phá Ngay & Bắt Đầu Sáng Tác */}
            <div className="jumbotron-actions">
              <button 
                type="button" 
                className="primary-button hero-cta-btn"
                onClick={() => {
                  const el = document.getElementById('new-releases-section')
                  if (el) el.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                <span>Khám Phá Ngay</span>
                <ArrowRightIcon />
              </button>

              <button 
                type="button" 
                className="secondary-button hero-secondary-btn"
                onClick={handleCreateNovelRedirect}
              >
                <CreationIcon />
                <span>Bắt Đầu Sáng Tác</span>
              </button>
            </div>

            {/* Decorative Quick Stats Bar */}
            <div className="jumbotron-stats-grid">
              <div className="jumbotron-stat-card">
                <strong>10,000+</strong>
                <span>Tác phẩm sáng tác</span>
              </div>
              <div className="jumbotron-stat-card">
                <strong>50,000+</strong>
                <span>Độc giả hàng ngày</span>
              </div>
              <div className="jumbotron-stat-card">
                <strong>100%</strong>
                <span>Miễn phí trải nghiệm</span>
              </div>
            </div>
          </div>
        </section>

        {/* Search Results Banner if query active */}
        {searchQuery && (
          <section className="search-filter-status-card">
            <p>
              Đang hiển thị kết quả tìm kiếm cho: <strong>"{searchQuery}"</strong>
            </p>
            <button type="button" className="clear-search-link" onClick={() => navigate('/')}>
              ✕ Xóa bộ lọc tìm kiếm
            </button>
          </section>
        )}

        {/* ========================================================
            2. PHẦN TRUYỆN MỚI RA MẮT (ĐÃ HOẠT ĐỘNG THỰC TẾ)
           ======================================================== */}
        <section id="new-releases-section" className="home-section-card">
          <div className="section-header-row">
            <div className="section-title-box">
              <div className="section-icon-circle icon-releases">
                <NewReleasesIcon />
              </div>
              <div>
                <h2 className="section-title">Truyện Mới Ra Mắt</h2>
                <p className="section-desc">Các tác phẩm mới xuất bản từ tác giả trên NovelHUB</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="loading-state-card">
              <div className="spinner-ring" />
              <p>Đang tải danh sách tác phẩm mới ra mắt...</p>
            </div>
          ) : publishedNovels.length === 0 ? (
            <div className="empty-state-card">
              <div className="empty-icon-circle">
                <BookOpenIcon />
              </div>
              <h3>Chưa có tác phẩm xuất bản nào</h3>
              <p>
                {searchQuery
                  ? `Không tìm thấy truyện nào phù hợp với từ khóa "${searchQuery}".`
                  : 'Hiện chưa có tác phẩm nào được xuất bản công khai. Hãy là người đầu tiên đăng sáng tác của bạn!'}
              </p>
            </div>
          ) : (
            <div className="home-novels-grid">
              {publishedNovels.map((novel) => {
                const categoryObj = categories.find((c) => c.id === novel.category_id)

                return (
                  <article 
                    key={novel.id} 
                    className="home-novel-card"
                    onClick={() => navigate(`/novels/${novel.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Cover Image */}
                    <div className="home-card-cover-wrapper">
                      {novel.cover_url ? (
                        <img 
                          src={novel.cover_url} 
                          alt={novel.title} 
                          className="home-card-cover"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            if (e.target.nextSibling) e.target.nextSibling.style.display = 'grid'
                          }}
                        />
                      ) : null}
                      <div className="home-cover-placeholder" style={{ display: novel.cover_url ? 'none' : 'grid' }}>
                        <BookOpenIcon />
                        <span>{novel.title?.[0] || 'N'}</span>
                      </div>

                      {/* Status Tag */}
                      <span className="card-floating-badge">
                        {novel.status === 'completed' ? 'Đã hoàn thành' : 'Đang tiến hành'}
                      </span>
                    </div>

                    {/* Content Body */}
                    <div className="home-card-content">
                      <div className="home-card-meta">
                        {categoryObj && (
                          <span className="home-category-chip">{categoryObj.name}</span>
                        )}
                        <span className="home-date-tag">
                          {novel.published_at
                            ? new Date(novel.published_at).toLocaleDateString('vi-VN')
                            : 'Mới đăng'}
                        </span>
                      </div>

                      <h3 className="home-card-title" title={novel.title}>{novel.title}</h3>

                      <p className="home-card-desc">
                        {novel.description || 'Chưa có mô tả tác phẩm.'}
                      </p>

                      {/* Tags */}
                      {novel.tags && novel.tags.length > 0 && (
                        <div className="home-card-tags">
                          {novel.tags.slice(0, 3).map((t) => (
                            <span key={t.id} className="home-tag-pill">#{t.name}</span>
                          ))}
                        </div>
                      )}

                      {/* Footer Metrics */}
                      <div className="home-card-footer">
                        <div className="card-author-info" title={novel.author_name || 'Tác giả'}>
                          <UserIcon />
                          <span>{novel.author_name || `Tác giả #${novel.author_id.substring(0, 6)}`}</span>
                        </div>

                        <div className="card-metrics-box">
                          <span title="Lượt xem"><EyeIcon /> {novel.view_count || 0}</span>
                          <span title="Lượt theo dõi"><FollowerIcon /> {novel.follower_count || 0}</span>
                          <span title="Đánh giá"><StarIcon /> {novel.rating_average ? Number(novel.rating_average).toFixed(1) : '5.0'}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        {/* ========================================================
            3. PHẦN TOP TRUYỆN NỔI BẬT (Trống dữ liệu)
           ======================================================== */}
        <section className="home-section-card">
          <div className="section-header-row">
            <div className="section-title-box">
              <div className="section-icon-circle icon-featured">
                <TopFeaturedIcon />
              </div>
              <div>
                <h2 className="section-title">Top Truyện Nổi Bật</h2>
                <p className="section-desc">Bảng xếp hạng các tác phẩm có lượt đọc và đánh giá cao nhất</p>
              </div>
            </div>
          </div>

          <div className="empty-state-card sub-empty-card">
            <div className="empty-icon-circle">
              <TopFeaturedIcon />
            </div>
            <p>Danh sách Top truyện nổi bật đang được cập nhật...</p>
          </div>
        </section>

        {/* ========================================================
            4. PHẦN TRUYỆN ĐÃ HOÀN THÀNH (Trống dữ liệu)
           ======================================================== */}
        <section className="home-section-card">
          <div className="section-header-row">
            <div className="section-title-box">
              <div className="section-icon-circle icon-completed">
                <CompletedIcon />
              </div>
              <div>
                <h2 className="section-title">Truyện Đã Hoàn Thành</h2>
                <p className="section-desc">Tuyển tập các tác phẩm đã sáng tác trọn bộ</p>
              </div>
            </div>
          </div>

          <div className="empty-state-card sub-empty-card">
            <div className="empty-icon-circle">
              <CompletedIcon />
            </div>
            <p>Danh sách truyện đã hoàn thành đang được cập nhật...</p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
