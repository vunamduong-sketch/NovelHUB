import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './auth/ProtectedRoute.jsx'
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage.jsx'
import { LoginPage } from './pages/auth/LoginPage.jsx'
import { RegisterPage } from './pages/auth/RegisterPage.jsx'
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage.jsx'
import { WelcomePage } from './pages/WelcomePage.jsx'
import './App.css'

export default function App() {
  return <Routes><Route path="/login" element={<LoginPage />} /><Route path="/register" element={<RegisterPage />} /><Route path="/forgot-password" element={<ForgotPasswordPage />} /><Route path="/reset-password" element={<ResetPasswordPage />} /><Route path="/welcome" element={<ProtectedRoute><WelcomePage /></ProtectedRoute>} /><Route path="*" element={<Navigate to="/login" replace />} /></Routes>
}
