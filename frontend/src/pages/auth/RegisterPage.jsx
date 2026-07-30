import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FormField } from '../../components/auth/FormField.jsx'
import { PasswordChecklist } from '../../components/auth/PasswordChecklist.jsx'
import { PasswordField } from '../../components/auth/PasswordField.jsx'
import { useAuth } from '../../auth/useAuth.js'
import { passwordChecks, validateRegistration } from '../../utils/validation.js'
import { AuthLayout } from './AuthLayout.jsx'

export function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', username: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const checks = passwordChecks(form.password, form.confirmPassword)

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    const validationError = validateRegistration(form)
    if (validationError) {
      setError(validationError.message)
      document.querySelector(`[name="${validationError.field}"]`)?.focus()
      return
    }
    setSubmitting(true)
    try {
      await signUp(form)
      navigate('/', { replace: true })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="Tạo tài khoản mới" subtitle="Viết, khám phá và gắn kết cùng từng chương truyện.">
      <form onSubmit={handleSubmit} noValidate>
        <FormField
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={updateField}
          autoComplete="email"
          required
        />
        <FormField
          label="Tên người dùng"
          name="username"
          type="text"
          value={form.username}
          onChange={updateField}
          autoComplete="username"
          minLength="3"
          maxLength="50"
          required
        />
        <p className="field-hint">Chỉ sử dụng 3–50 ký tự chữ hoặc số.</p>

        <PasswordField
          label="Mật khẩu"
          name="password"
          value={form.password}
          onChange={updateField}
          autoComplete="new-password"
          minLength="10"
          required
        />
        <PasswordChecklist checks={checks} />

        <PasswordField
          label="Xác nhận mật khẩu"
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
        <button className="primary-button" disabled={submitting} type="submit">
          {submitting ? 'Đang tạo tài khoản…' : 'Tạo tài khoản'}
        </button>
      </form>
      <p className="form-footer">
        Bạn đã có tài khoản? <a href="/login">Đăng nhập</a>
      </p>
    </AuthLayout>
  )
}
