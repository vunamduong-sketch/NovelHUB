import { useState, useEffect, useRef } from 'react'
import { Header } from '../../components/Header.jsx'
import { Footer } from '../../components/Footer.jsx'
import {
  fetchMyNovels,
  createNovel,
  updateNovel,
  deleteNovel,
  publishNovel,
  fetchCategories,
  fetchTags,
} from '../../api/novelApi.js'



// --- 2D Monochromatic SVG Icons ---
function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  )
}

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
  )
}

function DeleteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>
  )
}

function PublishIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13"></path>
      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
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

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  )
}

function StarIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
  )
}

function UserCheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="8.5" cy="7" r="4"></circle>
      <polyline points="17 11 19 13 23 9"></polyline>
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  )
}

function AlertTriangleIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d93838" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  )
}

function RocketIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#64374d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path>
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-3.05 11a22.35 22.35 0 0 1-3.95 2z"></path>
      <path d="M9 12l-5 5"></path>
      <path d="M12 15l5-5"></path>
    </svg>
  )
}

function ChevronDownIcon({ className = '' }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1b7a43" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="17 8 12 3 7 8"></polyline>
      <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
    </svg>
  )
}

// --- Status Options Metadata (Vietnamese only) ---
const STATUS_OPTIONS = [
  { value: 'draft', label: 'Bản nháp', badgeClass: 'status-draft' },
  { value: 'ongoing', label: 'Đang tiến hành', badgeClass: 'status-ongoing' },
  { value: 'completed', label: 'Đã hoàn thành', badgeClass: 'status-completed' },
  { value: 'hiatus', label: 'Tạm ngưng', badgeClass: 'status-hiatus' },
]

const FILTER_STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả trạng thái', badgeClass: 'status-all' },
  { value: 'draft', label: 'Bản nháp', badgeClass: 'status-draft' },
  { value: 'ongoing', label: 'Đang tiến hành', badgeClass: 'status-ongoing' },
  { value: 'completed', label: 'Đã hoàn thành', badgeClass: 'status-completed' },
  { value: 'hiatus', label: 'Tạm ngưng', badgeClass: 'status-hiatus' },
]

