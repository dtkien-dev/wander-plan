import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppShell } from './AppShell'

const auth = vi.hoisted(() => ({ isDemo: false, session: null, signOut: vi.fn() }))
vi.mock('../providers/AuthProvider', () => ({ useAuth: () => auth }))
vi.mock('../providers/WorkspaceProvider', () => ({ useWorkspaceContext: () => ({ identity: 'test', tripId: 'trip' }) }))
vi.mock('./TripManager', () => ({ TripManager: () => null }))

afterEach(cleanup)

describe('AppShell storage mode', () => {
  it.each([false, true])('describes storage without claiming a successful sync (demo=%s)', (isDemo) => {
    auth.isDemo = isDemo
    render(<MemoryRouter><AppShell /></MemoryRouter>)

    const badge = screen.getByText(isDemo ? 'Bản xem thử' : 'Lưu trực tuyến')
    expect(badge).toHaveAttribute('title', isDemo
      ? 'Dữ liệu chỉ được lưu trên trình duyệt này, không chia sẻ với người khác.'
      : 'Dữ liệu chuyến đi được lưu trực tuyến và chia sẻ với nhóm.')
    expect(screen.queryByText('Đã đồng bộ')).not.toBeInTheDocument()
  })
})
