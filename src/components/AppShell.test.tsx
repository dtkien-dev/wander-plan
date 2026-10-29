import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppShell } from './AppShell'
import { version } from '../../package.json'
import type { ReactNode } from 'react'
import { NotificationProvider } from '../providers/NotificationProvider'

const wrapper = ({ children }: { children: ReactNode }) => <NotificationProvider accountKey="test">{children}</NotificationProvider>

const auth = vi.hoisted(() => ({ isDemo: false, session: null, signOut: vi.fn() }))
const access = vi.hoisted(() => ({ isSiteAdmin: false }))
vi.mock('../providers/AuthProvider', () => ({ useAuth: () => auth }))
vi.mock('../providers/WorkspaceProvider', () => ({ useWorkspaceContext: () => ({ identity: 'test', tripId: 'trip', ...access }) }))
vi.mock('./TripManager', () => ({ TripManager: () => null }))

afterEach(() => { cleanup(); access.isSiteAdmin = false })

describe('AppShell release version', () => {
  it('identifies server-authorized website admins separately from trip roles', () => {
    access.isSiteAdmin = true
    render(<MemoryRouter><AppShell /></MemoryRouter>, { wrapper })
    expect(screen.getByLabelText('Vai trò website')).toHaveTextContent('Admin website · Quản lý mọi chuyến')
  })
  it.each([false, true])('shows the actual release and preserves demo identification (demo=%s)', (isDemo) => {
    auth.isDemo = isDemo
    render(<MemoryRouter><AppShell /></MemoryRouter>, { wrapper })

    expect(screen.getByLabelText('Phiên bản website')).toHaveTextContent(`v${version}`)
    expect(Boolean(screen.queryByText('Bản xem thử'))).toBe(isDemo)
    expect(screen.queryByText('Lưu trực tuyến')).not.toBeInTheDocument()
    expect(screen.queryByText('Đã đồng bộ')).not.toBeInTheDocument()
  })
})
