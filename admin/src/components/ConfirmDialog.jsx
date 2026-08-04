import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material'

export function ConfirmDialog({ open, title, message, busy, onCancel, onConfirm }) {
  return (
    <Dialog open={open} onClose={busy ? undefined : onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={busy}>Hủy</Button>
        <Button color="error" variant="contained" onClick={onConfirm} disabled={busy}>
          {busy ? 'Đang xóa…' : 'Xóa'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
