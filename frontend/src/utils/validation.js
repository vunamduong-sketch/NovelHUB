export function passwordChecks(password, confirmPassword = '') {
  return [
    { label: 'Ít nhất 10 ký tự', valid: password.length >= 10 },
    { label: 'Chứa ít nhất một chữ cái', valid: /[A-Za-z]/.test(password) },
    { label: 'Chứa ít nhất một chữ số', valid: /\d/.test(password) },
    { label: 'Mật khẩu trùng khớp', valid: confirmPassword.length > 0 && password === confirmPassword },
  ]
}

export function validateRegistration({ email, username, password, confirmPassword }) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { field: 'email', message: 'Vui lòng nhập địa chỉ email hợp lệ.' }
  if (!/^[A-Za-z0-9]{3,50}$/.test(username)) return { field: 'username', message: 'Tên người dùng phải gồm 3–50 ký tự chữ hoặc số.' }
  const checks = passwordChecks(password, confirmPassword)
  if (checks.slice(0, 3).some((check) => !check.valid)) return { field: 'password', message: 'Vui lòng đáp ứng tất cả yêu cầu mật khẩu trước khi tiếp tục.' }
  if (!checks[3].valid) return { field: 'confirmPassword', message: 'Mật khẩu xác nhận không trùng khớp.' }
  return null
}
