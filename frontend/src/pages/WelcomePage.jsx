import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'
import { Brand } from './auth/AuthLayout.jsx'

export function WelcomePage() {
  const { user, signOut } = useAuth(); const navigate = useNavigate()
  async function handleSignOut() { await signOut(); navigate('/login', { replace: true }) }
  return <main className="welcome-page"><Brand /><section className="welcome-card"><p className="eyebrow">SIGNED IN</p><h1>Welcome, {user.username}.</h1><p>Your NovelHUB account is ready. Reader features will appear here as the next Sprint tasks are integrated.</p><div className="role-list">{user.roles?.map((role) => <span key={role}>{role}</span>)}</div><button className="secondary-button" onClick={handleSignOut} type="button">Sign out</button></section></main>
}
