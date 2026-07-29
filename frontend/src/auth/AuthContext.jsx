import { useEffect, useSyncExternalStore, useCallback } from 'react'
import { fetchUserProfile, loginAccount, logoutAccount, refreshSession, registerAccount } from './authApi.js'
import { AuthContext } from './authContext.js'
import { clearSession, getSession, saveSession, subscribeToSession } from './sessionStore.js'

export function AuthProvider({ children }) {
  const session = useSyncExternalStore(subscribeToSession, getSession, getSession)

  const refreshProfile = useCallback(async () => {
    if (!session?.access_token) return null
    try {
      const userProfile = await fetchUserProfile()
      const current = getSession()
      if (current) {
        saveSession({ ...current, user: userProfile })
      }
      return userProfile
    } catch {
      return null
    }
  }, [session?.access_token])

  // Automatically fetch latest profile (including avatar_url) on initial load or token change
  useEffect(() => {
    if (session?.access_token) {
      refreshProfile()
    }
  }, [session?.access_token, refreshProfile])

  async function signIn(identity, password) {
    const sessionData = await loginAccount(identity, password)
    saveSession(sessionData)
    // Fetch latest complete profile right after login
    try {
      const userProfile = await fetchUserProfile()
      saveSession({ ...sessionData, user: userProfile })
    } catch {
      /* fallback to login response user data */
    }
  }

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

  return (
    <AuthContext.Provider value={{ 
      user: session?.user ?? null, 
      accessToken: session?.access_token ?? null, 
      signIn, 
      signOut, 
      signUp, 
      renewSession,
      refreshProfile 
    }}>
      {children}
    </AuthContext.Provider>
  )
}
