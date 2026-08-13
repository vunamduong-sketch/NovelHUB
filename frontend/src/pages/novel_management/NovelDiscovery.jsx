import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Header } from '../../components/Header.jsx'
import { Footer } from '../../components/Footer.jsx'
import {
  fetchPublicNovels,
  fetchNewReleases,
  fetchCompletedNovels,
  fetchFeaturedNovels,
  fetchCategories,
} from '../../api/novelApi.js'

// SVG Icons matching NovelHUB design system
function CategoryIcon() {
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

function AllNovelsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
    </svg>
  )
}

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

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  )
}

function BookOpenIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

export function NovelDiscovery() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const ITEMS_PER_PAGE = 9

  // Criteria tab options definition
  const CRITERIA_TABS = [
    { id: 'all', label: 'Tất cả truyện', icon: AllNovelsIcon, desc: 'Tất cả tác phẩm đã xuất bản' },
    { id: 'new-releases', label: 'Truyện mới ra mắt', icon: NewReleasesIcon, desc: '30 tác phẩm mới nhất' },
    { id: 'featured', label: 'Top truyện nổi bật', icon: TopFeaturedIcon, desc: 'Các tác phẩm nổi bật' },
    { id: 'completed', label: 'Truyện đã hoàn thành', icon: CompletedIcon, desc: 'Các bộ truyện đã hoàn tất' },
  ]

  // State management from URL query params
  const activeTab = searchParams.get('tab') || 'all'
  const activeCategoryId = searchParams.get('category') ? Number(searchParams.get('category')) : null
  const activeSearchQuery = searchParams.get('search') || ''

  const [searchInput, setSearchInput] = useState(activeSearchQuery)
  const [categories, setCategories] = useState([])
  const [novels, setNovels] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  // Adjust search input state during render when URL search changes externally
  const [prevSearchQuery, setPrevSearchQuery] = useState(activeSearchQuery)
  if (prevSearchQuery !== activeSearchQuery) {
    setPrevSearchQuery(activeSearchQuery)
    setSearchInput(activeSearchQuery)
  }

  // Reset pagination page to 1 during render whenever active filters change
  const currentFilterKey = `${activeTab}-${activeCategoryId}-${activeSearchQuery}`
  const [prevFilterKey, setPrevFilterKey] = useState(currentFilterKey)
  if (prevFilterKey !== currentFilterKey) {
    setPrevFilterKey(currentFilterKey)
    setCurrentPage(1)
  }

  // Fetch categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await fetchCategories()
        setCategories(cats || [])
      } catch {
        setCategories([])
      }
    }
    loadCategories()
  }, [])

  // Fetch novels whenever tab, category, or search query changes
  useEffect(() => {
    let isCancelled = false

    async function loadNovels() {
      setLoading(true)

      const params = {}
      if (activeCategoryId) {
        params.category_id = activeCategoryId
      }
      if (activeSearchQuery.trim()) {
        params.search = activeSearchQuery.trim()
      }

      try {
        let result = []
        if (activeTab === 'new-releases') {
          result = await fetchNewReleases(params)
        } else if (activeTab === 'completed') {
          result = await fetchCompletedNovels(params)
        } else if (activeTab === 'featured') {
          result = await fetchFeaturedNovels(params)
        } else {
          // 'all' tab
          result = await fetchPublicNovels(params)
        }

        if (Array.isArray(result) && activeSearchQuery.trim()) {
          const query = activeSearchQuery.trim().toLowerCase()
          result = result.filter((n) => {
            const titleMatch = n.title?.toLowerCase().includes(query)
            const descMatch = n.description?.toLowerCase().includes(query)
            const authorMatch = n.author_name?.toLowerCase().includes(query)
            const tagMatch = n.tags?.some((t) => t.name?.toLowerCase().includes(query))
            return titleMatch || descMatch || authorMatch || tagMatch
          })
        }

        if (!isCancelled) {
          setNovels(Array.isArray(result) ? result : [])
        }
      } catch {
        if (!isCancelled) {
          setNovels([])
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    loadNovels()

    return () => {
      isCancelled = true
    }
  }, [activeTab, activeCategoryId, activeSearchQuery])

  // Handlers for state updates with URL params update
  const handleSelectTab = (tabId) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('tab', tabId)
    setSearchParams(nextParams)
  }

  const handleSelectCategory = (catId) => {
    const nextParams = new URLSearchParams(searchParams)
    if (catId === null) {
      nextParams.delete('category')
    } else {
      nextParams.set('category', String(catId))
    }
    setSearchParams(nextParams)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    const nextParams = new URLSearchParams(searchParams)
    if (searchInput.trim()) {
      nextParams.set('search', searchInput.trim())
    } else {
      nextParams.delete('search')
    }
    setSearchParams(nextParams)
  }

  const handleClearSearch = () => {
    setSearchInput('')
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('search')
    setSearchParams(nextParams)
  }

  // Active category object
  const selectedCategory = useMemo(() => {
    return categories.find((c) => c.id === activeCategoryId) || null
  }, [categories, activeCategoryId])

  // Active criteria tab object
  const currentTabObj = CRITERIA_TABS.find((t) => t.id === activeTab) || CRITERIA_TABS[0]

  // Pagination computations (9 items per page)
  const totalPages = Math.ceil(novels.length / ITEMS_PER_PAGE)
  const paginatedNovels = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return novels.slice(start, start + ITEMS_PER_PAGE)
  }, [novels, currentPage])

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return
    setCurrentPage(newPage)
    const targetEl = document.querySelector('.discovery-main-container')
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="discovery-layout">
      <Header />

      <main className="discovery-body">
        {/* ========================================================
            1. HORIZONTAL CRITERIA TABS (4 TAB THEO HÀNG NGANG)
           ======================================================== */}
        <section className="discovery-criteria-bar-wrapper">
          <div className="discovery-criteria-bar">
            {CRITERIA_TABS.map((tab) => {
              const IconComponent = tab.icon
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  type="button"
                  className={`discovery-tab-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelectTab(tab.id)}
                >
                  <div className="tab-icon-wrapper">
                    <IconComponent />
                  </div>
                  <div className="tab-text-group">
                    <span className="tab-title">{tab.label}</span>
                    <span className="tab-desc">{tab.desc}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* ========================================================
            2. MAIN DISCOVERY CONTENT GRID (SIDEBAR & NOVELS LIST)
           ======================================================== */}
        <div className="discovery-main-container">
          {/* LEFT SIDEBAR: DANH SÁCH THỂ LOẠI THEO HÀNG DỌC */}
          <aside className="discovery-sidebar">
            <div className="sidebar-card">
              <div className="sidebar-header">
                <CategoryIcon />
                <h3>Thể Loại Truyện</h3>
              </div>

              <div className="vertical-category-list">
                {/* 1. Tất cả thể loại */}
                <button
                  type="button"
                  className={`category-item-btn ${activeCategoryId === null ? 'active' : ''}`}
                  onClick={() => handleSelectCategory(null)}
                >
                  <span className="category-item-name">Tất cả</span>
                </button>

                {/* 2. Thể loại từ Database */}
                {categories.map((cat) => {
                  const isSelected = activeCategoryId === cat.id

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      className={`category-item-btn ${isSelected ? 'active' : ''}`}
                      onClick={() => handleSelectCategory(cat.id)}
                    >
                      <span className="category-item-name">{cat.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </aside>

          {/* RIGHT CONTENT: SEARCH BAR & RESULTS NOVELS GRID */}
          <section className="discovery-content-area">
            {/* Search Bar Input (Phía trên tab kết quả) */}
            <form className="discovery-top-search-form" onSubmit={handleSearchSubmit}>
              <div className="discovery-search-input-wrapper">
                <SearchIcon />
                <input
                  type="text"
                  placeholder="Nhập tên truyện hoặc từ khóa"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="discovery-search-input"
                />
                {searchInput && (
                  <button
                    type="button"
                    className="clear-search-btn"
                    onClick={handleClearSearch}
                    title="Xóa tìm kiếm"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button type="submit" className="primary-button discovery-search-btn">
                <span>Tìm kiếm</span>
              </button>
            </form>
            {/* Filter Status Bar / Meta header */}
            <div className="results-header-bar">
              <div className="active-filters-info">
                <span className="current-criteria-badge">
                  {currentTabObj.label}
                </span>
                {selectedCategory && (
                  <span className="category-filter-badge">
                    Thể loại: <strong>{selectedCategory.name}</strong>
                    <button
                      type="button"
                      className="remove-badge-btn"
                      onClick={() => handleSelectCategory(null)}
                      title="Xóa lọc thể loại"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {activeSearchQuery && (
                  <span className="search-filter-badge">
                    Từ khóa: <strong>"{activeSearchQuery}"</strong>
                    <button
                      type="button"
                      className="remove-badge-btn"
                      onClick={handleClearSearch}
                      title="Xóa lọc từ khóa"
                    >
                      ✕
                    </button>
                  </span>
                )}
              </div>

              <div className="results-count">
                {loading ? 'Đang tải...' : `Tìm thấy ${novels.length} tác phẩm`}
              </div>
            </div>

            {/* Content Area Rendering */}
            {loading ? (
              /* Loading State */
              <div className="loading-state-card">
                <div className="spinner-ring" />
                <p>Đang tải danh sách tác phẩm phù hợp...</p>
              </div>
            ) : novels.length === 0 ? (
              /* Empty State */
              <div className="empty-state-card">
                <div className="empty-icon-circle">
                  <BookOpenIcon />
                </div>
                <h3>Không tìm thấy truyện nào</h3>
                <p>
                  {activeSearchQuery || activeCategoryId
                    ? 'Không có tác phẩm nào phù hợp với bộ lọc tìm kiếm và thể loại hiện tại.'
                    : 'Hiện chưa có tác phẩm xuất bản nào trong mục này.'}
                </p>
                {(activeSearchQuery || activeCategoryId) && (
                  <button
                    type="button"
                    className="secondary-button reset-filter-btn"
                    onClick={() => {
                      setSearchInput('')
                      setSearchParams({ tab: activeTab })
                    }}
                  >
                    Xóa tất cả bộ lọc
                  </button>
                )}
              </div>
            ) : (
              /* Novels Grid with 9 items per page */
              <>
                <div className="home-novels-grid discovery-novels-grid">
                  {paginatedNovels.map((novel) => {
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
                          <div
                            className="home-cover-placeholder"
                            style={{ display: novel.cover_url ? 'none' : 'grid' }}
                          >
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

                          <h3 className="home-card-title" title={novel.title}>
                            {novel.title}
                          </h3>

                          <p className="home-card-desc">
                            {novel.description || 'Chưa có mô tả tác phẩm.'}
                          </p>

                          {/* Tags */}
                          {novel.tags && novel.tags.length > 0 && (
                            <div className="home-card-tags">
                              {novel.tags.slice(0, 3).map((t) => (
                                <span key={t.id} className="home-tag-pill">
                                  #{t.name}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Footer Metrics */}
                          <div className="home-card-footer">
                            <div className="card-author-info" title={novel.author_name || 'Tác giả'}>
                              <UserIcon />
                              <span>
                                {novel.author_name || `Tác giả #${novel.author_id.substring(0, 6)}`}
                              </span>
                            </div>

                            <div className="card-metrics-box">
                              <span title="Lượt xem">
                                <EyeIcon /> {novel.view_count || 0}
                              </span>
                              <span title="Lượt theo dõi">
                                <FollowerIcon /> {novel.follower_count || 0}
                              </span>
                              <span title="Đánh giá">
                                <StarIcon />{' '}
                                {novel.rating_average
                                  ? Number(novel.rating_average).toFixed(1)
                                  : '5.0'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>

                {/* Pagination Controls Bar */}
                {totalPages > 1 && (
                  <div className="discovery-pagination-bar">
                    <button
                      type="button"
                      className="pagination-action-btn prev-btn"
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      ‹ Trang trước
                    </button>

                    <div className="pagination-numbers">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          type="button"
                          className={`pagination-number-btn ${currentPage === pageNum ? 'active' : ''}`}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      className="pagination-action-btn next-btn"
                      disabled={currentPage === totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
                      Trang sau ›
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
