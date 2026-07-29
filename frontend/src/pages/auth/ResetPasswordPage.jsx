import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PasswordChecklist } from '../../components/auth/PasswordChecklist.jsx'
import { PasswordField } from '../../components/auth/PasswordField.jsx'
import { FormField } from '../../components/auth/FormField.jsx'
import { confirmPasswordReset } from '../../auth/authApi.js'
import { passwordChecks } from '../../utils/validation.js'
import { AuthLayout } from './AuthLayout.jsx'

export function ResetPasswordPage() {
  const navigate = useNavigate(); const [searchParams] = useSearchParams(); const [form, setForm] = useState({ token: searchParams.get('token') ?? '', password: '', confirmPassword: '' }); const [error, setError] = useState(''); const [success, setSuccess] = useState(''); const [submitting, setSubmitting] = useState(false); const checks = passwordChecks(form.password, form.confirmPassword)
  function updateField(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })) }
  async function handleSubmit(event) { event.preventDefault(); setError(''); if (!form.token) { setError('Enter the reset token from your reset link.'); return } if (checks.some((check) => !check.valid)) { setError('Please meet all password requirements before continuing.'); return } setSubmitting(true); try { const result = await confirmPasswordReset(form.token, form.password); setSuccess(result.message); window.setTimeout(() => navigate('/login'), 1500) } catch (requestError) { setError(requestError.message) } finally { setSubmitting(false) } }
  return <AuthLayout title="Choose a new password" subtitle="Use a password you have not used elsewhere."><form onSubmit={handleSubmit} noValidate><FormField label="Reset token" name="token" type="text" value={form.token} onChange={updateField} autoComplete="off" required /><PasswordField label="New password" name="password" value={form.password} onChange={updateField} autoComplete="new-password" minLength="10" required /><PasswordChecklist checks={checks} /><PasswordField label="Confirm new password" name="confirmPassword" value={form.confirmPassword} onChange={updateField} autoComplete="new-password" minLength="10" required /><p className={`password-match ${checks[3].valid ? 'is-valid' : ''}`}>{checks[3].valid ? '✓ Passwords match' : '○ Passwords must match'}</p>{error && <p className="form-error" role="alert">{error}</p>}{success && <p className="form-success" role="status">{success} Redirecting to sign in…</p>}<button className="primary-button" disabled={submitting || Boolean(success)} type="submit">{submitting ? 'Updating…' : 'Update password'}</button></form><p className="form-footer"><a href="/login">Back to sign in</a></p></AuthLayout>
}
