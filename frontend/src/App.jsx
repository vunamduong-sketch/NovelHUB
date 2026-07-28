import { useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { useAuth } from './auth/useAuth.js'
import './App.css'

function Brand() {
  return <a className="brand" href="/"><span>n</span> NovelHUB</a>
}

function FormField({ label, ...props }) {
  return <label className="field"><span>{label}</span><input {...props} /></label>
}

function PasswordField({ label, ...props }) {
  const [visible, setVisible] = useState(false)
  return <label className="field"><span>{label}</span><span className="password-input"><input {...props} type={visible ? 'text' : 'password'} /><button type="button" onClick={() => setVisible((current) => !current)} aria-label={visible ? 'Hide password' : 'Show password'}>{visible ? 'Hide' : 'Show'}</button></span></label>
}

function LoginPage() {
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
      navigate('/welcome', { replace: true })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return <AuthLayout title="Welcome back" subtitle="Continue your reading journey.">
    <form onSubmit={handleSubmit} noValidate>
      <FormField label="Email or username" type="text" value={identity} onChange={(event) => setIdentity(event.target.value)} autoComplete="username" required />
      <PasswordField label="Password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary-button" disabled={submitting} type="submit">{submitting ? 'Signing in…' : 'Sign in'}</button>
    </form>
    <p className="form-footer">New to NovelHUB? <a href="/register">Create an account</a></p>
  </AuthLayout>
}

function RegisterPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', username: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const passwordChecks = [
    { label: 'At least 10 characters', valid: form.password.length >= 10 },
    { label: 'At least one letter', valid: /[A-Za-z]/.test(form.password) },
    { label: 'At least one number', valid: /\d/.test(form.password) },
    { label: 'Passwords match', valid: form.confirmPassword.length > 0 && form.password === form.confirmPassword },
  ]

  function firstValidationError() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return { field: 'email', message: 'Enter a valid email address.' }
    if (!/^[A-Za-z0-9]{3,50}$/.test(form.username)) return { field: 'username', message: 'Username must use 3–50 letters or numbers only.' }
    if (passwordChecks.slice(0, 3).some((check) => !check.valid)) return { field: 'password', message: 'Please meet all password requirements before continuing.' }
    if (!passwordChecks[3].valid) return { field: 'confirmPassword', message: 'Passwords do not match.' }
    return null
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    const validationError = firstValidationError()
    if (validationError) {
      setError(validationError.message)
      document.querySelector(`[name="${validationError.field}"]`)?.focus()
      return
    }
    setSubmitting(true)
    try {
      await signUp(form)
      navigate('/welcome', { replace: true })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return <AuthLayout title="Create your account" subtitle="Write, discover, and keep every chapter close.">
    <form onSubmit={handleSubmit} noValidate>
      <FormField label="Email" name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" required />
      <FormField label="Username" name="username" type="text" value={form.username} onChange={updateField} autoComplete="username" minLength="3" maxLength="50" required />
      <p className="field-hint">Use 3–50 letters or numbers only.</p>
      <PasswordField label="Password" name="password" value={form.password} onChange={updateField} autoComplete="new-password" minLength="10" required />
      <ul className="password-checklist">{passwordChecks.slice(0, 3).map((check) => <li className={check.valid ? 'is-valid' : ''} key={check.label}>{check.valid ? '✓' : '○'} {check.label}</li>)}</ul>
      <PasswordField label="Confirm password" name="confirmPassword" value={form.confirmPassword} onChange={updateField} autoComplete="new-password" minLength="10" required />
      <p className={`password-match ${passwordChecks[3].valid ? 'is-valid' : ''}`}>{passwordChecks[3].valid ? '✓ Passwords match' : '○ Passwords must match'}</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary-button" disabled={submitting} type="submit">{submitting ? 'Creating account…' : 'Create account'}</button>
    </form>
    <p className="form-footer">Already have an account? <a href="/login">Sign in</a></p>
  </AuthLayout>
}

function WelcomePage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  if (!user) return <Navigate to="/login" replace />
  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }
  return <main className="welcome-page"><Brand /><section className="welcome-card">
    <p className="eyebrow">SIGNED IN</p><h1>Welcome, {user.username}.</h1>
    <p>Your NovelHUB account is ready. Reader features will appear here as the next Sprint tasks are integrated.</p>
    <div className="role-list">{user.roles?.map((role) => <span key={role}>{role}</span>)}</div>
    <button className="secondary-button" onClick={handleSignOut} type="button">Sign out</button>
  </section></main>
}

function AuthLayout({ title, subtitle, children }) {
  return <main className="auth-page"><div className="auth-copy"><Brand /><div><p className="eyebrow">A HOME FOR EVERY STORY</p><h1>Read deeply.<br />Write freely.</h1><p>NovelHUB brings readers and authors together around the stories that matter.</p></div><small>© 2026 NovelHUB</small></div><section className="auth-panel"><div className="auth-card"><h2>{title}</h2><p className="subtitle">{subtitle}</p>{children}</div></section></main>
}

export default function App() {
  return <Routes><Route path="/login" element={<LoginPage />} /><Route path="/register" element={<RegisterPage />} /><Route path="/welcome" element={<WelcomePage />} /><Route path="*" element={<Navigate to="/login" replace />} /></Routes>
}
