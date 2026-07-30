import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { AuthContext } from '../../auth/authContext.js'
import { AuthorCompositions } from './AuthorCompositions.jsx'
import * as novelApi from '../../api/novelApi.js'

vi.mock('../../api/novelApi.js', () => ({
  fetchMyNovels: vi.fn(),
  createNovel: vi.fn(),
  updateNovel: vi.fn(),
  deleteNovel: vi.fn(),
  publishNovel: vi.fn(),
}))

const mockUser = {
  id: 'user-1',
  username: 'author_john',
  display_name: 'John Author',
  roles: ['author'],
}

const mockNovels = [
  {
    id: 'novel-1',
    author_id: 'user-1',
    title: 'Truyện Nháp Đầu Tiên',
    slug: 'truyen-nhap-dau-tien',
    description: 'Mô tả bản nháp',
    status: 'draft',
    visibility: 'private',
    published_at: null,
    view_count: 10,
    follower_count: 2,
    rating_count: 0,
    rating_average: 0,
  },
  {
    id: 'novel-2',
    author_id: 'user-1',
    title: 'Truyện Đã Xuất Bản',
    slug: 'truyen-da-xuat-ban',
    description: 'Mô tả truyện đã xuất bản',
    status: 'ongoing',
    visibility: 'public',
    published_at: '2026-07-01T10:00:00Z',
    view_count: 500,
    follower_count: 120,
    rating_count: 15,
    rating_average: 4.8,
  },
]

function renderComponent() {
  return render(
    <MemoryRouter initialEntries={['/author/compositions']}>
      <AuthContext.Provider value={{ user: mockUser, signOut: vi.fn() }}>
        <AuthorCompositions />
      </AuthContext.Provider>
    </MemoryRouter>
  )
}

describe('AuthorCompositions Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    novelApi.fetchMyNovels.mockResolvedValue(mockNovels)
  })

  it('renders hero title and fetches author novels list', async () => {
    renderComponent()

    expect(screen.getByText('Sáng Tác Của Tôi')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('Truyện Nháp Đầu Tiên')).toBeInTheDocument()
      expect(screen.getByText('Truyện Đã Xuất Bản')).toBeInTheDocument()
    })
  })

  it('filters novels when clicking tabs', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Truyện Nháp Đầu Tiên')).toBeInTheDocument()
    })

    // Click "Đã xuất bản" tab
    const publishedTab = screen.getByRole('button', { name: /Đã xuất bản/i })
    fireEvent.click(publishedTab)

    expect(screen.getByText('Truyện Đã Xuất Bản')).toBeInTheDocument()
    expect(screen.queryByText('Truyện Nháp Đầu Tiên')).not.toBeInTheDocument()

    // Click "Chưa xuất bản" tab
    const draftTab = screen.getByRole('button', { name: /Chưa xuất bản/i })
    fireEvent.click(draftTab)

    expect(screen.getByText('Truyện Nháp Đầu Tiên')).toBeInTheDocument()
    expect(screen.queryByText('Truyện Đã Xuất Bản')).not.toBeInTheDocument()
  })

  it('opens create novel modal when clicking Tạo Truyện Mới button', async () => {
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Sáng Tác Của Tôi')).toBeInTheDocument()
    })

    const createBtn = screen.getByRole('button', { name: /Tạo Truyện Mới/i })
    fireEvent.click(createBtn)

    expect(screen.getByRole('heading', { name: 'Tạo Truyện Mới' })).toBeInTheDocument()
    expect(screen.getByLabelText(/Tiêu đề truyện/i)).toBeInTheDocument()
  })
})
