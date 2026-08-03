import { Navigate, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../auth/useAdminAuth.js'

export function ProtectedAdminRoute({ children }) {
  const { isAdmin } = useAdminAuth()
  const location = useLocation()
  if (!isAdmin) return <Navigate to="/login" replace state={{ from: location }} />
  return children
}
