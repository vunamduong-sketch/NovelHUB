export function passwordChecks(password, confirmPassword = '') {
  return [
    { label: 'At least 10 characters', valid: password.length >= 10 },
    { label: 'At least one letter', valid: /[A-Za-z]/.test(password) },
    { label: 'At least one number', valid: /\d/.test(password) },
    { label: 'Passwords match', valid: confirmPassword.length > 0 && password === confirmPassword },
  ]
}

export function validateRegistration({ email, username, password, confirmPassword }) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { field: 'email', message: 'Enter a valid email address.' }
  if (!/^[A-Za-z0-9]{3,50}$/.test(username)) return { field: 'username', message: 'Username must use 3–50 letters or numbers only.' }
  const checks = passwordChecks(password, confirmPassword)
  if (checks.slice(0, 3).some((check) => !check.valid)) return { field: 'password', message: 'Please meet all password requirements before continuing.' }
  if (!checks[3].valid) return { field: 'confirmPassword', message: 'Passwords do not match.' }
  return null
}
