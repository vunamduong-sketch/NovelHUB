import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  TextField,
  Typography,
} from '@mui/material'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../auth/useAdminAuth.js'

export function LoginPage() {
  const [identity, setIdentity] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { isAdmin, signIn } = useAdminAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (isAdmin) return <Navigate to="/users" replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await signIn(identity.trim(), password)
      navigate(location.state?.from?.pathname || '/users', { replace: true })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box className="login-shell">
      <Box className="login-intro">
        <Box className="login-brand"><span>N</span> NovelHUB</Box>
        <Typography variant="h2" component="h1" fontWeight={800}>
          Quản trị nội dung<br />trong một nơi.
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.78, maxWidth: 520 }}>
          Theo dõi người dùng, tiểu thuyết, thể loại và nhãn của hệ thống NovelHUB.
        </Typography>
      </Box>
      <Paper component="form" onSubmit={handleSubmit} className="login-card" elevation={8}>
        <Typography variant="h4" fontWeight={750}>Đăng nhập quản trị</Typography>
        <Typography color="text.secondary" mb={3}>Sử dụng tài khoản có vai trò admin.</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField
          label="Email hoặc tên người dùng"
          value={identity}
          onChange={(event) => setIdentity(event.target.value)}
          autoComplete="username"
          required
          fullWidth
        />
        <TextField
          label="Mật khẩu"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
          fullWidth
        />
        <Button type="submit" size="large" variant="contained" disabled={submitting} fullWidth>
          {submitting ? <CircularProgress size={24} color="inherit" /> : 'Đăng nhập'}
        </Button>
      </Paper>
    </Box>
  )
}
