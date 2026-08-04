import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import {
  createAdminCategory,
  deleteAdminCategory,
  fetchAdminCategories,
  updateAdminCategory,
} from '../api/categoriesApi.js'
import { ConfirmDialog } from '../components/ConfirmDialog.jsx'
import { PageHeader } from '../components/PageHeader.jsx'
import { formatDate } from '../utils/format.js'

const emptyForm = { name: '', slug: '', description: '', is_active: true }

export function CategoriesPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const loadCategories = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setItems(await fetchAdminCategories())
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Loading remote data is the synchronization performed by this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCategories()
  }, [loadCategories])

  function openCreate() {
    setEditing({ mode: 'create' })
    setForm(emptyForm)
  }

  function openEdit(category) {
    setEditing({ mode: 'edit', id: category.id })
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      is_active: category.is_active,
    })
  }

  async function handleSave(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      description: form.description.trim() || null,
      is_active: form.is_active,
    }
    try {
      if (editing.mode === 'create') await createAdminCategory(payload)
      else await updateAdminCategory(editing.id, payload)
      setEditing(null)
      await loadCategories()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleteBusy(true)
    setError('')
    try {
      await deleteAdminCategory(deleting.id)
      setDeleting(null)
      await loadCategories()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="Thể loại" description="Thêm, chỉnh sửa, kích hoạt hoặc xóa thể loại truyện." actionLabel="Thêm thể loại" onAction={openCreate} />
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <Paper className="table-card" elevation={0}>
        <TableContainer>
          <Table>
            <TableHead><TableRow><TableCell>Tên thể loại</TableCell><TableCell>Slug</TableCell><TableCell>Trạng thái</TableCell><TableCell>Cập nhật</TableCell><TableCell align="right">Thao tác</TableCell></TableRow></TableHead>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={5} align="center" sx={{ py: 7 }}><CircularProgress /></TableCell></TableRow>}
              {!loading && !items.length && <TableRow><TableCell colSpan={5} align="center" sx={{ py: 7 }}>Chưa có thể loại.</TableCell></TableRow>}
              {!loading && items.map((category) => (
                <TableRow key={category.id} hover>
                  <TableCell><Typography fontWeight={700}>{category.name}</Typography><Typography variant="body2" color="text.secondary">{category.description || 'Không có mô tả'}</Typography></TableCell>
                  <TableCell><code>{category.slug}</code></TableCell>
                  <TableCell><Chip size="small" color={category.is_active ? 'success' : 'default'} label={category.is_active ? 'Đang hoạt động' : 'Đã tắt'} /></TableCell>
                  <TableCell>{formatDate(category.updated_at)}</TableCell>
                  <TableCell align="right"><Button size="small" onClick={() => openEdit(category)}>Sửa</Button><Button size="small" color="error" onClick={() => setDeleting(category)}>Xóa</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={Boolean(editing)} onClose={saving ? undefined : () => setEditing(null)} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={handleSave}>
          <DialogTitle>{editing?.mode === 'create' ? 'Thêm thể loại' : 'Chỉnh sửa thể loại'}</DialogTitle>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.2 }}>
            <TextField label="Tên thể loại" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required fullWidth />
            <TextField label="Slug" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} helperText="Để trống khi tạo để hệ thống tự sinh từ tên." fullWidth />
            <TextField label="Mô tả" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} multiline minRows={3} fullWidth />
            <FormControlLabel control={<Switch checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} />} label="Đang hoạt động" />
          </DialogContent>
          <DialogActions><Button onClick={() => setEditing(null)} disabled={saving}>Hủy</Button><Button type="submit" variant="contained" disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu'}</Button></DialogActions>
        </Box>
      </Dialog>

      <ConfirmDialog open={Boolean(deleting)} title="Xóa thể loại?" message={`Thể loại “${deleting?.name || ''}” sẽ bị xóa. Các truyện đang dùng thể loại này sẽ chuyển thành chưa phân loại.`} busy={deleteBusy} onCancel={() => setDeleting(null)} onConfirm={handleDelete} />
    </>
  )
}
