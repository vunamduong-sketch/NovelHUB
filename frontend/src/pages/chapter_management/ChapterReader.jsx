import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Header } from '../../components/Header.jsx'
import { Footer } from '../../components/Footer.jsx'
import { getNovelDetail } from '../../api/novelApi.js'
import { getPublicChapterDetail, fetchPublicChapters } from '../../api/chapterApi.js'
import { BookmarkButton } from '../../components/reader/BookmarkButton.jsx'
import { useReadingProgress } from '../../hooks/useReadingProgress.js'

function ChevronLeftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"></polyline>
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

export function ChapterReader() {
  const { novelId, chapterId } = useParams()
  const navigate = useNavigate()

  const [novel, setNovel] = useState(null)
  const [chapter, setChapter] = useState(null)
  const [chapters, setChapters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [fontSize, setFontSize] = useState(18)
  const [theme, setTheme] = useState('light')
  const articleRef = useRef(null)

  const { getReadingPosition } = useReadingProgress({
    chapterId,
    chapter,
    loading,
    error,
    articleRef,
  })


  useEffect(() => {
    const loadChapterAndNovel = async () => {
      setLoading(true)
      setError(null)
      try {
        const [novelData, chapterData, chaptersData] = await Promise.all([
          getNovelDetail(novelId),
          getPublicChapterDetail(chapterId),
          fetchPublicChapters(novelId)
        ])
        setNovel(novelData)
        setChapter(chapterData)
        setChapters(chaptersData || [])
      } catch (err) {
        setError(err.message || 'Không thể tải chương này.')
      } finally {
        setLoading(false)
      }
    }
    loadChapterAndNovel()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [novelId, chapterId])

  const currentIndex = chapters.findIndex((c) => c.id === chapterId)
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null
  const nextChapter = currentIndex >= 0 && currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null

  const getThemeStyles = () => {
    switch (theme) {
      case 'sepia':
        return { backgroundColor: '#f4ecd8', color: '#5b4636', border: '1px solid #e7dec2' }
      case 'dark':
        return { backgroundColor: '#1a1a1a', color: '#ccc', border: '1px solid #333' }
      default:
        return { backgroundColor: '#ffffff', color: '#2c3e50', border: '1px solid var(--border-color)' }
    }
  }

  const handleNavigateChapter = (targetId) => {
    if (targetId) navigate(`/novels/${novelId}/chapters/${targetId}`)
  }

  return (
    <div className={`home-layout theme-${theme}`} style={{ transition: 'all 0.3s ease' }}>
      <Header />

      <main className="home-body" style={{ maxWidth: '800px', margin: '0 auto', padding: '20px 16px' }}>
        {loading ? (
          <div className="loading-state-card" style={{ margin: '60px auto' }}>
            <div className="spinner-ring" />
            <p>Đang tải nội dung chương...</p>
          </div>
        ) : error ? (
          <div className="empty-state-card" style={{ margin: '60px auto' }}>
            <h3>Lỗi tải chương</h3>
            <p>{error}</p>
            <button type="button" className="primary-button" style={{ marginTop: '16px' }} onClick={() => navigate(`/novels/${novelId}`)}>
              Quay lại chi tiết truyện
            </button>
          </div>
        ) : (
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              ...getThemeStyles()
            }}>
              <div className="chapter-reader-leaft-actions">
                <button
                  type="button"
                  className="secondary-button"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    fontSize: '14px',
                  }}
                  onClick={() => navigate(`/novels/${novelId}`)}
                >
                  <ListIcon />  Mục Lục
                </button>
                <BookmarkButton chapterId={chapterId} />
              </div>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid gray', cursor: 'pointer' }}
                    onClick={() => setFontSize(Math.max(14, fontSize - 2))}
                    title="Giảm cỡ chữ"
                  >
                    A-
                  </button>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{fontSize}</span>
                  <button
                    type="button"
                    style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid gray', cursor: 'pointer' }}
                    onClick={() => setFontSize(Math.min(26, fontSize + 2))}
                    title="Tăng cỡ chữ"
                  >
                    A+
                  </button>
                </div>

                <div style={{ display: 'inline-flex', gap: '8px' }}>
                  {['light', 'sepia', 'dark'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTheme(t)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        border: theme === t ? '2px solid #5b4636' : '1px solid gray',
                        background: t === 'light' ? '#fff' : t === 'sepia' ? '#f4ecd8' : '#333',
                        color: t === 'dark' ? '#fff' : '#000'
                      }}
                    >
                      {t === 'light' ? 'Sáng' : t === 'sepia' ? 'Trà' : 'Tối'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <article ref={articleRef} style={{
              padding: '24px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              minHeight: '400px',
              transition: 'background-color 0.3s ease, color 0.3s ease',
              ...getThemeStyles()
            }}>
              <header style={{ textAlign: 'center', borderBottom: '1px dashed rgba(0,0,0,0.1)', paddingBottom: '20px', marginBottom: '30px' }}>
                <span style={{ fontSize: '14px', opacity: 0.8, textTransform: 'uppercase', tracking: '1px' }}>
                  {novel?.title}
                </span>
                <h1 style={{ fontSize: '24px', marginTop: '10px', marginBottom: '10px', fontWeight: '700' }}>
                  Chương {Number(chapter?.chapter_number)}: {chapter?.title}
                </h1>
                <div style={{ fontSize: '13px', opacity: 0.7 }}>
                  Cập nhật: {new Date(chapter?.published_at || chapter?.created_at).toLocaleDateString('vi-VN')} • {chapter?.word_count} từ
                </div>
              </header>

              <div style={{
                fontSize: `${fontSize}px`,
                lineHeight: '1.8',
                fontFamily: '"Georgia", "Times New Roman", serif',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {chapter?.content ? (
                  chapter.content.split('\n').map((para, i) => (
                    para.trim() ? <p key={i} style={{ marginBottom: '1.5em', textIndent: '1em' }}>{para}</p> : <br key={i} />
                  ))
                ) : (
                  <p style={{ fontStyle: 'italic', textAlign: 'center' }}>Chương này không có nội dung.</p>
                )}
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderTop: '1px solid rgba(0,0,0,0.1)',
                paddingTop: '20px',
                marginTop: '40px',
                gap: '12px'
              }}>
                <button
                  type="button"
                  className="secondary-button"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'center' }}
                  onClick={() => handleNavigateChapter(prevChapter?.id)}
                  disabled={!prevChapter}
                >
                  <ChevronLeftIcon /> Chương trước
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 16px' }}
                  onClick={() => navigate(`/novels/${novelId}`)}
                >
                  Mục lục
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'center' }}
                  onClick={() => handleNavigateChapter(nextChapter?.id)}
                  disabled={!nextChapter}
                >
                  Chương sau <ChevronRightIcon />
                </button>
              </div>
            </article>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
