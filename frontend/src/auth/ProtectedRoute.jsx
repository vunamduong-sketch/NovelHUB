import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth.js'

export function ProtectedRoute({ children }) {
  const { user } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}
