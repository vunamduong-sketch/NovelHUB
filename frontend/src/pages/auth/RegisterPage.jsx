import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FormField } from '../../components/auth/FormField.jsx'
import { PasswordChecklist } from '../../components/auth/PasswordChecklist.jsx'
import { PasswordField } from '../../components/auth/PasswordField.jsx'
import { useAuth } from '../../auth/useAuth.js'
import { passwordChecks, validateRegistration } from '../../utils/validation.js'
import { AuthLayout } from './AuthLayout.jsx'

export function RegisterPage() {
  const { signUp } = useAuth(); const navigate = useNavigate(); const [form, setForm] = useState({ email: '', username: '', password: '', confirmPassword: '' }); const [error, setError] = useState(''); const [submitting, setSubmitting] = useState(false); const checks = passwordChecks(form.password, form.confirmPassword)
  function updateField(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })) }
  async function handleSubmit(event) { event.preventDefault(); setError(''); const validationError = validateRegistration(form); if (validationError) { setError(validationError.message); document.querySelector(`[name="${validationError.field}"]`)?.focus(); return } setSubmitting(true); try { await signUp(form); navigate('/welcome', { replace: true }) } catch (requestError) { setError(requestError.message) } finally { setSubmitting(false) } }
  return <AuthLayout title="Create your account" subtitle="Write, discover, and keep every chapter close."><form onSubmit={handleSubmit} noValidate><FormField label="Email" name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" required /><FormField label="Username" name="username" type="text" value={form.username} onChange={updateField} autoComplete="username" minLength="3" maxLength="50" required /><p className="field-hint">Use 3–50 letters or numbers only.</p><PasswordField label="Password" name="password" value={form.password} onChange={updateField} autoComplete="new-password" minLength="10" required /><PasswordChecklist checks={checks} /><PasswordField label="Confirm password" name="confirmPassword" value={form.confirmPassword} onChange={updateField} autoComplete="new-password" minLength="10" required /><p className={`password-match ${checks[3].valid ? 'is-valid' : ''}`}>{checks[3].valid ? '✓ Passwords match' : '○ Passwords must match'}</p>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary-button" disabled={submitting} type="submit">{submitting ? 'Creating account…' : 'Create account'}</button></form><p className="form-footer">Already have an account? <a href="/login">Sign in</a></p></AuthLayout>
}
