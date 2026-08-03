import { lazy, Suspense } from 'react'
import { Box, CircularProgress } from '@mui/material'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from './components/AdminLayout.jsx'
import { ProtectedAdminRoute } from './components/ProtectedAdminRoute.jsx'
import { LoginPage } from './pages/LoginPage.jsx'

const CategoriesPage = lazy(() => import('./pages/CategoriesPage.jsx').then((module) => ({ default: module.CategoriesPage })))
const NovelsPage = lazy(() => import('./pages/NovelsPage.jsx').then((module) => ({ default: module.NovelsPage })))
const TagsPage = lazy(() => import('./pages/TagsPage.jsx').then((module) => ({ default: module.TagsPage })))
const UsersPage = lazy(() => import('./pages/UsersPage.jsx').then((module) => ({ default: module.UsersPage })))

function PageLoader({ children }) {
  return (
    <Suspense fallback={<Box sx={{ display: 'grid', placeItems: 'center', minHeight: 320 }}><CircularProgress /></Box>}>
      {children}
    </Suspense>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={(
          <ProtectedAdminRoute>
            <AdminLayout />
          </ProtectedAdminRoute>
        )}
      >
        <Route index element={<Navigate to="/users" replace />} />
        <Route path="/users" element={<PageLoader><UsersPage /></PageLoader>} />
        <Route path="/novels" element={<PageLoader><NovelsPage /></PageLoader>} />
        <Route path="/categories" element={<PageLoader><CategoriesPage /></PageLoader>} />
        <Route path="/tags" element={<PageLoader><TagsPage /></PageLoader>} />
      </Route>
      <Route path="*" element={<Navigate to="/users" replace />} />
    </Routes>
  )
}
