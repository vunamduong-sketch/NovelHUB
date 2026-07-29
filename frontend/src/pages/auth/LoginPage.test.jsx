import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { AuthContext } from '../../auth/authContext.js'
import { LoginPage } from './LoginPage.jsx'

function renderLogin(signIn) {
  return render(<MemoryRouter initialEntries={['/login']}><AuthContext.Provider value={{ signIn }}><Routes><Route path="/login" element={<LoginPage />} /><Route path="/welcome" element={<p>Welcome route</p>} /></Routes></AuthContext.Provider></MemoryRouter>)
}

describe('LoginPage', () => {
  it('shows a generic error when sign in fails', async () => {
    const signIn = vi.fn().mockRejectedValue(new Error('Incorrect email/username or password.'))
    renderLogin(signIn)
    fireEvent.change(screen.getByLabelText('Email or username'), { target: { value: 'reader01' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong-password' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect email/username or password.')
  })

  it('navigates after successful sign in', async () => {
    renderLogin(vi.fn().mockResolvedValue(undefined))
    fireEvent.change(screen.getByLabelText('Email or username'), { target: { value: 'reader01' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'novelhub10' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByText('Welcome route')).toBeInTheDocument()
  })
})
