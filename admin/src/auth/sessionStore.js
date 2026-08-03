const STORAGE_KEY = 'novelhub.admin.session'
const listeners = new Set()

function readSession() {
  try {
    return JSON.parse(window.sessionStorage.getItem(STORAGE_KEY))
  } catch {
    return null
  }
}

let currentSession = typeof window === 'undefined' ? null : readSession()

function notify() {
  listeners.forEach((listener) => listener())
}

export function getSession() {
  return currentSession
}

export function subscribeToSession(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function saveSession(session) {
  currentSession = session
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  notify()
}

export function clearSession() {
  currentSession = null
  window.sessionStorage.removeItem(STORAGE_KEY)
  notify()
}
