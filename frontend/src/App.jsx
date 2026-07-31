import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './auth/ProtectedRoute.jsx'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage.jsx'
import { LoginPage } from './pages/auth/LoginPage.jsx'
import { RegisterPage } from './pages/auth/RegisterPage.jsx'
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage.jsx'
import { HomePage } from './pages/HomePage.jsx'
import { NovelDetail } from './pages/novel_management/NovelDetail.jsx'
import { ProfilePage } from './pages/user_management/ProfilePage.jsx'
import { AuthorCompositions } from './pages/novel_management/AuthorCompositions.jsx'
import './App.css'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/novels/:id" element={<NovelDetail />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
      <Route path="/author/compositions" element={<ProtectedRoute><AuthorCompositions /></ProtectedRoute>} />
      <Route path="/novel-management/author-compositions" element={<ProtectedRoute><AuthorCompositions /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
