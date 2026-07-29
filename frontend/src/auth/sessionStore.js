const STORAGE_KEY = 'novelhub.auth.session'
const listeners = new Set()

function readStoredSession() {
  if (typeof window === 'undefined') return null
  try { return JSON.parse(window.sessionStorage.getItem(STORAGE_KEY)) } catch { return null }
}

let currentSession = readStoredSession()

function notify() { listeners.forEach((listener) => listener()) }

export function getSession() { return currentSession }
export function subscribeToSession(listener) { listeners.add(listener); return () => listeners.delete(listener) }
export function saveSession(nextSession) {
  currentSession = nextSession
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession))
  notify()
}
export function clearSession() {
  currentSession = null
  window.sessionStorage.removeItem(STORAGE_KEY)
  notify()
}
