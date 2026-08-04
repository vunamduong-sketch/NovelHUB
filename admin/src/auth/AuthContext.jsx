import { useMemo, useSyncExternalStore } from 'react'
import { loginAdmin, logoutAdmin } from '../api/authApi.js'
import { AuthContext } from './authContext.js'
import {
  clearSession,
  getSession,
  saveSession,
  subscribeToSession,
} from './sessionStore.js'

export function AuthProvider({ children }) {
  const session = useSyncExternalStore(subscribeToSession, getSession, getSession)

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      isAdmin: Boolean(session?.user?.roles?.includes('admin')),
      async signIn(identity, password) {
        const nextSession = await loginAdmin(identity, password)
        saveSession(nextSession)
      },
      async signOut() {
        await logoutAdmin(getSession()?.refresh_token)
        clearSession()
      },
    }),
    [session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
