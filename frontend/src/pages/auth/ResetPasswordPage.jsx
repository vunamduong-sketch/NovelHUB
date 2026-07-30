import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PasswordChecklist } from '../../components/auth/PasswordChecklist.jsx'
import { PasswordField } from '../../components/auth/PasswordField.jsx'
import { FormField } from '../../components/auth/FormField.jsx'
import { confirmPasswordReset } from '../../auth/authApi.js'
import { passwordChecks } from '../../utils/validation.js'
import { AuthLayout } from './AuthLayout.jsx'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState({
    token: searchParams.get('token') ?? '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const checks = passwordChecks(form.password, form.confirmPassword)

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (!form.token) {
      setError('Vui lòng nhập mã Token từ liên kết đặt lại mật khẩu của bạn.')
      return
    }
    if (checks.some((check) => !check.valid)) {
      setError('Vui lòng đáp ứng tất cả yêu cầu mật khẩu trước khi tiếp tục.')
      return
    }
    setSubmitting(true)
    try {
      const result = await confirmPasswordReset(form.token, form.password)
      setSuccess(result.message || 'Mật khẩu đã được cập nhật thành công.')
      window.setTimeout(() => navigate('/login'), 1500)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Tạo mật khẩu mới"
      subtitle="Sử dụng mật khẩu bảo mật mà bạn chưa từng dùng ở nơi khác."
    >
      <form onSubmit={handleSubmit} noValidate>
        <FormField
          label="Mã Token đặt lại (Reset token)"
          name="token"
          type="text"
          value={form.token}
          onChange={updateField}
          autoComplete="off"
          required
        />
        <PasswordField
          label="Mật khẩu mới"
          name="password"
          value={form.password}
          onChange={updateField}
          autoComplete="new-password"
          minLength="10"
          required
        />
        <PasswordChecklist checks={checks} />

        <PasswordField
          label="Xác nhận mật khẩu mới"
          name="confirmPassword"
          value={form.confirmPassword}
          onChange={updateField}
          autoComplete="new-password"
          minLength="10"
          required
        />
        <p className={`password-match ${checks[3].valid ? 'is-valid' : ''}`}>
          {checks[3].valid ? '✓ Mật khẩu trùng khớp' : '○ Mật khẩu phải trùng khớp'}
        </p>

        {error && <p className="form-error" role="alert">{error}</p>}
        {success && (
          <p className="form-success" role="status">
            {success} Đang chuyển hướng đến trang đăng nhập…
          </p>
        )}

        <button className="primary-button" disabled={submitting || Boolean(success)} type="submit">
          {submitting ? 'Đang cập nhật…' : 'Cập nhật mật khẩu'}
        </button>
      </form>
      <p className="form-footer">
        <a href="/login">Quay lại Đăng nhập</a>
      </p>
    </AuthLayout>
  )
}
