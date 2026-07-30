import { useState } from 'react'
import { FormField } from '../../components/auth/FormField.jsx'
import { requestPasswordReset } from '../../auth/authApi.js'
import { AuthLayout } from './AuthLayout.jsx'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      setResult(await requestPasswordReset(email))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Đặt lại mật khẩu"
      subtitle="Nhập email của bạn và chúng tôi sẽ hỗ trợ khôi phục tài khoản."
    >
      {result ? (
        <>
          <p className="form-success" role="status">
            {result.message || 'Nếu tài khoản tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn.'}
          </p>
          {result.debug_reset_token && (
            <div className="development-token">
              <strong>Mã Token thử nghiệm (Development token)</strong>
              <p>Mã này chỉ hiển thị ở môi trường thử nghiệm cục bộ.</p>
              <a href={`/reset-password?token=${encodeURIComponent(result.debug_reset_token)}`}>
                Tiếp tục đặt lại mật khẩu →
              </a>
            </div>
          )}
          <p className="form-footer">
            <a href="/login">Quay lại Đăng nhập</a>
          </p>
        </>
      ) : (
        <>
          <form onSubmit={handleSubmit} noValidate>
            <FormField
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary-button" disabled={submitting} type="submit">
              {submitting ? 'Đang gửi…' : 'Gửi hướng dẫn đặt lại'}
            </button>
          </form>
          <p className="form-footer">
            Đã nhớ mật khẩu? <a href="/login">Đăng nhập</a>
          </p>
        </>
      )}
    </AuthLayout>
  )
}
