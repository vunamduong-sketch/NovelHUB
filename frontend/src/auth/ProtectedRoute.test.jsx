import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthContext } from './authContext.js'
import { ProtectedRoute } from './ProtectedRoute.jsx'

describe('ProtectedRoute', () => {
  it('redirects an unauthenticated visitor to login', () => {
    render(<MemoryRouter initialEntries={['/welcome']}><AuthContext.Provider value={{ user: null }}><Routes><Route path="/welcome" element={<ProtectedRoute><p>Private content</p></ProtectedRoute>} /><Route path="/login" element={<p>Login required</p>} /></Routes></AuthContext.Provider></MemoryRouter>)
    expect(screen.getByText('Login required')).toBeInTheDocument()
  })
})
