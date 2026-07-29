import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PasswordField } from '../../components/auth/PasswordField.jsx'
import { useAuth } from '../../auth/useAuth.js'
import { AuthLayout } from './AuthLayout.jsx'

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [identity, setIdentity] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await signIn(identity, password)
      navigate('/', { replace: true })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Chào mừng trở lại" subtitle="Tiếp tục hành trình đọc truyện của bạn.">
      <form onSubmit={handleSubmit} noValidate>
        <label className="field">
          <span>Email hoặc Tên người dùng</span>
          <input
            type="text"
            value={identity}
            onChange={(event) => setIdentity(event.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <PasswordField
          label="Mật khẩu"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button" disabled={submitting} type="submit">
          {submitting ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </button>
      </form>
      <p className="forgot-link">
        <a href="/forgot-password">Quên mật khẩu?</a>
      </p>
      <p className="form-footer">
        Bạn chưa có tài khoản NovelHUB? <a href="/register">Tạo tài khoản mới</a>
      </p>
    </AuthLayout>
  )
}
