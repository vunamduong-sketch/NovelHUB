import { useState } from 'react'
import { FormField } from '../../components/auth/FormField.jsx'
import { requestPasswordReset } from '../../auth/authApi.js'
import { AuthLayout } from './AuthLayout.jsx'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState(''); const [result, setResult] = useState(null); const [error, setError] = useState(''); const [submitting, setSubmitting] = useState(false)
  async function handleSubmit(event) { event.preventDefault(); setError(''); setSubmitting(true); try { setResult(await requestPasswordReset(email)) } catch (requestError) { setError(requestError.message) } finally { setSubmitting(false) } }
  return <AuthLayout title="Reset your password" subtitle="Enter your email and we will help you get back to reading.">{result ? <><p className="form-success" role="status">{result.message}</p>{result.debug_reset_token && <div className="development-token"><strong>Development token</strong><p>This token is only shown locally. It will never appear in production.</p><a href={`/reset-password?token=${encodeURIComponent(result.debug_reset_token)}`}>Continue to reset password →</a></div>}<p className="form-footer"><a href="/login">Back to sign in</a></p></> : <><form onSubmit={handleSubmit} noValidate><FormField label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />{error && <p className="form-error" role="alert">{error}</p>}<button className="primary-button" disabled={submitting} type="submit">{submitting ? 'Sending…' : 'Send reset instructions'}</button></form><p className="form-footer">Remembered it? <a href="/login">Sign in</a></p></>}</AuthLayout>
}
