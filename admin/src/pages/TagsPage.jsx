import { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
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
  createAdminTag,
  deleteAdminTag,
  fetchAdminTags,
  updateAdminTag,
} from '../api/tagsApi.js'
import { ConfirmDialog } from '../components/ConfirmDialog.jsx'
import { PageHeader } from '../components/PageHeader.jsx'
import { formatDate } from '../utils/format.js'

const emptyForm = { name: '', slug: '' }

export function TagsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const loadTags = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setItems(await fetchAdminTags())
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Loading remote data is the synchronization performed by this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTags()
  }, [loadTags])

  function openCreate() {
    setEditing({ mode: 'create' })
    setForm(emptyForm)
  }

  function openEdit(tag) {
    setEditing({ mode: 'edit', id: tag.id })
    setForm({ name: tag.name, slug: tag.slug })
  }

  async function handleSave(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    const payload = { name: form.name.trim(), slug: form.slug.trim() || undefined }
    try {
      if (editing.mode === 'create') await createAdminTag(payload)
      else await updateAdminTag(editing.id, payload)
      setEditing(null)
      await loadTags()
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
      await deleteAdminTag(deleting.id)
      setDeleting(null)
      await loadTags()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setDeleteBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="Nhãn" description="Tạo và quản lý các nhãn dùng để mô tả tiểu thuyết." actionLabel="Thêm nhãn" onAction={openCreate} />
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <Paper className="table-card" elevation={0}>
        <TableContainer>
          <Table>
            <TableHead><TableRow><TableCell>Tên nhãn</TableCell><TableCell>Slug</TableCell><TableCell>Ngày tạo</TableCell><TableCell align="right">Thao tác</TableCell></TableRow></TableHead>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={4} align="center" sx={{ py: 7 }}><CircularProgress /></TableCell></TableRow>}
              {!loading && !items.length && <TableRow><TableCell colSpan={4} align="center" sx={{ py: 7 }}>Chưa có nhãn.</TableCell></TableRow>}
              {!loading && items.map((tag) => (
                <TableRow key={tag.id} hover>
                  <TableCell><Typography fontWeight={700}>{tag.name}</Typography></TableCell>
                  <TableCell><code>{tag.slug}</code></TableCell>
                  <TableCell>{formatDate(tag.created_at)}</TableCell>
                  <TableCell align="right"><Button size="small" onClick={() => openEdit(tag)}>Sửa</Button><Button size="small" color="error" onClick={() => setDeleting(tag)}>Xóa</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={Boolean(editing)} onClose={saving ? undefined : () => setEditing(null)} maxWidth="sm" fullWidth PaperProps={{ component: 'form', onSubmit: handleSave }}>
        <DialogTitle>{editing?.mode === 'create' ? 'Thêm nhãn' : 'Chỉnh sửa nhãn'}</DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.2 }}>
          <TextField label="Tên nhãn" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required fullWidth />
          <TextField label="Slug" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} helperText="Để trống khi tạo để hệ thống tự sinh từ tên." fullWidth />
        </DialogContent>
        <DialogActions><Button onClick={() => setEditing(null)} disabled={saving}>Hủy</Button><Button type="submit" variant="contained" disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu'}</Button></DialogActions>
      </Dialog>

      <ConfirmDialog open={Boolean(deleting)} title="Xóa nhãn?" message={`Nhãn “${deleting?.name || ''}” và các liên kết với tiểu thuyết sẽ bị xóa.`} busy={deleteBusy} onCancel={() => setDeleting(null)} onConfirm={handleDelete} />
    </>
  )
}
