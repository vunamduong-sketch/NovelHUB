export function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatNumber(value) {
  return new Intl.NumberFormat('vi-VN').format(value ?? 0)
}

export const novelStatusLabels = {
  draft: 'Bản nháp',
  ongoing: 'Đang viết',
  hiatus: 'Tạm dừng',
  completed: 'Hoàn thành',
}

export const moderationLabels = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  hidden: 'Đã ẩn',
}
