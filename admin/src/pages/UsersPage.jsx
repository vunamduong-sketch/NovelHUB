import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import {
  fetchAdminUser,
  fetchAdminUsers,
  updateAdminUserRoles,
} from '../api/usersApi.js'
import { PageHeader } from '../components/PageHeader.jsx'
import { formatDate } from '../utils/format.js'

const availableRoles = ['reader', 'author', 'admin']

export function UsersPage() {
  const [data, setData] = useState({ items: [], total: 0 })
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [detail, setDetail] = useState(null)
  const [editing, setEditing] = useState(null)
  const [roles, setRoles] = useState([])
  const [saving, setSaving] = useState(false)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await fetchAdminUsers({
        search: search || undefined,
        page: page + 1,
        page_size: rowsPerPage,
      }))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [page, rowsPerPage, search])

  useEffect(() => {
    // Loading remote data is the synchronization performed by this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers()
  }, [loadUsers])

  function handleSearch(event) {
    event.preventDefault()
    setPage(0)
    setSearch(searchInput.trim())
  }

  async function openDetail(userId) {
    setError('')
    try {
      setDetail(await fetchAdminUser(userId))
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  function openRoleEditor(user) {
    setEditing(user)
    setRoles(user.roles)
  }

  function toggleRole(role) {
    setRoles((current) => current.includes(role)
      ? current.filter((item) => item !== role)
      : [...current, role])
  }

  async function saveRoles() {
    if (!roles.length) return
    setSaving(true)
    setError('')
    try {
      await updateAdminUserRoles(editing.id, roles)
      setEditing(null)
      await loadUsers()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader title="Người dùng" description="Tìm kiếm, xem hồ sơ và quản lý vai trò người dùng." />
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <Paper className="table-card" elevation={0}>
        <Box component="form" className="filter-bar" onSubmit={handleSearch}>
          <TextField
            size="small"
            label="Tìm email, username, tên hiển thị"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            sx={{ minWidth: { xs: '100%', sm: 330 } }}
          />
          <Button type="submit" variant="contained">Tìm kiếm</Button>
          {search && <Button onClick={() => { setSearchInput(''); setSearch(''); setPage(0) }}>Xóa lọc</Button>}
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Người dùng</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Vai trò</TableCell>
                <TableCell>Ngày tạo</TableCell>
                <TableCell align="right">Thao tác</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 7 }}><CircularProgress /></TableCell></TableRow>
              )}
              {!loading && !data.items.length && (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 7 }}>Không có người dùng phù hợp.</TableCell></TableRow>
              )}
              {!loading && data.items.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Typography fontWeight={700}>{user.display_name || user.username}</Typography>
                    <Typography variant="body2" color="text.secondary">{user.email} · @{user.username}</Typography>
                  </TableCell>
                  <TableCell><Chip size="small" label={user.status} color={user.status === 'active' ? 'success' : 'default'} /></TableCell>
                  <TableCell><Box className="role-list">{user.roles.map((role) => <Chip key={role} size="small" variant="outlined" label={role} />)}</Box></TableCell>
                  <TableCell>{formatDate(user.created_at)}</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => openDetail(user.id)}>Chi tiết</Button>
                    <Button size="small" onClick={() => openRoleEditor(user)}>Đổi vai trò</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={data.total}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[10, 20, 50, 100]}
          onPageChange={(_, nextPage) => setPage(nextPage)}
          onRowsPerPageChange={(event) => { setRowsPerPage(Number(event.target.value)); setPage(0) }}
          labelRowsPerPage="Số dòng"
        />
      </Paper>

      <Dialog open={Boolean(detail)} onClose={() => setDetail(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Chi tiết người dùng</DialogTitle>
        <DialogContent dividers>
          {detail && (
            <Box sx={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 1.5 }}>
              <Typography color="text.secondary">ID</Typography><Typography sx={{ wordBreak: 'break-all' }}>{detail.id}</Typography>
              <Typography color="text.secondary">Email</Typography><Typography>{detail.email}</Typography>
              <Typography color="text.secondary">Username</Typography><Typography>@{detail.username}</Typography>
              <Typography color="text.secondary">Tên hiển thị</Typography><Typography>{detail.display_name || '—'}</Typography>
              <Typography color="text.secondary">Vai trò</Typography><Typography>{detail.roles.join(', ')}</Typography>
              <Typography color="text.secondary">Đăng nhập cuối</Typography><Typography>{formatDate(detail.last_login_at)}</Typography>
              <Typography color="text.secondary">Ngày tạo</Typography><Typography>{formatDate(detail.created_at)}</Typography>
              <Typography color="text.secondary">Tiểu sử</Typography><Typography>{detail.bio || '—'}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setDetail(null)}>Đóng</Button></DialogActions>
      </Dialog>

      <Dialog open={Boolean(editing)} onClose={saving ? undefined : () => setEditing(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Vai trò của @{editing?.username}</DialogTitle>
        <DialogContent dividers>
          {availableRoles.map((role) => (
            <FormControlLabel
              key={role}
              control={<Checkbox checked={roles.includes(role)} onChange={() => toggleRole(role)} />}
              label={role}
              sx={{ display: 'block' }}
            />
          ))}
          {!roles.length && <Alert severity="warning">Người dùng phải có ít nhất một vai trò.</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)} disabled={saving}>Hủy</Button>
          <Button variant="contained" onClick={saveRoles} disabled={saving || !roles.length}>{saving ? 'Đang lưu…' : 'Lưu'}</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
