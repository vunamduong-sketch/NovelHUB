import { useContext } from 'react'
import { AuthContext } from './authContext.js'

export function useAdminAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAdminAuth must be used inside AuthProvider')
  return value
}
