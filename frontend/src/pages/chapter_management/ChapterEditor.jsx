import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Header } from '../../components/Header.jsx'
import { Footer } from '../../components/Footer.jsx'
import { getAuthorNovelDetail } from '../../api/novelApi.js'
import { getAuthorChapterDetail, createChapter, updateChapter } from '../../api/chapterApi.js'


function ArrowLeftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"></line>
      <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
  )
}

function SaveIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
      <polyline points="17 21 17 13 7 13 7 21"></polyline>
      <polyline points="7 3 7 8 15 8"></polyline>
    </svg>
  )
}

function PublishIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 2L11 13"></path>
      <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
  )
}

export function ChapterEditor() {
  const { novelId, chapterId } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!chapterId

  const [novel, setNovel] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)

  // Form Fields
  const [title, setTitle] = useState('')
  const [chapterNumber, setChapterNumber] = useState('')
  const [summary, setSummary] = useState('')
  const [content, setContent] = useState('')
  const [status, setStatus] = useState('draft')

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      try {
        const novelData = await getAuthorNovelDetail(novelId)
        setNovel(novelData)


        if (isEditMode) {
          const chapterData = await getAuthorChapterDetail(chapterId)
          setTitle(chapterData.title)
          setChapterNumber(Number(chapterData.chapter_number).toString())
          setSummary(chapterData.summary || '')
          setContent(chapterData.content || '')
          setStatus(chapterData.status || 'draft')
        } else {
          setTitle('')
          setChapterNumber('')
          setSummary('')
          setContent('')
          setStatus('draft')
        }
      } catch (err) {
        setError(err.message || 'Không thể tải thông tin.')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [novelId, chapterId, isEditMode])

  const handleSubmit = async (submitStatus) => {
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề chương.')
      return
    }
    if (!chapterNumber || isNaN(parseFloat(chapterNumber)) || parseFloat(chapterNumber) <= 0) {
      alert('Vui lòng nhập số thứ tự chương hợp lệ (lớn hơn 0).')
      return
    }

    setActionLoading(true)
    try {
      const payload = {
        title: title.trim(),
        chapter_number: parseFloat(chapterNumber),
        content,
        summary: summary.trim() || null,
        status: submitStatus || status,
      }

      if (isEditMode) {
        await updateChapter(chapterId, payload)
      } else {
        await createChapter(novelId, payload)
      }
      navigate(`/author/novels/${novelId}/chapters`)
    } catch (err) {
      alert(err.message || 'Lỗi khi lưu chương.')
    } finally {
      setActionLoading(false)
    }
  }

  const getWordCount = () => {
    if (!content) return 0
    return content.trim().split(/\s+/).filter(Boolean).length
  }

  return (
    <div className="home-layout author-compositions-page">
      <Header />

      <main className="author-compositions-container" style={{ maxWidth: '900px' }}>
        <div style={{ marginBottom: '20px' }}>
          <button
            type="button"
            className="secondary-button"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
            onClick={() => navigate(`/author/novels/${novelId}/chapters`)}
            disabled={actionLoading}
          >
            <ArrowLeftIcon /> Quay lại quản lý chương
          </button>
        </div>

        {loading ? (
          <div className="loading-state-card" style={{ margin: '40px auto' }}>
            <div className="spinner-ring" />
            <p>Đang tải thông tin biên tập chương...</p>
          </div>
        ) : error ? (
          <div className="error-state-card" style={{ margin: '40px auto' }}>
            <p>{error}</p>
            <button type="button" className="secondary-button" onClick={() => navigate(`/author/novels/${novelId}/chapters`)}>Quay lại</button>
          </div>
        ) : (
          <section className="compositions-hero-card" style={{ padding: '24px' }}>
            <h1 className="hero-title" style={{ fontSize: '22px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '20px' }}>
              {isEditMode ? 'Chỉnh Sửa Chương' : 'Soạn Thảo Chương Mới'}
            </h1>
            <p className="hero-subtitle" style={{ marginBottom: '20px', color: 'gray' }}>
              Truyện: <strong>{novel?.title}</strong>
            </p>

            <form onSubmit={(e) => { e.preventDefault(); }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '16px' }}>
                <div className="form-group">
                  <label htmlFor="chapter-number" style={{ display: 'block', fontWeight: '500', marginBottom: '8px' }}>Số chương *</label>
                  <input
                    id="chapter-number"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="VD: 1 hoặc 1.1"
                    value={chapterNumber}
                    onChange={(e) => setChapterNumber(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="chapter-title" style={{ display: 'block', fontWeight: '500', marginBottom: '8px' }}>Tiêu đề chương *</label>
                  <input
                    id="chapter-title"
                    type="text"
                    placeholder="Nhập tiêu đề chương truyện..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="chapter-summary" style={{ display: 'block', fontWeight: '500', marginBottom: '8px' }}>Tóm tắt chương (Tùy chọn)</label>
                <textarea
                  id="chapter-summary"
                  placeholder="Nhập tóm tắt ngắn của chương này..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows="2"
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', resize: 'vertical' }}
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label htmlFor="chapter-content" style={{ fontWeight: '500' }}>Nội dung chương *</label>
                  <span style={{ fontSize: '13px', color: 'gray' }}>{getWordCount()} từ</span>
                </div>
                <textarea
                  id="chapter-content"
                  placeholder="Viết nội dung chương truyện tại đây..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows="18"
                  required
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontFamily: 'serif',
                    fontSize: '16px',
                    lineHeight: '1.6',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => navigate(`/author/novels/${novelId}/chapters`)}
                  disabled={actionLoading}
                  style={{ padding: '10px 20px' }}
                >
                  Hủy bỏ
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => handleSubmit('draft')}
                  disabled={actionLoading}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
                >
                  <SaveIcon /> {isEditMode && status === 'draft' ? 'Lưu nháp' : 'Lưu thành bản nháp'}
                </button>

                <button
                  type="button"
                  className="primary-button"
                  onClick={() => handleSubmit('published')}
                  disabled={actionLoading}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
                >
                  <PublishIcon /> Xuất bản ngay
                </button>
              </div>
            </form>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}
