import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Header } from '../../components/Header.jsx'
import { Footer } from '../../components/Footer.jsx'
import { getNovelDetail, getAuthorNovelDetail } from '../../api/novelApi.js'
import { fetchMyChapters, deleteChapter, publishChapter } from '../../api/chapterApi.js'


function ArrowLeftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"></line>
      <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
  )
}

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

export function ChapterList() {
  const { novelId } = useParams()
  const navigate = useNavigate()

  const [novel, setNovel] = useState(null)
  const [chapters, setChapters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const showToast = (type, text) => {
    setToast({ type, text })
    setTimeout(() => setToast(null), 4000)
  }

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [novelData, chaptersData] = await Promise.all([
        getAuthorNovelDetail(novelId),
        fetchMyChapters(novelId)
      ])
      setNovel(novelData)
      setChapters(chaptersData || [])
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách chương.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [novelId])

  const handlePublish = async (chapterId) => {
    try {
      await publishChapter(chapterId)
      showToast('success', 'Xuất bản chương thành công!')
      const updated = await fetchMyChapters(novelId)
      setChapters(updated || [])
    } catch (err) {
      showToast('error', err.message || 'Không thể xuất bản chương.')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteChapter(deleteTarget.id)
      showToast('success', 'Xóa chương thành công!')
      setChapters(chapters.filter((c) => c.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      showToast('error', err.message || 'Không thể xóa chương.')
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="home-layout author-compositions-page">
      <Header />

      {toast && (
        <div className={`author-toast toast-${toast.type}`} style={{ zIndex: 3000 }}>
          <span>{toast.text}</span>
          <button type="button" onClick={() => setToast(null)}>✕</button>
        </div>
      )}

      <main className="author-compositions-container">
        <div style={{ marginBottom: '20px' }}>
          <button
            type="button"
            className="secondary-button"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
            onClick={() => navigate('/author/compositions')}
          >
            <ArrowLeftIcon /> Quay lại danh tác
          </button>
        </div>

        {loading ? (
          <div className="loading-state-card" style={{ margin: '40px auto' }}>
            <div className="spinner-ring" />
            <p>Đang tải danh sách chương...</p>
          </div>
        ) : error ? (
          <div className="error-state-card" style={{ margin: '40px auto' }}>
            <p>{error}</p>
            <button type="button" className="secondary-button" onClick={loadData}>Thử lại</button>
          </div>
        ) : (
          <section className="compositions-hero-card" style={{ padding: '24px' }}>
            <div className="hero-content" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px', marginBottom: '20px' }}>
              <div>
                <h1 className="hero-title" style={{ fontSize: '24px' }}>Quản Lý Chương</h1>
                <p className="hero-subtitle" style={{ marginTop: '4px' }}>
                  Truyện: <strong>{novel?.title}</strong>
                </p>
              </div>

              <Link
                to={`/author/novels/${novelId}/chapters/create`}
                className="primary-button create-novel-btn"
                style={{ textDecoration: 'none' }}
              >
                <PlusIcon /> <span>Viết Chương Mới</span>
              </Link>
            </div>

            <div className="compositions-stats-bar" style={{ background: 'rgba(0,0,0,0.02)', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
              <div className="stat-item">
                <span className="stat-label">Tổng số chương</span>
                <strong className="stat-value">{chapters.length}</strong>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <span className="stat-label">Đã xuất bản</span>
                <strong className="stat-value text-published">{chapters.filter((c) => c.status === 'published').length}</strong>
              </div>
              <div className="stat-divider" />
              <div className="stat-item">
                <span className="stat-label">Bản nháp</span>
                <strong className="stat-value text-draft">{chapters.filter((c) => c.status === 'draft').length}</strong>
              </div>
            </div>

            {chapters.length === 0 ? (
              <div className="empty-state-card" style={{ padding: '60px 20px' }}>
                <h3>Bộ truyện này chưa có chương nào</h3>
                <p>Bắt đầu viết chương đầu tiên để độc giả có thể thưởng thức tác phẩm của bạn.</p>
                <Link
                  to={`/author/novels/${novelId}/chapters/create`}
                  className="primary-button"
                  style={{
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    margin: '20px auto 0 auto',
                    width: 'fit-content',
                    padding: '12px 24px',
                    fontSize: '15px',
                    fontWeight: '600'
                  }}
                >
                  <PlusIcon /> <span>Viết chương ngay</span>
                </Link>
              </div>
            ) : (
              <div className="table-responsive" style={{ overflowX: 'auto' }}>
                <table className="author-compositions-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '10px' }}>
                      <th style={{ padding: '12px' }}>Số</th>
                      <th style={{ padding: '12px' }}>Tiêu đề</th>
                      <th style={{ padding: '12px' }}>Số chữ</th>
                      <th style={{ padding: '12px' }}>Trạng thái</th>
                      <th style={{ padding: '12px' }}>Ngày đăng</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chapters.map((chapter) => (
                      <tr key={chapter.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '12px', fontWeight: 'bold' }}>{Number(chapter.chapter_number)}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{ fontSize: '15px', fontWeight: '500' }}>{chapter.title}</span>
                          {chapter.summary && (
                            <p style={{ fontSize: '12px', color: 'gray', margin: '4px 0 0 0' }}>{chapter.summary}</p>
                          )}
                        </td>
                        <td style={{ padding: '12px' }}>{chapter.word_count?.toLocaleString('vi-VN')} từ</td>
                        <td style={{ padding: '12px' }}>
                          {chapter.status === 'published' ? (
                            <span className="composition-status-badge status-ongoing">Đã đăng</span>
                          ) : (
                            <span className="composition-status-badge status-draft">Nháp</span>
                          )}
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px' }}>{formatDate(chapter.published_at || chapter.created_at)}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px', justifyContent: 'flex-end' }}>
                            {chapter.status !== 'published' && (
                              <button
                                type="button"
                                className="action-btn publish-action-btn"
                                onClick={() => handlePublish(chapter.id)}
                                title="Xuất bản ngay"
                              >
                                <PublishIcon />
                              </button>
                            )}
                            <Link
                              to={`/author/novels/${novelId}/chapters/${chapter.id}/edit`}
                              className="action-btn edit-action-btn"
                              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: '32px', width: '32px' }}
                              title="Sửa chương"
                            >
                              <EditIcon />
                            </Link>
                            <button
                              type="button"
                              className="action-btn delete-action-btn"
                              onClick={() => setDeleteTarget(chapter)}
                              title="Xóa chương"
                            >
                              <DeleteIcon />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>

      {deleteTarget && (
        <div className="author-modal-backdrop" onClick={() => setDeleteTarget(null)} style={{ zIndex: 4000 }}>
          <div className="author-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="author-modal-header">
              <h3>Xác nhận xóa chương</h3>
            </div>
            <div className="author-modal-body" style={{ padding: '20px 0' }}>
              <p>Bạn có chắc chắn muốn xóa chương <strong>{deleteTarget.title}</strong>?</p>
              <p style={{ color: 'red', fontSize: '13px', marginTop: '8px' }}>Lưu ý: Hành động này không thể hoàn tác.</p>
            </div>
            <div className="author-modal-footer" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" className="secondary-button" onClick={() => setDeleteTarget(null)}>
                Hủy bỏ
              </button>
              <button type="button" className="primary-button" style={{ background: '#d93838' }} onClick={handleDelete}>
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
