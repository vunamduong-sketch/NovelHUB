import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PasswordField } from '../../components/auth/PasswordField.jsx'
import { useAuth } from '../../auth/useAuth.js'
import { AuthLayout } from './AuthLayout.jsx'

export function LoginPage() {
  const { signIn } = useAuth(); const navigate = useNavigate(); const [identity, setIdentity] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [submitting, setSubmitting] = useState(false)
  async function handleSubmit(event) { event.preventDefault(); setError(''); setSubmitting(true); try { await signIn(identity, password); navigate('/welcome', { replace: true }) } catch (requestError) { setError(requestError.message) } finally { setSubmitting(false) } }
  return <AuthLayout title="Welcome back" subtitle="Continue your reading journey."><form onSubmit={handleSubmit} noValidate><label className="field"><span>Email or username</span><input type="text" value={identity} onChange={(event) => setIdentity(event.target.value)} autoComplete="username" required /></label><PasswordField label="Password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />{error && <p className="form-error" role="alert">{error}</p>}<button className="primary-button" disabled={submitting} type="submit">{submitting ? 'Signing in…' : 'Sign in'}</button></form><p className="forgot-link"><a href="/forgot-password">Forgot password?</a></p><p className="form-footer">New to NovelHUB? <a href="/register">Create an account</a></p></AuthLayout>
}
