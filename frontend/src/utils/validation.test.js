import { describe, expect, it } from 'vitest'
import { passwordChecks, validateRegistration } from './validation.js'

describe('registration validation', () => {
  it('checks email, username, then password in order', () => {
    expect(validateRegistration({ email: 'invalid', username: 'user_name', password: 'short', confirmPassword: '' }).field).toBe('email')
    expect(validateRegistration({ email: 'reader@example.com', username: 'user_name', password: 'short', confirmPassword: '' }).field).toBe('username')
    expect(validateRegistration({ email: 'reader@example.com', username: 'reader01', password: 'short', confirmPassword: '' }).field).toBe('password')
  })

  it('accepts a password with ten characters, a letter and a number', () => {
    expect(passwordChecks('novelhub10', 'novelhub10').every((check) => check.valid)).toBe(true)
  })
})
