import { useState } from 'react'
import { Header } from '../../components/Header.jsx'
import { Footer } from '../../components/Footer.jsx'
import { PasswordField } from '../../components/auth/PasswordField.jsx'
import { useAuth } from '../../auth/useAuth.js'
import { updateMyProfile, uploadMyAvatar, changeMyPassword } from '../../api/userApi.js'

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

function UserTabIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  )
}

function ImageTabIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
      <circle cx="8.5" cy="8.5" r="1.5"></circle>
      <polyline points="21 15 16 10 5 21"></polyline>
    </svg>
  )
}

function LockTabIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  )
}

function FolderIcon() {
  return (
    <svg className="menu-svg-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
    </svg>
  )
}

function CameraIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
      <circle cx="12" cy="13" r="4"></circle>
    </svg>
  )
}

export function ProfilePage() {
  const { user, refreshProfile } = useAuth()
  const [activeTab, setActiveTab] = useState('info') // 'info' | 'avatar' | 'security'

  // Form states initialized with current user profile
  const [displayName, setDisplayName] = useState(() => user?.display_name || '')
  const [username, setUsername] = useState(() => user?.username || '')
  const [bio, setBio] = useState(() => user?.bio || '')

  // Avatar upload state
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Submission & feedback states
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const clearMessages = () => {
    setSuccessMessage('')
    setErrorMessage('')
  }

  // Handle Profile Update submit
  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    clearMessages()
    setLoading(true)
    try {
      await updateMyProfile({
        display_name: displayName.trim() || null,
        username: username.trim(),
        bio: bio.trim() || null,
      })
      await refreshProfile()
      setSuccessMessage('Cập nhật thông tin cá nhân thành công!')
    } catch (err) {
      setErrorMessage(err.message || 'Cập nhật thất bại. Vui lòng kiểm tra lại.')
    } finally {
      setLoading(false)
    }
  }

  // Handle File Selection for Avatar
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrorMessage('Dung lượng ảnh tối đa là 2MB.')
        return
      }
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      clearMessages()
    }
  }

  // Handle Avatar Upload submit
  const handleUploadAvatar = async (e) => {
    e.preventDefault()
    if (!selectedFile) return
    clearMessages()
    setLoading(true)
    try {
      await uploadMyAvatar(selectedFile)
      await refreshProfile()
      setSelectedFile(null)
      setPreviewUrl(null)
      setSuccessMessage('Cập nhật ảnh đại diện thành công!')
    } catch (err) {
      setErrorMessage(err.message || 'Tải ảnh thất bại. Vui lòng chọn ảnh hợp lệ (.jpg, .png, .webp).')
    } finally {
      setLoading(false)
    }
  }

  // Handle Password Change submit
  const handlePasswordChange = async (e) => {
    e.preventDefault()
    clearMessages()

    if (newPassword !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không trùng khớp với mật khẩu mới.')
      return
    }

    setLoading(true)
    try {
      await changeMyPassword({
        current_password: currentPassword,
        new_password: newPassword,
      })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setSuccessMessage('Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới của bạn.')
    } catch (err) {
      setErrorMessage(err.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const rawAvatarPath = user?.avatar_url || user?.avatar || null
  const currentAvatarUrl = getAvatarUrl(rawAvatarPath)
  const displayAvatar = previewUrl || currentAvatarUrl
  const userInitial = user?.display_name?.[0] || user?.username?.[0] || 'U'

  // Password Policy Checks
  const hasMinLength = newPassword.length >= 10
  const hasLetter = /[A-Za-z]/.test(newPassword)
  const hasNumber = /\d/.test(newPassword)
  const isDifferent = Boolean(currentPassword && newPassword && currentPassword !== newPassword)

  return (
    <div className="home-layout profile-layout-wrapper">
      <Header />

      <main className="profile-main-container">
        {/* Profile Hero Card */}
        <section className="profile-hero-card">
          <div className="profile-hero-content">
            <div className="profile-avatar-block">
              <div className="profile-hero-avatar">
                {displayAvatar ? (
                  <img src={displayAvatar} alt={user?.username} className="avatar-img" />
                ) : (
                  <div className="avatar-fallback">{userInitial.toUpperCase()}</div>
                )}
              </div>
              <button 
                type="button" 
                className="change-avatar-badge"
                onClick={() => setActiveTab('avatar')}
                title="Thay đổi ảnh đại diện"
              >
                <CameraIcon />
              </button>
            </div>

            <div className="profile-hero-meta">
              <div className="profile-name-row">
                <h2>{user?.display_name || user?.username}</h2>
                <span className={`status-pill ${user?.status || 'active'}`}>
                  {user?.status ? user.status.toUpperCase() : 'ACTIVE'}
                </span>
              </div>
              <p className="profile-username">@{user?.username} • {user?.email}</p>

              {user?.bio && <p className="profile-bio-text">"{user.bio}"</p>}

              <div className="profile-roles-row">
                {user?.roles?.map((role) => (
                  <span key={role} className="role-tag">{role}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Global Feedback Banners */}
        {successMessage && (
          <div className="profile-banner success-banner" role="alert">
            <span>✅ {successMessage}</span>
            <button type="button" onClick={() => setSuccessMessage('')}>✕</button>
          </div>
        )}
        {errorMessage && (
          <div className="profile-banner error-banner" role="alert">
            <span>⚠️ {errorMessage}</span>
            <button type="button" onClick={() => setErrorMessage('')}>✕</button>
          </div>
        )}

        {/* Main Content Tabs Card */}
        <div className="profile-card">
          <div className="profile-tab-header">
            <button
              type="button"
              className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
              onClick={() => { setActiveTab('info'); clearMessages(); }}
            >
              <UserTabIcon /> <span>Thông tin cá nhân</span>
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'avatar' ? 'active' : ''}`}
              onClick={() => { setActiveTab('avatar'); clearMessages(); }}
            >
              <ImageTabIcon /> <span>Ảnh đại diện</span>
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => { setActiveTab('security'); clearMessages(); }}
            >
              <LockTabIcon /> <span>Đổi mật khẩu</span>
            </button>
          </div>

          <div className="profile-tab-body">
            {/* Tab 1: Edit Profile Info */}
            {activeTab === 'info' && (
              <form onSubmit={handleUpdateProfile} className="profile-form">
                <div className="form-group">
                  <label htmlFor="displayName">Tên hiển thị</label>
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Nhập tên hiển thị của bạn..."
                    maxLength={100}
                  />
                  <small className="field-hint">Tên này sẽ xuất hiện trên bài viết và bình luận của bạn.</small>
                </div>

                <div className="form-group">
                  <label htmlFor="usernameInput">Tên người dùng</label>
                  <input
                    id="usernameInput"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nhập username..."
                    required
                    minLength={3}
                    maxLength={50}
                  />
                  <small className="field-hint">Username gồm 3-50 ký tự chữ hoặc số.</small>
                </div>

                <div className="form-group">
                  <label htmlFor="bioInput">Giới thiệu bản thân</label>
                  <textarea
                    id="bioInput"
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Chia sẻ đôi nét về bản thân hoặc phong cách sáng tác của bạn..."
                    maxLength={1000}
                  />
                </div>

                <button type="submit" className="primary-button submit-btn" disabled={loading}>
                  {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </form>
            )}

            {/* Tab 2: Upload Avatar */}
            {activeTab === 'avatar' && (
              <form onSubmit={handleUploadAvatar} className="profile-form avatar-upload-form">
                <div className="avatar-preview-box">
                  <div className="preview-circle">
                    {displayAvatar ? (
                      <img src={displayAvatar} alt="Preview Avatar" className="avatar-img" />
                    ) : (
                      <div className="avatar-fallback">{userInitial.toUpperCase()}</div>
                    )}
                  </div>
                  <div className="preview-meta">
                    <h4>{selectedFile ? selectedFile.name : 'Ảnh đại diện hiện tại'}</h4>
                    <p>Hỗ trợ định dạng .jpg, .png, .webp (Tối đa 2MB)</p>
                  </div>
                </div>

                <div className="form-group file-drop-zone">
                  <input
                    type="file"
                    id="avatarFileInput"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="file-input-hidden"
                  />
                  <label htmlFor="avatarFileInput" className="file-input-label">
                    <FolderIcon /> <span>Chọn ảnh từ máy tính</span>
                  </label>
                </div>

                {selectedFile && (
                  <button type="submit" className="primary-button submit-btn" disabled={loading}>
                    {loading ? 'Đang tải lên...' : 'Tải ảnh lên'}
                  </button>
                )}
              </form>
            )}

            {/* Tab 3: Security & Change Password (with 2D Hiện/Ẩn toggles on all password fields) */}
            {activeTab === 'security' && (
              <form onSubmit={handlePasswordChange} className="profile-form">
                <PasswordField
                  label="Mật khẩu hiện tại"
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại..."
                  required
                />

                <PasswordField
                  label="Mật khẩu mới"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới..."
                  required
                  minLength={10}
                />

                <PasswordField
                  label="Xác nhận mật khẩu mới"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới..."
                  required
                />

                {/* Password Policy Checklist */}
                {newPassword && (
                  <ul className="password-checklist">
                    <li className={hasMinLength ? 'is-valid' : ''}>
                      {hasMinLength ? '✓' : '○'} Ít nhất 10 ký tự
                    </li>
                    <li className={hasLetter ? 'is-valid' : ''}>
                      {hasLetter ? '✓' : '○'} Chứa ít nhất một chữ cái
                    </li>
                    <li className={hasNumber ? 'is-valid' : ''}>
                      {hasNumber ? '✓' : '○'} Chứa ít nhất một chữ số
                    </li>
                    <li className={isDifferent ? 'is-valid' : ''}>
                      {isDifferent ? '✓' : '○'} Khác mật khẩu hiện tại
                    </li>
                  </ul>
                )}

                <button
                  type="submit"
                  className="primary-button submit-btn"
                  disabled={loading || !hasMinLength || !hasLetter || !hasNumber}
                >
                  {loading ? 'Đang đổi mật khẩu...' : 'Cập nhật mật khẩu'}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
