import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createChapterComment,
  fetchChapterComments,
  replyComment,
} from '../../api/communityApi.js'
import { useAuth } from '../../auth/useAuth.js'
import '../../styles/community.css'


function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('vi-VN')
}


export function ChapterComments({ chapterId }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [comments, setComments] = useState([])
  const [content, setContent] = useState('')
  const [replyContentById, setReplyContentById] = useState({})
  const [activeReplyId, setActiveReplyId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const loadComments = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchChapterComments(chapterId)
      setComments(data || [])
    } catch (err) {
      setError(err.message || 'Không thể tải bình luận.')
    } finally {
      setLoading(false)
    }
  }, [chapterId])

  useEffect(() => {
    if (!chapterId) return undefined
    const timer = window.setTimeout(() => {
      void loadComments()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [chapterId, loadComments])

  const requireLogin = () => {
    if (user) return true
    navigate('/login')
    return false
  }

  const handleCreateComment = async (event) => {
    event.preventDefault()
    if (!requireLogin()) return
    if (!content.trim()) return

    setSubmitting(true)
    setError('')
    try {
      await createChapterComment(chapterId, content)
      setContent('')
      await loadComments()
    } catch (err) {
      setError(err.message || 'Không thể gửi bình luận.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReply = async (commentId) => {
    if (!requireLogin()) return
    const replyContent = replyContentById[commentId] || ''
    if (!replyContent.trim()) return

    setSubmitting(true)
    setError('')
    try {
      await replyComment(commentId, replyContent)
      setReplyContentById((prev) => ({ ...prev, [commentId]: '' }))
      setActiveReplyId(null)
      await loadComments()
    } catch (err) {
      setError(err.message || 'Không thể gửi phản hồi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="community-panel">
      <div className="community-panel-header">
        <div>
          <span>Community</span>
          <h2>Bình luận chương</h2>
        </div>
        <strong>{comments.length} bình luận</strong>
      </div>

      <form className="community-form" onSubmit={handleCreateComment}>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={user ? 'Viết cảm nhận của bạn về chương này...' : 'Đăng nhập để bình luận'}
          maxLength={5000}
          disabled={!user || submitting}
        />
        <div className="community-form-footer">
          {!user ? (
            <button type="button" className="secondary-button" onClick={() => navigate('/login')}>
              Đăng nhập
            </button>
          ) : (
            <button type="submit" className="primary-button" disabled={submitting || !content.trim()}>
              Gửi bình luận
            </button>
          )}
        </div>
      </form>

      {error && <p className="community-error">{error}</p>}

      {loading ? (
        <div className="community-state">Đang tải bình luận...</div>
      ) : comments.length === 0 ? (
        <div className="community-state">Chưa có bình luận nào cho chương này.</div>
      ) : (
        <div className="community-list">
          {comments.map((comment) => (
            <article key={comment.id} className="community-comment">
              <div className="community-comment-meta">
                <strong>{comment.display_name || comment.username}</strong>
                <span>{formatDate(comment.created_at)}</span>
              </div>
              <p>{comment.content}</p>
              <button
                type="button"
                className="community-link-button"
                onClick={() => {
                  if (!requireLogin()) return
                  setActiveReplyId((current) => current === comment.id ? null : comment.id)
                }}
              >
                Trả lời
              </button>

              {activeReplyId === comment.id && (
                <div className="community-reply-box">
                  <textarea
                    value={replyContentById[comment.id] || ''}
                    onChange={(event) => setReplyContentById((prev) => ({
                      ...prev,
                      [comment.id]: event.target.value,
                    }))}
                    placeholder="Viết phản hồi..."
                    maxLength={5000}
                    disabled={submitting}
                  />
                  <button
                    type="button"
                    className="primary-button"
                    disabled={submitting || !(replyContentById[comment.id] || '').trim()}
                    onClick={() => handleReply(comment.id)}
                  >
                    Gửi phản hồi
                  </button>
                </div>
              )}

              {comment.replies?.length > 0 && (
                <div className="community-replies">
                  {comment.replies.map((reply) => (
                    <article key={reply.id} className="community-comment community-comment-reply">
                      <div className="community-comment-meta">
                        <strong>{reply.display_name || reply.username}</strong>
                        <span>{formatDate(reply.created_at)}</span>
                      </div>
                      <p>{reply.content}</p>
                    </article>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
