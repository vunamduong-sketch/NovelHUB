import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Header } from '../../components/Header.jsx'
import { Footer } from '../../components/Footer.jsx'
import { getAuthorNovelDetail } from '../../api/novelApi.js'
import { getAuthorChapterDetail, createChapter, updateChapter } from '../../api/chapterApi.js'
import { summarizeChapterContent, suggestChapterTitle, checkChapterGrammar, suggestWriting } from '../../api/aiApi.js'

const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center'
}
const modalContentStyle = {
  backgroundColor: '#fff', padding: '24px', borderRadius: '8px', width: '90%', maxWidth: '450px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
}

function SparkleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
    </svg>
  )
}


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

  // AI States
  const [aiLoading, setAiLoading] = useState(false)
  const [showTitleModal, setShowTitleModal] = useState(false)
  const [titleSuggestions, setTitleSuggestions] = useState([])
  const [showGrammarModal, setShowGrammarModal] = useState(false)
  const [grammarSuggestions, setGrammarSuggestions] = useState([])
  const [showWritingModal, setShowWritingModal] = useState(false)
  const [writingPrompt, setWritingPrompt] = useState('')
  const [writingSuggestion, setWritingSuggestion] = useState('')

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
    if (!content.trim()) {
      alert('Vui lòng nhập nội dung chương.')
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

  // AI Handlers
  const handleSuggestTitle = async () => {
    if (!content.trim()) return alert("Vui lòng nhập nội dung chương trước khi nhờ AI gợi ý tiêu đề.")
    setAiLoading(true)
    try {
      const titles = await suggestChapterTitle(novelId, content)
      setTitleSuggestions(titles)
      setShowTitleModal(true)
    } catch (err) {
      alert("Lỗi khi gọi AI: " + (err.response?.data?.detail || err.message))
    } finally {
      setAiLoading(false)
    }
  }

  const handleSummarize = async () => {
    if (!content.trim()) return alert("Vui lòng nhập nội dung chương trước.")
    setAiLoading(true)
    try {
      const result = await summarizeChapterContent(novelId, content)
      setSummary(result)
    } catch (err) {
      alert("Lỗi khi gọi AI: " + (err.response?.data?.detail || err.message))
    } finally {
      setAiLoading(false)
    }
  }

  const handleCheckGrammar = async () => {
    if (!content.trim()) return alert("Vui lòng nhập nội dung chương trước.")
    setAiLoading(true)
    try {
      const suggestions = await checkChapterGrammar(novelId, content)
      setGrammarSuggestions(suggestions)
      setShowGrammarModal(true)
    } catch (err) {
      alert("Lỗi khi gọi AI: " + (err.response?.data?.detail || err.message))
    } finally {
      setAiLoading(false)
    }
  }
  
  const handleApplyGrammar = (original, suggested, index) => {
    setContent(prev => prev.replace(original, suggested))
    setGrammarSuggestions(prev => prev.filter((_, i) => i !== index))
  }

  const handleSuggestWriting = async () => {
    setAiLoading(true)
    try {
      const result = await suggestWriting(novelId, content, writingPrompt)
      setWritingSuggestion(result)
    } catch (err) {
      alert("Lỗi khi gọi AI: " + (err.response?.data?.detail || err.message))
    } finally {
      setAiLoading(false)
    }
  }
  
  const handleAppendWriting = () => {
    setContent(prev => prev + (prev.endsWith('\n') ? '' : '\n\n') + writingSuggestion)
    setShowWritingModal(false)
    setWritingSuggestion('')
    setWritingPrompt('')
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label htmlFor="chapter-title" style={{ fontWeight: '500' }}>Tiêu đề chương *</label>
                    <button type="button" onClick={handleSuggestTitle} disabled={aiLoading} className="secondary-button" style={{ padding: '4px 8px', fontSize: '13px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <SparkleIcon /> Gợi ý AI
                    </button>
                  </div>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label htmlFor="chapter-summary" style={{ fontWeight: '500' }}>Tóm tắt chương (Tùy chọn)</label>
                  <button type="button" onClick={handleSummarize} disabled={aiLoading} className="secondary-button" style={{ padding: '4px 8px', fontSize: '13px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <SparkleIcon /> Tự động tóm tắt
                  </button>
                </div>
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
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button type="button" onClick={handleCheckGrammar} disabled={aiLoading} className="secondary-button" style={{ padding: '4px 8px', fontSize: '13px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <SparkleIcon /> Sửa lỗi
                    </button>
                    <button type="button" onClick={() => setShowWritingModal(true)} disabled={aiLoading} className="secondary-button" style={{ padding: '4px 8px', fontSize: '13px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <SparkleIcon /> Viết tiếp
                    </button>
                    <span style={{ fontSize: '13px', color: 'gray', marginLeft: '10px' }}>{getWordCount()} từ</span>
                  </div>
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

                {status !== 'published' && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => handleSubmit('draft')}
                    disabled={actionLoading}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
                  >
                    <SaveIcon /> {isEditMode && status === 'draft' ? 'Lưu nháp' : 'Lưu thành bản nháp'}
                  </button>
                )}

                <button
                  type="button"
                  className="primary-button"
                  onClick={() => handleSubmit('published')}
                  disabled={actionLoading}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
                >
                  {status === 'published' ? (
                    <>
                      <SaveIcon /> Lưu thay đổi
                    </>
                  ) : (
                    <>
                      <PublishIcon /> Xuất bản ngay
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>
        )}
      </main>

      {/* Modal: Gợi ý Tiêu đề */}
      {showTitleModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h3 style={{marginTop: 0}}>Chọn tiêu đề gợi ý</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '20px 0' }}>
              {titleSuggestions.map((t, idx) => (
                <button key={idx} type="button" className="secondary-button" style={{textAlign: 'left', padding: '12px'}} onClick={() => { setTitle(t); setShowTitleModal(false); }}>
                  {t}
                </button>
              ))}
            </div>
            <div style={{textAlign: 'right'}}><button type="button" className="secondary-button" onClick={() => setShowTitleModal(false)}>Đóng</button></div>
          </div>
        </div>
      )}

      {/* Modal: Kiểm tra ngữ pháp */}
      {showGrammarModal && (
        <div style={modalOverlayStyle}>
          <div style={{...modalContentStyle, maxWidth: '600px'}}>
            <h3 style={{marginTop: 0}}>Lỗi Ngữ Pháp & Chính Tả</h3>
            {grammarSuggestions.length === 0 ? (
              <p>Tuyệt vời! Không tìm thấy lỗi nào đáng kể.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '20px 0', maxHeight: '400px', overflowY: 'auto' }}>
                {grammarSuggestions.map((item, idx) => (
                  <div key={idx} style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                    <p style={{margin: '0 0 8px 0'}}><strong>Lỗi:</strong> <span style={{color: '#d9534f', textDecoration: 'line-through'}}>{item.original_text}</span> ➡️ <span style={{color: '#5cb85c', fontWeight: 'bold'}}>{item.suggested_text}</span></p>
                    <p style={{margin: '0 0 12px 0', fontSize: '13px', color: 'gray'}}><em>Lý do: {item.reason}</em></p>
                    <button type="button" className="primary-button" style={{padding: '6px 12px', fontSize: '13px'}} onClick={() => handleApplyGrammar(item.original_text, item.suggested_text, idx)}>Chấp nhận sửa</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{textAlign: 'right'}}><button type="button" className="secondary-button" onClick={() => setShowGrammarModal(false)}>Đóng</button></div>
          </div>
        </div>
      )}

      {/* Modal: Viết tiếp */}
      {showWritingModal && (
        <div style={modalOverlayStyle}>
          <div style={{...modalContentStyle, maxWidth: '600px'}}>
            <h3 style={{marginTop: 0}}>Trợ lý Viết Tiếp AI</h3>
            <textarea
              placeholder="Nhập chỉ dẫn định hướng cho AI (ví dụ: 'Cho nhân vật chính tìm thấy thanh gươm...'). Bỏ trống nếu muốn AI tự do sáng tạo."
              value={writingPrompt}
              onChange={e => setWritingPrompt(e.target.value)}
              rows="3"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', marginTop: '10px' }}
            />
            <div style={{ marginTop: '16px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" className="primary-button" onClick={handleSuggestWriting} disabled={aiLoading}>
                {aiLoading ? 'Đang tạo...' : 'Tạo nội dung ✨'}
              </button>
            </div>

            {writingSuggestion && (
              <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                <h4 style={{marginTop: 0, marginBottom: '10px', fontSize: '14px', color: '#555'}}>Nội dung gợi ý:</h4>
                <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '15px', marginBottom: '16px' }}>{writingSuggestion}</p>
                <button type="button" className="primary-button" onClick={handleAppendWriting}>Chèn vào cuối nội dung</button>
              </div>
            )}
            
            <div style={{textAlign: 'right', marginTop: '20px'}}><button type="button" className="secondary-button" onClick={() => setShowWritingModal(false)}>Đóng</button></div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