// --- Custom Status Select Component ---
function CustomStatusSelect({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  const selectedOption = STATUS_OPTIONS.find((opt) => opt.value === value) || STATUS_OPTIONS[0]

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="custom-status-select-container" ref={containerRef}>
      <button
        type="button"
        className={`custom-status-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className={`composition-status-badge ${selectedOption.badgeClass}`}>
          {selectedOption.label}
        </span>
        <ChevronDownIcon className={`trigger-chevron ${isOpen ? 'rotate' : ''}`} />
      </button>

      {isOpen && (
        <div className="custom-status-dropdown-menu">
          {STATUS_OPTIONS.map((option) => (
            <div
              key={option.value}
              className={`custom-status-option-item ${option.value === value ? 'selected' : ''}`}
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
            >
              <span className={`composition-status-badge ${option.badgeClass}`}>
                {option.label}
              </span>
              {option.value === value && (
                <div className="option-check">
                  <CheckIcon />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// --- Custom Filter Status Select Component ---
function FilterStatusSelect({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  const selectedOption = FILTER_STATUS_OPTIONS.find((opt) => opt.value === value) || FILTER_STATUS_OPTIONS[0]

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="custom-status-select-container filter-status-select-container" ref={containerRef}>
      <button
        type="button"
        className={`custom-status-trigger filter-status-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className={`composition-status-badge ${selectedOption.badgeClass}`}>
          {selectedOption.label}
        </span>
        <ChevronDownIcon className={`trigger-chevron ${isOpen ? 'rotate' : ''}`} />
      </button>

      {isOpen && (
        <div className="custom-status-dropdown-menu filter-status-dropdown-menu">
          {FILTER_STATUS_OPTIONS.map((option) => (
            <div
              key={option.value}
              className={`custom-status-option-item ${option.value === value ? 'selected' : ''}`}
              onClick={() => {
                onChange(option.value)
                setIsOpen(false)
              }}
            >
              <span className={`composition-status-badge ${option.badgeClass}`}>
                {option.label}
              </span>
              {option.value === value && (
                <div className="option-check">
                  <CheckIcon />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// --- Custom Category Select Component ---
function CustomCategorySelect({ categories, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  const selectedCategory = categories.find((cat) => cat.id === value)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="custom-category-select-container" ref={containerRef}>
      <button
        type="button"
        className={`custom-category-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="category-trigger-text">
          {selectedCategory ? selectedCategory.name : '-- Chọn thể loại --'}
        </span>
        <ChevronDownIcon className={`trigger-chevron ${isOpen ? 'rotate' : ''}`} />
      </button>

      {isOpen && (
        <div className="custom-category-dropdown-menu">
          <div
            className={`custom-category-option-item ${!value ? 'selected' : ''}`}
            onClick={() => {
              onChange(null)
              setIsOpen(false)
            }}
          >
            <span>-- Chưa chọn thể loại --</span>
            {!value && <CheckIcon />}
          </div>
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`custom-category-option-item ${cat.id === value ? 'selected' : ''}`}
              onClick={() => {
                onChange(cat.id)
                setIsOpen(false)
              }}
            >
              <span>{cat.name}</span>
              {cat.id === value && (
                <div className="option-check">
                  <CheckIcon />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// --- Tag Picker Component ---
function TagPicker({ tags, selectedTagIds, onChange }) {
  const toggleTag = (tagId) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId))
    } else {
      if (selectedTagIds.length >= 10) {
        alert('Bạn chỉ có thể chọn tối đa 10 thẻ tag.')
        return
      }
      onChange([...selectedTagIds, tagId])
    }
  }

  return (
    <div className="tag-picker-wrapper">
      <div className="tag-chips-grid">
        {tags.map((tag) => {
          const isSelected = selectedTagIds.includes(tag.id)
          return (
            <button
              key={tag.id}
              type="button"
              className={`tag-chip-btn ${isSelected ? 'selected' : ''}`}
              onClick={() => toggleTag(tag.id)}
            >
              <span>#{tag.name}</span>
              {isSelected && <span className="chip-check-mark">✓</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// --- Cover Image Input & Upload Component ---
function CoverImageInput({ value, onChange }) {
  const [mode, setMode] = useState(() => (value && value.startsWith('data:') ? 'file' : 'url')) // 'file' | 'url'
  const [imageError, setImageError] = useState(false)
  const fileInputRef = useRef(null)

  // Handle local computer file selection & compression
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP).')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        // Compress image using Canvas to max 420px width/height for compact data URL (<15KB)
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        const maxDim = 420

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75)
        setImageError(false)
        onChange(compressedDataUrl)
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="cover-image-input-container">
      <div className="cover-input-tabs">
        <button
          type="button"
          className={`cover-tab-btn ${mode === 'file' ? 'active' : ''}`}
          onClick={() => setMode('file')}
        >
          <UploadIcon /> <span>Tải ảnh từ máy tính</span>
        </button>
        <button
          type="button"
          className={`cover-tab-btn ${mode === 'url' ? 'active' : ''}`}
          onClick={() => setMode('url')}
        >
          <LinkIcon /> <span>Dán URL trực tuyến</span>
        </button>
      </div>

      {mode === 'file' ? (
        <div className="file-upload-box">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          <div className="upload-trigger-area" onClick={() => fileInputRef.current?.click()}>
            <UploadIcon />
            <p><strong>Bấm vào đây để chọn ảnh từ máy tính</strong></p>
            <span>Hỗ trợ tệp PNG, JPG, WEBP (tự động nén tối ưu dung lượng)</span>
          </div>
        </div>
      ) : (
        <div className="url-input-box">
          <input
            type="url"
            placeholder="Dán đường dẫn URL ảnh (https://example.com/cover.jpg)..."
            value={value && !value.startsWith('data:') ? value : ''}
            onChange={(e) => {
              setImageError(false)
              onChange(e.target.value)
            }}
          />
        </div>
      )}

      {/* Live Preview Thumbnail */}
      {value && (
        <div className="cover-preview-wrapper">
          <span className="preview-label">Xem trước ảnh bìa:</span>
          <div className="preview-image-box">
            {!imageError ? (
              <img
                src={value}
                alt="Ảnh bìa xem trước"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="preview-error-fallback">
                <span>⚠️ URL ảnh không khả dụng hoặc bị chặn</span>
              </div>
            )}
            <button
              type="button"
              className="remove-cover-btn"
              onClick={() => {
                setImageError(false)
                onChange('')
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
            >
              ✕ Gỡ ảnh
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function AuthorCompositions() {
  const [novels, setNovels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Meta options (Categories & Tags)
  const [categories, setCategories] = useState([])
  const [tags, setTags] = useState([])

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'published' | 'draft'
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Toast feedback
  const [toast, setToast] = useState(null) // { type: 'success' | 'error', text: '' }

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editModalNovel, setEditModalNovel] = useState(null)
  const [publishModalNovel, setPublishModalNovel] = useState(null)
  const [deleteModalNovel, setDeleteModalNovel] = useState(null)

  // Modal form states
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formCoverUrl, setFormCoverUrl] = useState('')
  const [formStatus, setFormStatus] = useState('draft')
  const [formLanguage, setFormLanguage] = useState('vi')
  const [formCategoryId, setFormCategoryId] = useState(null)
  const [formTagIds, setFormTagIds] = useState([])
  const [actionLoading, setActionLoading] = useState(false)
  const [modalError, setModalError] = useState('')

  const handleTitleInvalid = (message) => (event) => {
    event.target.setCustomValidity(message)
  }

  const clearTitleValidity = (event) => {
    event.target.setCustomValidity('')
  }

  // Show Toast
  const showToast = (type, text) => {
    setToast({ type, text })
    setTimeout(() => {
      setToast(null)
    }, 4000)
  }

  // Fetch novels from backend API
  const loadNovels = async (isRefresh = false) => {
    if (isRefresh) {
      setLoading(true)
      setError(null)
    }
    try {
      const data = await fetchMyNovels()
      setNovels(data || [])
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách truyện sáng tác.')
    } finally {
      setLoading(false)
    }
  }

  // Fetch Categories & Tags
  const loadMeta = async () => {
    try {
      const [catData, tagData] = await Promise.all([fetchCategories(), fetchTags()])
      setCategories(catData || [])
      setTags(tagData || [])
    } catch {
      setCategories([])
      setTags([])
    }
  }

  useEffect(() => {
    const init = async () => {
      await Promise.resolve()
      loadNovels()
      loadMeta()
    }
    init()
  }, [])

  // Create novel submit handler
  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    if (!formTitle.trim()) {
      setModalError('Vui lòng nhập tiêu đề truyện.')
      return
    }
    setModalError('')
    setActionLoading(true)

    try {
      await createNovel({
        title: formTitle,
        description: formDescription,
        cover_url: formCoverUrl,
        language_code: formLanguage,
        category_id: formCategoryId,
        tag_ids: formTagIds,
      })
      setIsCreateModalOpen(false)
      resetForm()
      showToast('success', 'Đã tạo truyện mới thành công (bản nháp).')
      await loadNovels()
    } catch (err) {
      setModalError(err.message || 'Không thể tạo truyện. Vui lòng thử lại.')
    } finally {
      setActionLoading(false)
    }
  }

  // Open Edit Modal
  const openEditModal = (novel) => {
    setEditModalNovel(novel)
    setFormTitle(novel.title || '')
    setFormDescription(novel.description || '')
    setFormCoverUrl(novel.cover_url || '')
    setFormStatus(novel.status || 'draft')
    setFormLanguage(novel.language_code || 'vi')
    setFormCategoryId(novel.category_id || null)
    setFormTagIds(novel.tags ? novel.tags.map((t) => t.id) : [])
    setModalError('')
  }

  // Edit novel submit handler
  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!editModalNovel) return
    if (!formTitle.trim()) {
      setModalError('Vui lòng nhập tiêu đề truyện.')
      return
    }
    setModalError('')
    setActionLoading(true)

    try {
      await updateNovel(editModalNovel.id, {
        title: formTitle,
        description: formDescription,
        cover_url: formCoverUrl,
        status: formStatus,
        category_id: formCategoryId,
        tag_ids: formTagIds,
      })
      setEditModalNovel(null)
      resetForm()
      showToast('success', 'Đã cập nhật thông tin truyện thành công.')
      await loadNovels()
    } catch (err) {
      setModalError(err.message || 'Không thể cập nhật truyện. Vui lòng thử lại.')
    } finally {
      setActionLoading(false)
    }
  }

  // Publish novel handler
  const handlePublishConfirm = async () => {
    if (!publishModalNovel) return
    setActionLoading(true)
    setModalError('')

    try {
      await publishNovel(publishModalNovel.id)
      setPublishModalNovel(null)
      showToast('success', `Đã xuất bản truyện "${publishModalNovel.title}" thành công!`)
      await loadNovels()
    } catch (err) {
      setModalError(err.message || 'Không thể xuất bản truyện.')
    } finally {
      setActionLoading(false)
    }
  }

  // Delete novel handler
  const handleDeleteConfirm = async () => {
    if (!deleteModalNovel) return
    setActionLoading(true)
    setModalError('')

    try {
      await deleteNovel(deleteModalNovel.id)
      setDeleteModalNovel(null)
      showToast('success', `Đã xóa truyện "${deleteModalNovel.title}".`)
      await loadNovels()
    } catch (err) {
      setModalError(err.message || 'Không thể xóa truyện.')
    } finally {
      setActionLoading(false)
    }
  }

  const resetForm = () => {
    setFormTitle('')
    setFormDescription('')
    setFormCoverUrl('')
    setFormStatus('draft')
    setFormLanguage('vi')
    setFormCategoryId(null)
    setFormTagIds([])
    setModalError('')
  }

  // Computed filtering
  const publishedNovels = novels.filter((n) => n.visibility === 'public' || n.published_at)
  const draftNovels = novels.filter((n) => n.visibility !== 'public' && !n.published_at)

  const filteredNovels = novels.filter((novel) => {
    // Filter tab
    if (activeTab === 'published' && novel.visibility !== 'public' && !novel.published_at) {
      return false
    }
    if (activeTab === 'draft' && (novel.visibility === 'public' || novel.published_at)) {
      return false
    }

    // Filter status dropdown
    if (statusFilter !== 'all' && novel.status !== statusFilter) {
      return false
    }

    // Filter search string
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      const titleMatch = novel.title.toLowerCase().includes(query)
      const descMatch = novel.description?.toLowerCase().includes(query)
      if (!titleMatch && !descMatch) return false
    }

    return true
  })

  // Format Helper
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Chưa cập nhật'
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'draft':
        return <span className="composition-status-badge status-draft">Bản nháp</span>
      case 'ongoing':
        return <span className="composition-status-badge status-ongoing">Đang tiến hành</span>
      case 'completed':
        return <span className="composition-status-badge status-completed">Đã hoàn thành</span>
      case 'hiatus':
        return <span className="composition-status-badge status-hiatus">Tạm ngưng</span>
      default:
        return <span className="composition-status-badge">{status}</span>
    }
  }

  return (
    <div className="home-layout author-compositions-page">
      <Header />

      {/* Floating Toast Notification */}
      {toast && (
        <div className={`author-toast toast-${toast.type}`}>
          <span>{toast.text}</span>
          <button type="button" onClick={() => setToast(null)}>✕</button>
        </div>
      )}

      <main className="author-compositions-container">
        {/* Page Hero Header */}
        <section className="compositions-hero-card">
          <div className="hero-content">
            <div className="hero-title-row">
              <div className="hero-icon-box">
                <BookOpenIcon />
              </div>
              <div>
                <h1 className="hero-title">Sáng Tác Của Tôi</h1>
                <p className="hero-subtitle">
                  Quản lý các tác phẩm tiểu thuyết, bản nháp sáng tác và phát hành đến cộng đồng đọc truyện NovelHUB.
                </p>
              </div>
            </div>

            <button 
              type="button" 
              className="primary-button create-novel-btn"
              onClick={() => { resetForm(); setIsCreateModalOpen(true); }}
            >
              <PlusIcon />
              <span>Tạo Truyện Mới</span>
            </button>
          </div>

          {/* Quick Statistics Bar */}
          <div className="compositions-stats-bar">
            <div className="stat-item">
              <span className="stat-label">Tổng số tác phẩm</span>
              <strong className="stat-value">{novels.length}</strong>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-label">Đã xuất bản</span>
              <strong className="stat-value text-published">{publishedNovels.length}</strong>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-label">Bản nháp (Chưa xuất bản)</span>
              <strong className="stat-value text-draft">{draftNovels.length}</strong>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-label">Tổng lượt đọc</span>
              <strong className="stat-value">{novels.reduce((sum, n) => sum + (n.view_count || 0), 0).toLocaleString('vi-VN')}</strong>
            </div>
          </div>
        </section>

        {/* Filter & Navigation Section */}
        <section className="compositions-controls-section">
          {/* Tab Selection */}
          <div className="compositions-tabs-bar">
            <button
              type="button"
              className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              <span>Tất cả</span>
              <span className="tab-count-badge">{novels.length}</span>
            </button>

            <button
              type="button"
              className={`tab-btn ${activeTab === 'published' ? 'active' : ''}`}
              onClick={() => setActiveTab('published')}
            >
              <span>Đã xuất bản</span>
              <span className="tab-count-badge count-published">{publishedNovels.length}</span>
            </button>

            <button
              type="button"
              className={`tab-btn ${activeTab === 'draft' ? 'active' : ''}`}
              onClick={() => setActiveTab('draft')}
            >
              <span>Chưa xuất bản</span>
              <span className="tab-count-badge count-draft">{draftNovels.length}</span>
            </button>
          </div>

          {/* Search & Status Filter */}
          <div className="compositions-filter-bar">
            <div className="search-filter-box">
              <SearchIcon />
              <input
                type="text"
                placeholder="Tìm theo tên truyện..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button type="button" className="clear-filter-btn" onClick={() => setSearchQuery('')}>✕</button>
              )}
            </div>

            <div className="status-select-wrapper">
              <label htmlFor="status-filter">Trạng thái:</label>
              <FilterStatusSelect value={statusFilter} onChange={setStatusFilter} />
            </div>
          </div>
        </section>

        {/* Compositions List Section */}
        <section className="compositions-list-section">
          {loading ? (
            <div className="loading-state-card">
              <div className="spinner-ring" />
              <p>Đang tải danh sách tác phẩm sáng tác...</p>
            </div>
          ) : error ? (
            <div className="error-state-card">
              <p>{error}</p>
              <button type="button" className="secondary-button" onClick={loadNovels}>Thử lại</button>
            </div>
          ) : filteredNovels.length === 0 ? (
            <div className="empty-state-card">
              <div className="empty-icon-circle">
                <BookOpenIcon />
              </div>
              <h3>Không tìm thấy tác phẩm nào</h3>
              <p>
                {searchQuery || statusFilter !== 'all' || activeTab !== 'all'
                  ? 'Không có truyện nào phù hợp với bộ lọc hiện tại của bạn.'
                  : 'Bạn chưa tạo tác phẩm sáng tác nào. Hãy bắt đầu sáng tạo câu chuyện đầu tiên!'}
              </p>
              {!(searchQuery || statusFilter !== 'all' || activeTab !== 'all') && (
                <button
                  type="button"
                  className="primary-button modal-confirm-btn"
                  onClick={() => { resetForm(); setIsCreateModalOpen(true); }}
                  style={{ maxWidth: '220px', marginTop: '16px' }}
                >
                  <PlusIcon /> <span>Tạo truyện ngay</span>
                </button>
              )}
            </div>
          ) : (
            <div className="novel-compositions-grid">
              {filteredNovels.map((novel) => {
                const isPublished = novel.visibility === 'public' || novel.published_at
                const categoryObj = categories.find((c) => c.id === novel.category_id)

                return (
                  <article key={novel.id} className="novel-composition-card">
                    {/* Cover Thumbnail */}
                    <div className="novel-card-cover-wrapper">
                      {novel.cover_url ? (
                        <img 
                          src={novel.cover_url} 
                          alt={novel.title} 
                          className="novel-card-cover"
                          onError={(e) => {
                            e.target.style.display = 'none'
                            if (e.target.nextSibling) e.target.nextSibling.style.display = 'grid'
                          }}
                        />
                      ) : null}
                      <div className="novel-cover-placeholder" style={{ display: novel.cover_url ? 'none' : 'grid' }}>
                        <BookOpenIcon />
                        <span>{novel.title?.[0] || 'N'}</span>
                      </div>

                      {/* Visibility Badge on Image */}
                      <div className="cover-visibility-badge">
                        {isPublished ? (
                          <span className="vis-tag public">
                            <GlobeIcon /> Công khai
                          </span>
                        ) : (
                          <span className="vis-tag draft">
                            <LockIcon /> Chưa xuất bản
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Content Details */}
                    <div className="novel-card-info">
                      <div className="card-header-meta">
                        {renderStatusBadge(novel.status)}
                        {categoryObj && (
                          <span className="card-category-badge">{categoryObj.name}</span>
                        )}
                      </div>

                      <h3 className="novel-card-title">{novel.title}</h3>
                      <p className="novel-card-slug">/{novel.slug}</p>
                      
                      <p className="novel-card-description">
                        {novel.description || 'Chưa có mô tả tác phẩm.'}
                      </p>

                      {/* Novel Tags */}
                      {novel.tags && novel.tags.length > 0 && (
                        <div className="novel-card-tags-row">
                          {novel.tags.slice(0, 4).map((t) => (
                            <span key={t.id} className="card-tag-pill">#{t.name}</span>
                          ))}
                        </div>
                      )}

                      {/* Novel Statistics */}
                      <div className="card-metrics-row">
                        <div className="metric-chip" title="Lượt xem">
                          <EyeIcon /> <span>{novel.view_count || 0}</span>
                        </div>
                        <div className="metric-chip" title="Theo dõi">
                          <UserCheckIcon /> <span>{novel.follower_count || 0}</span>
                        </div>
                        <div className="metric-chip" title="Đánh giá trung bình">
                          <StarIcon /> <span>{novel.rating_average ? Number(novel.rating_average).toFixed(1) : '0.0'} ({novel.rating_count || 0})</span>
                        </div>
                      </div>

                      {/* Published / Updated Date */}
                      <div className="card-date-footer">
                        {isPublished ? (
                          <span>Xuất bản: {formatDate(novel.published_at)}</span>
                        ) : (
                          <span>Trạng thái: Bản nháp riêng tư</span>
                        )}
                      </div>

                      {/* Card Action Buttons */}
                      <div className="card-actions-row">
                        {!isPublished && (
                          <button
                            type="button"
                            className="action-btn publish-action-btn"
                            onClick={() => setPublishModalNovel(novel)}
                            title="Xuất bản tác phẩm đến độc giả"
                          >
                            <PublishIcon />
                            <span>Xuất bản</span>
                          </button>
                        )}

                        <button
                          type="button"
                          className="action-btn edit-action-btn"
                          onClick={() => openEditModal(novel)}
                          title="Chỉnh sửa chi tiết truyện"
                        >
                          <EditIcon />
                          <span>Sửa</span>
                        </button>

                        <button
                          type="button"
                          className="action-btn delete-action-btn"
                          onClick={() => setDeleteModalNovel(novel)}
                          title="Xóa tác phẩm"
                        >
                          <DeleteIcon />
                          <span>Xóa</span>
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </main>

      {/* --- MODAL 1: Create Novel --- */}
      {isCreateModalOpen && (
        <div className="author-modal-backdrop" onClick={() => setIsCreateModalOpen(false)}>
          <div className="author-modal-card wide-modal" onClick={(e) => e.stopPropagation()}>
            <div className="author-modal-header">
              <div>
                <h3>Tạo Truyện Mới</h3>
                <p className="modal-header-subtitle">Khởi tạo tác phẩm sáng tác mới ở dạng bản nháp</p>
              </div>
              <button type="button" className="close-modal-btn" onClick={() => setIsCreateModalOpen(false)}>
                <CloseIcon />
              </button>
            </div>

            {modalError && <div className="form-error modal-error-banner">{modalError}</div>}

            <form id="create-novel-form" onSubmit={handleCreateSubmit} className="modal-form-body">
              <div className="form-row-2col">
                <div className="field">
                  <label htmlFor="create-title">Tiêu đề truyện <span className="required-star">*</span></label>
                  <input
                    id="create-title"
                    type="text"
                    placeholder="Nhập tên tiểu thuyết..."
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    onInvalid={handleTitleInvalid('Vui lòng nhập tiêu đề truyện.')}
                    onInput={clearTitleValidity}
                    maxLength={250}
                    required
                  />
                </div>

                <div className="field">
                  <label>Thể loại tiểu thuyết</label>
                  <CustomCategorySelect
                    categories={categories}
                    value={formCategoryId}
                    onChange={setFormCategoryId}
                  />
                </div>
              </div>

              <div className="field">
                <label>Thẻ Tag gợi ý (Chọn tag liên quan)</label>
                <TagPicker
                  tags={tags}
                  selectedTagIds={formTagIds}
                  onChange={setFormTagIds}
                />
              </div>

              <div className="field">
                <label>Ảnh bìa tác phẩm (Máy tính hoặc URL)</label>
                <CoverImageInput value={formCoverUrl} onChange={setFormCoverUrl} />
              </div>

              <div className="field">
                <label htmlFor="create-description">Mô tả tác phẩm</label>
                <textarea
                  id="create-description"
                  rows={4}
                  placeholder="Tóm tắt vắn tắt nội dung, văn phong, bối cảnh câu chuyện..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  maxLength={10000}
                />
              </div>
            </form>

            <div className="modal-actions-footer">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={actionLoading}
              >
                Hủy
              </button>
              <button
                type="submit"
                form="create-novel-form"
                className="primary-button modal-confirm-btn"
                disabled={actionLoading}
              >
                {actionLoading ? 'Đang khởi tạo...' : 'Tạo Bản Nháp'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: Edit Novel --- */}
      {editModalNovel && (
        <div className="author-modal-backdrop" onClick={() => setEditModalNovel(null)}>
          <div className="author-modal-card wide-modal" onClick={(e) => e.stopPropagation()}>
            <div className="author-modal-header">
              <div>
                <h3>Chỉnh Sửa Tác Phẩm</h3>
                <p className="modal-header-subtitle">Cập nhật thông tin chi tiết và trạng thái phát hành tác phẩm</p>
              </div>
              <button type="button" className="close-modal-btn" onClick={() => setEditModalNovel(null)}>
                <CloseIcon />
              </button>
            </div>

            {modalError && <div className="form-error modal-error-banner">{modalError}</div>}

            <form id="edit-novel-form" onSubmit={handleEditSubmit} className="modal-form-body">
              <div className="form-row-2col">
                <div className="field">
                  <label htmlFor="edit-title">Tiêu đề truyện <span className="required-star">*</span></label>
                  <input
                    id="edit-title"
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    onInvalid={handleTitleInvalid('Vui lòng nhập tiêu đề truyện.')}
                    onInput={clearTitleValidity}
                    maxLength={250}
                    placeholder="Nhập tên tiểu thuyết..."
                    required
                  />
                </div>

                <div className="field">
                  <label>Trạng thái sáng tác</label>
                  <CustomStatusSelect value={formStatus} onChange={setFormStatus} />
                </div>
              </div>

              <div className="form-row-2col">
                <div className="field">
                  <label>Thể loại tiểu thuyết</label>
                  <CustomCategorySelect
                    categories={categories}
                    value={formCategoryId}
                    onChange={setFormCategoryId}
                  />
                </div>

                <div className="field">
                  <label htmlFor="edit-language">Mã ngôn ngữ</label>
                  <input
                    id="edit-language"
                    type="text"
                    value={formLanguage}
                    onChange={(e) => setFormLanguage(e.target.value)}
                    maxLength={10}
                    placeholder="vi"
                  />
                </div>
              </div>

              <div className="field">
                <label>Thẻ Tag gợi ý (Chọn tag liên quan)</label>
                <TagPicker
                  tags={tags}
                  selectedTagIds={formTagIds}
                  onChange={setFormTagIds}
                />
              </div>

              <div className="field">
                <label>Ảnh bìa tác phẩm (Máy tính hoặc URL)</label>
                <CoverImageInput value={formCoverUrl} onChange={setFormCoverUrl} />
              </div>

              <div className="field">
                <label htmlFor="edit-description">Mô tả tác phẩm</label>
                <textarea
                  id="edit-description"
                  rows={4}
                  placeholder="Nhập mô tả vắn tắt nội dung câu chuyện..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  maxLength={10000}
                />
              </div>
            </form>

            <div className="modal-actions-footer">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setEditModalNovel(null)}
                disabled={actionLoading}
              >
                Hủy
              </button>
              <button
                type="submit"
                form="edit-novel-form"
                className="primary-button modal-confirm-btn"
                disabled={actionLoading}
              >
                {actionLoading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: Publish Confirmation --- */}
      {publishModalNovel && (
        <div className="author-modal-backdrop" onClick={() => setPublishModalNovel(null)}>
          <div className="author-modal-card confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-confirm-body">
              <div className="modal-icon-center">
                <RocketIcon />
              </div>
              <h3 className="modal-confirm-title">Xuất bản tác phẩm</h3>
              <p className="modal-confirm-desc">
                Bạn có chắc chắn muốn xuất bản truyện <strong>"{publishModalNovel.title}"</strong>?
                Truyện sẽ chuyển sang chế độ Công khai để độc giả trên NovelHUB bắt đầu theo dõi và đọc tác phẩm.
              </p>

              {modalError && <div className="form-error modal-error-banner">{modalError}</div>}
            </div>

            <div className="modal-actions-footer align-center">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setPublishModalNovel(null)}
                disabled={actionLoading}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="primary-button modal-confirm-btn"
                onClick={handlePublishConfirm}
                disabled={actionLoading}
              >
                {actionLoading ? 'Đang xuất bản...' : 'Xác Nhận Xuất Bản'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 4: Delete Confirmation --- */}
      {deleteModalNovel && (
        <div className="author-modal-backdrop" onClick={() => setDeleteModalNovel(null)}>
          <div className="author-modal-card confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-confirm-body">
              <div className="modal-icon-center">
                <AlertTriangleIcon />
              </div>
              <h3 className="modal-confirm-title danger-title">Xóa tác phẩm</h3>
              <p className="modal-confirm-desc">
                Bạn có chắc chắn muốn xóa tác phẩm <strong>"{deleteModalNovel.title}"</strong>?
                Tác phẩm sẽ bị gỡ khỏi danh sách hiển thị sáng tác.
              </p>

              {modalError && <div className="form-error modal-error-banner">{modalError}</div>}
            </div>

            <div className="modal-actions-footer align-center">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setDeleteModalNovel(null)}
                disabled={actionLoading}
              >
                Hủy
              </button>
              <button
                type="button"
                className="danger-button"
                onClick={handleDeleteConfirm}
                disabled={actionLoading}
              >
                {actionLoading ? 'Đang xóa...' : 'Xác Nhận Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
