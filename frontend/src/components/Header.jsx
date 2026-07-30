import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'
import { fetchPublicNovels } from '../api/novelApi.js'

// Helper function to resolve avatar URL from DB or uploaded static path
function getAvatarUrl(avatarPath) {
  if (!avatarPath) return null
  if (
    avatarPath.startsWith('http://') ||
    avatarPath.startsWith('https://') ||
    avatarPath.startsWith('data:')
  ) {
    return avatarPath
  }
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
  const baseUrl = configuredBaseUrl || (import.meta.env.DEV ? 'http://localhost:8000' : '')
  const cleanPath = avatarPath.startsWith('/') ? avatarPath : `/${avatarPath}`
  return `${baseUrl}${cleanPath}`
}

// 2D Monochrome Vector Icons (Matching #64374d theme)
function HomeIcon() {
  return (
    <svg className="menu-svg-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  )
}

function UserIcon() {
  return (
    <svg className="menu-svg-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  )
}

function CreationIcon() {
  return (
    <svg className="menu-svg-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9"></path>
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
    </svg>
  )
}

function HistoryIcon() {
  return (
    <svg className="menu-svg-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  )
}

function CategoryIcon() {
  return (
    <svg className="menu-svg-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"></line>
      <line x1="8" y1="12" x2="21" y2="12"></line>
      <line x1="8" y1="18" x2="21" y2="18"></line>
      <line x1="3" y1="6" x2="3.01" y2="6"></line>
      <line x1="3" y1="12" x2="3.01" y2="12"></line>
      <line x1="3" y1="18" x2="3.01" y2="18"></line>
    </svg>
  )
}

function TopFeaturedIcon() {
  return (
    <svg className="menu-svg-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
  )
}

function NewReleasesIcon() {
  return (
    <svg className="menu-svg-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>
  )
}

function CompletedIcon() {
  return (
    <svg className="menu-svg-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg className="menu-svg-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
      <polyline points="16 17 21 12 16 7"></polyline>
      <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
  )
}

export function Header({ onToggleMenu: externalToggle, isMenuOpen: externalIsOpen }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [internalIsOpen, setInternalIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [authorAlertModal, setAuthorAlertModal] = useState(false)
  const { user, signOut, refreshProfile } = useAuth()
  const dropdownRef = useRef(null)
  const searchContainerRef = useRef(null)

  // Support both external state management and internal standalone state for Header
  const isMenuOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen
  const toggleMenu = externalToggle || (() => setInternalIsOpen((prev) => !prev))
  const closeMenu = () => {
    if (externalToggle) {
      if (externalIsOpen) externalToggle()
    } else {
      setInternalIsOpen(false)
    }
  }

  // Live search query effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setShowSearchDropdown(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      setShowSearchDropdown(true)
      try {
        const data = await fetchPublicNovels({ search: searchQuery.trim() })
        setSearchResults(data || [])
      } catch (err) {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSearchDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setShowSearchDropdown(false)
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleLoginClick = () => {
    if (user) {
      if (refreshProfile) refreshProfile()
      setShowUserDropdown((prev) => !prev)
    } else {
      navigate('/login')
    }
  }

  const handleSignOut = async () => {
    setShowUserDropdown(false)
    closeMenu()
    await signOut()
    navigate('/')
  }

  const handleGoToProfile = (e) => {
    e.preventDefault()
    setShowUserDropdown(false)
    closeMenu()
    navigate('/profile')
  }

  // Author Role Check for "Sáng tác của tôi"
  const handleMyCreationsClick = (e) => {
    e.preventDefault()
    closeMenu()

    const userRoles = user?.roles?.map((r) => r.toLowerCase()) || []
    const isAuthor = userRoles.includes('author') || userRoles.includes('creator') || userRoles.includes('admin')

    if (!isAuthor) {
      setAuthorAlertModal(true)
    } else {
      navigate('/author/compositions')
    }
  }

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const rawAvatarPath = user?.avatar_url || user?.avatar || null
  const resolvedAvatarUrl = getAvatarUrl(rawAvatarPath)
  const userInitial = user?.display_name?.[0] || user?.username?.[0] || 'U'

  return (
    <>
      {/* Global Right-Side Drawer Navigation Overlay */}
      <div 
        className={`drawer-backdrop ${isMenuOpen ? 'open' : ''}`}
        onClick={closeMenu}
        aria-hidden="true"
      />
      
      <aside className={`drawer-navigation ${isMenuOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <a className="brand" href="/" onClick={closeMenu}>
            <span>n</span> NovelHUB
          </a>
          <button type="button" className="close-drawer-btn" onClick={closeMenu} aria-label="Đóng menu">
            ✕
          </button>
        </div>
        
        <nav className="drawer-nav-list">
          {/* 1. Trang chủ */}
          <a 
            href="/" 
            className={`drawer-nav-item ${location.pathname === '/' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); closeMenu(); navigate('/'); }}
          >
            <HomeIcon /> <span>Trang chủ</span>
          </a>

          {/* 2. Trang cá nhân (nếu đã đăng nhập) */}
          {user && (
            <a 
              href="/profile" 
              className={`drawer-nav-item ${location.pathname === '/profile' ? 'active' : ''}`}
              onClick={handleGoToProfile}
            >
              <UserIcon /> <span>Trang cá nhân</span>
            </a>
          )}

          {/* 3. Sáng tác của tôi (nếu đã đăng nhập) */}
          {user && (
            <a 
              href="/author/compositions" 
              className={`drawer-nav-item ${location.pathname === '/author/compositions' ? 'active' : ''}`} 
              onClick={handleMyCreationsClick}
            >
              <CreationIcon /> <span>Sáng tác của tôi</span>
            </a>
          )}

          {/* 4. Lịch sử đọc (nằm dưới Sáng tác của tôi, trên Thể loại truyện) */}
          <a 
            href="#reading-history" 
            className="drawer-nav-item"
            onClick={(e) => { e.preventDefault(); closeMenu(); }}
          >
            <HistoryIcon /> <span>Lịch sử đọc</span>
          </a>

          {/* 5. Thể loại truyện */}
          <a 
            href="#categories" 
            className="drawer-nav-item"
            onClick={(e) => { e.preventDefault(); closeMenu(); }}
          >
            <CategoryIcon /> <span>Thể loại truyện</span>
          </a>

          {/* 6. Top truyện nổi bật */}
          <a 
            href="#top-featured" 
            className="drawer-nav-item"
            onClick={(e) => { e.preventDefault(); closeMenu(); }}
          >
            <TopFeaturedIcon /> <span>Top truyện nổi bật</span>
          </a>

          {/* 7. Truyện mới ra mắt */}
          <a 
            href="#new-releases" 
            className="drawer-nav-item"
            onClick={(e) => { e.preventDefault(); closeMenu(); }}
          >
            <NewReleasesIcon /> <span>Truyện mới ra mắt</span>
          </a>

          {/* 8. Truyện đã hoàn thành */}
          <a 
            href="#completed-novels" 
            className="drawer-nav-item"
            onClick={(e) => { e.preventDefault(); closeMenu(); }}
          >
            <CompletedIcon /> <span>Truyện đã hoàn thành</span>
          </a>
        </nav>
      </aside>

      {/* Author Only Feature Alert Modal Dialog */}
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
      )}

      {/* Main Header Component */}
      <header className="home-header">
        <div className="header-container">
          {/* Bên trái ngoài cùng: Logo dự án */}
          <div className="header-left">
            <a className="brand home-brand" href="/">
              <span>n</span> NovelHUB
            </a>
          </div>

          {/* Chính giữa: Thanh tìm kiếm truyện */}
          <div className="header-center" ref={searchContainerRef}>
            <form className="search-bar-form" onSubmit={handleSearch}>
              <div className="search-input-wrapper">
                <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Tìm kiếm tên truyện, tác giả..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => { if (searchQuery.trim()) setShowSearchDropdown(true); }}
                />
                {searchQuery && (
                  <button type="button" className="clear-search-btn" onClick={() => { setSearchQuery(''); setShowSearchDropdown(false); }}>
                    ✕
                  </button>
                )}
              </div>
            </form>

            {/* Live Search Suggestions Dropdown Card */}
            {showSearchDropdown && searchQuery.trim() && (
              <div className="header-search-suggestions-card">
                <div className="suggestions-header">
                  <span>Gợi ý tìm kiếm</span>
                  {isSearching ? (
                    <span className="searching-spinner-text">Đang tìm...</span>
                  ) : (
                    <span className="results-count-tag">{searchResults.length} kết quả</span>
                  )}
                </div>

                <div className="suggestions-list">
                  {isSearching ? (
                    <div className="suggestion-loading-item">
                      <div className="spinner-ring-small" />
                      <span>Đang kết nối tìm kiếm...</span>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="suggestion-empty-item">
                      <p>Không tìm thấy tác phẩm phù hợp với <strong>"{searchQuery}"</strong></p>
                    </div>
                  ) : (
                    searchResults.map((novel) => (
                      <div
                        key={novel.id}
                        className="suggestion-novel-item"
                        onClick={() => {
                          setShowSearchDropdown(false)
                          navigate(`/novels/${novel.id}`)
                        }}
                      >
                        <div className="suggestion-cover-box">
                          {novel.cover_url ? (
                            <img src={novel.cover_url} alt={novel.title} />
                          ) : (
                            <div className="suggestion-cover-placeholder">
                              {novel.title?.[0] || 'N'}
                            </div>
                          )}
                        </div>

                        <div className="suggestion-novel-info">
                          <h4 className="suggestion-title">{novel.title}</h4>
                          <div className="suggestion-meta">
                            <span className="suggestion-badge">{novel.status === 'completed' ? 'Đã hoàn thành' : 'Đang tiến hành'}</span>
                            {novel.view_count !== undefined && (
                              <span className="suggestion-views">👁️ {novel.view_count.toLocaleString('vi-VN')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bên phải ngoài cùng: Avatar (bên TRÁI nút menu 3 gạch), rồi đến Nút menu 3 gạch */}
          <div className="header-right" ref={dropdownRef}>
            {user ? (
              <div className="user-avatar-wrapper">
                <button 
                  type="button" 
                  className="header-avatar-btn"
                  onClick={handleLoginClick}
                  title={`Tài khoản: ${user.display_name || user.username}`}
                >
                  {resolvedAvatarUrl ? (
                    <img 
                      key={resolvedAvatarUrl}
                      src={resolvedAvatarUrl} 
                      alt={user.username} 
                      className="avatar-img"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        if (e.target.nextSibling) {
                          e.target.nextSibling.style.display = 'grid'
                        }
                      }}
                    />
                  ) : null}
                  <div 
                    className="avatar-fallback" 
                    style={{ display: resolvedAvatarUrl ? 'none' : 'grid' }}
                  >
                    {userInitial.toUpperCase()}
                  </div>
                </button>

                {/* User Dropdown Menu */}
                {showUserDropdown && (
                  <div className="user-dropdown-menu">
                    <div className="user-dropdown-header">
                      <p className="dropdown-user-name">{user.display_name || user.username}</p>
                      <p className="dropdown-user-email">@{user.username}</p>
                    </div>
                    <div className="user-dropdown-divider" />
                    <a href="/profile" className="user-dropdown-item" onClick={handleGoToProfile}>
                      <UserIcon /> <span>Trang cá nhân</span>
                    </a>
                    <a href="#my-creations" className="user-dropdown-item" onClick={handleMyCreationsClick}>
                      <CreationIcon /> <span>Sáng tác của tôi</span>
                    </a>
                    <div className="user-dropdown-divider" />
                    <button type="button" className="user-dropdown-item logout-btn" onClick={handleSignOut}>
                      <LogoutIcon /> <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button 
                type="button" 
                className="header-login-btn"
                onClick={handleLoginClick}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                <span>Đăng nhập</span>
              </button>
            )}

            {/* Nút menu 3 gạch nằm bên phải Avatar */}
            <button 
              type="button" 
              className={`menu-toggle-btn ${isMenuOpen ? 'active' : ''}`}
              onClick={toggleMenu}
              aria-label="Thanh điều hướng"
              title="Danh mục & Menu"
            >
              <span className="hamburger-box">
                <span className="hamburger-inner"></span>
              </span>
            </button>
          </div>
        </div>
      </header>
    </>
  )
}
