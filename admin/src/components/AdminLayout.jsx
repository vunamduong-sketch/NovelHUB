import { useState } from 'react'
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../auth/useAdminAuth.js'

const drawerWidth = 248
const navigation = [
  { path: '/users', label: 'Người dùng', icon: 'U' },
  { path: '/novels', label: 'Tiểu thuyết', icon: 'N' },
  { path: '/categories', label: 'Thể loại', icon: 'C' },
  { path: '/tags', label: 'Nhãn', icon: 'T' },
]

function NavigationContent({ onNavigate }) {
  return (
    <>
      <Toolbar className="admin-brand">
        <Box className="brand-mark">N</Box>
        <Box>
          <Typography fontWeight={800} color="primary.main">NovelHUB</Typography>
          <Typography variant="caption" color="text.secondary">Administration</Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1.5, py: 2 }}>
        {navigation.map((item) => (
          <ListItemButton
            key={item.path}
            component={NavLink}
            to={item.path}
            onClick={onNavigate}
            className="admin-nav-item"
          >
            <ListItemIcon sx={{ minWidth: 42 }}>
              <Box className="nav-icon">{item.icon}</Box>
            </ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </>
  )
}

export function AdminLayout() {
  const theme = useTheme()
  const desktop = useMediaQuery(theme.breakpoints.up('md'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, signOut } = useAdminAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{ ml: { md: `${drawerWidth}px` }, width: { md: `calc(100% - ${drawerWidth}px)` } }}
      >
        <Toolbar sx={{ borderBottom: 1, borderColor: 'divider', gap: 1.5 }}>
          {!desktop && (
            <IconButton onClick={() => setMobileOpen(true)} aria-label="Mở menu">☰</IconButton>
          )}
          <Box sx={{ flexGrow: 1 }} />
          <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main' }}>
            {(user?.username?.[0] || 'A').toUpperCase()}
          </Avatar>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            <Typography variant="body2" fontWeight={700}>{user?.username}</Typography>
            <Typography variant="caption" color="text.secondary">Quản trị viên</Typography>
          </Box>
          <Button color="inherit" onClick={handleLogout}>Đăng xuất</Button>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={desktop ? 'permanent' : 'temporary'}
        open={desktop || mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <NavigationContent onNavigate={() => setMobileOpen(false)} />
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, bgcolor: 'background.default' }}>
        <Toolbar />
        <Box className="admin-page"><Outlet /></Box>
      </Box>
    </Box>
  )
}
