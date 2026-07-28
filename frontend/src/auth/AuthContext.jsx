import { useState } from 'react'
import { loginAccount, logoutAccount, refreshSession, registerAccount } from './authApi.js'
import { AuthContext } from './authContext.js'

const STORAGE_KEY = 'novelhub.auth.session'

function readSession() {
  try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY)) } catch { return null }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession)

  function saveSession(nextSession) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession))
    setSession(nextSession)
  }

  async function signIn(identity, password) { saveSession(await loginAccount(identity, password)) }
  async function signUp({ email, username, password }) {
    await registerAccount({ email, username, password })
    await signIn(email, password)
  }
  async function renewSession() {
    if (!session?.refresh_token) return null
    const nextSession = await refreshSession(session.refresh_token)
    saveSession(nextSession)
    return nextSession
  }
  async function signOut() {
    if (session?.refresh_token) await logoutAccount(session.refresh_token)
    sessionStorage.removeItem(STORAGE_KEY)
    setSession(null)
  }

  return <AuthContext.Provider value={{ user: session?.user ?? null, accessToken: session?.access_token ?? null, signIn, signOut, signUp, renewSession }}>{children}</AuthContext.Provider>
}
