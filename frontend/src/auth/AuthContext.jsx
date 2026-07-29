import { useSyncExternalStore } from 'react'
import { loginAccount, logoutAccount, refreshSession, registerAccount } from './authApi.js'
import { AuthContext } from './authContext.js'
import { clearSession, getSession, saveSession, subscribeToSession } from './sessionStore.js'

export function AuthProvider({ children }) {
  const session = useSyncExternalStore(subscribeToSession, getSession, getSession)

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
    clearSession()
  }

  return <AuthContext.Provider value={{ user: session?.user ?? null, accessToken: session?.access_token ?? null, signIn, signOut, signUp, renewSession }}>{children}</AuthContext.Provider>
}
