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
  MenuItem,
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
import { fetchAdminNovel, fetchAdminNovels } from '../api/novelsApi.js'
import { PageHeader } from '../components/PageHeader.jsx'
import { formatDate, formatNumber, moderationLabels, novelStatusLabels } from '../utils/format.js'

export function NovelsPage() {
  const [data, setData] = useState({ items: [], total: 0 })
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [searchInput, setSearchInput] = useState('')
  const [filters, setFilters] = useState({ search: '', status: '', visibility: '', moderation_status: '' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [detail, setDetail] = useState(null)

  const loadNovels = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = { page: page + 1, page_size: rowsPerPage }
      Object.entries(filters).forEach(([key, value]) => { if (value) params[key] = value })
      setData(await fetchAdminNovels(params))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [filters, page, rowsPerPage])

  useEffect(() => {
    // Loading remote data is the synchronization performed by this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadNovels()
  }, [loadNovels])

  async function openDetail(id) {
    setError('')
    try {
      setDetail(await fetchAdminNovel(id))
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  function updateFilter(name, value) {
    setPage(0)
    setFilters((current) => ({ ...current, [name]: value }))
  }

  return (
    <>
      <PageHeader title="Tiểu thuyết" description="Tìm kiếm và xem thông tin mọi tác phẩm, kể cả bản private." />
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <Paper className="table-card" elevation={0}>
        <Box component="form" className="filter-bar" onSubmit={(event) => { event.preventDefault(); updateFilter('search', searchInput.trim()) }}>
          <TextField size="small" label="Tìm tiêu đề hoặc mô tả" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} sx={{ minWidth: 260 }} />
          <TextField select size="small" label="Trạng thái" value={filters.status} onChange={(event) => updateFilter('status', event.target.value)} sx={{ minWidth: 145 }}>
            <MenuItem value="">Tất cả</MenuItem>{Object.entries(novelStatusLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Hiển thị" value={filters.visibility} onChange={(event) => updateFilter('visibility', event.target.value)} sx={{ minWidth: 130 }}>
            <MenuItem value="">Tất cả</MenuItem><MenuItem value="public">Public</MenuItem><MenuItem value="private">Private</MenuItem>
          </TextField>
          <TextField select size="small" label="Kiểm duyệt" value={filters.moderation_status} onChange={(event) => updateFilter('moderation_status', event.target.value)} sx={{ minWidth: 145 }}>
            <MenuItem value="">Tất cả</MenuItem>{Object.entries(moderationLabels).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
          </TextField>
          <Button type="submit" variant="contained">Tìm kiếm</Button>
        </Box>
        <TableContainer>
          <Table>
            <TableHead><TableRow><TableCell>Tác phẩm</TableCell><TableCell>Tác giả</TableCell><TableCell>Trạng thái</TableCell><TableCell>Kiểm duyệt</TableCell><TableCell>Lượt xem</TableCell><TableCell align="right">Thao tác</TableCell></TableRow></TableHead>
            <TableBody>
              {loading && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 7 }}><CircularProgress /></TableCell></TableRow>}
              {!loading && !data.items.length && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 7 }}>Không có tiểu thuyết phù hợp.</TableCell></TableRow>}
              {!loading && data.items.map((novel) => (
                <TableRow key={novel.id} hover>
                  <TableCell><Typography fontWeight={700}>{novel.title}</Typography><Typography variant="body2" color="text.secondary">{novel.category_name || 'Chưa phân loại'} · {novel.visibility}</Typography></TableCell>
                  <TableCell>{novel.author_name || '—'}</TableCell>
                  <TableCell><Chip size="small" label={novelStatusLabels[novel.status] || novel.status} /></TableCell>
                  <TableCell><Chip size="small" variant="outlined" label={moderationLabels[novel.moderation_status] || novel.moderation_status} /></TableCell>
                  <TableCell>{formatNumber(novel.view_count)}</TableCell>
                  <TableCell align="right"><Button size="small" onClick={() => openDetail(novel.id)}>Chi tiết</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination component="div" count={data.total} page={page} rowsPerPage={rowsPerPage} rowsPerPageOptions={[10, 20, 50, 100]} onPageChange={(_, value) => setPage(value)} onRowsPerPageChange={(event) => { setRowsPerPage(Number(event.target.value)); setPage(0) }} labelRowsPerPage="Số dòng" />
      </Paper>

      <Dialog open={Boolean(detail)} onClose={() => setDetail(null)} maxWidth="md" fullWidth>
        <DialogTitle>{detail?.title}</DialogTitle>
        <DialogContent dividers>
          {detail && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '150px 1fr' }, gap: 1.5 }}>
              <Typography color="text.secondary">Tác giả</Typography><Typography>{detail.author_name || '—'}</Typography>
              <Typography color="text.secondary">Thể loại</Typography><Typography>{detail.category_name || 'Chưa phân loại'}</Typography>
              <Typography color="text.secondary">Slug</Typography><Typography>{detail.slug}</Typography>
              <Typography color="text.secondary">Ngôn ngữ</Typography><Typography>{detail.language_code}</Typography>
              <Typography color="text.secondary">Trạng thái</Typography><Typography>{novelStatusLabels[detail.status] || detail.status} · {detail.visibility} · {moderationLabels[detail.moderation_status] || detail.moderation_status}</Typography>
              <Typography color="text.secondary">Thống kê</Typography><Typography>{formatNumber(detail.view_count)} lượt xem · {formatNumber(detail.follower_count)} theo dõi · {detail.rating_average}/5</Typography>
              <Typography color="text.secondary">Cập nhật</Typography><Typography>{formatDate(detail.updated_at)}</Typography>
              <Typography color="text.secondary">Mô tả</Typography><Typography sx={{ whiteSpace: 'pre-wrap' }}>{detail.description || '—'}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setDetail(null)}>Đóng</Button></DialogActions>
      </Dialog>
    </>
  )
}
