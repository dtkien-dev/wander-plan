import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppShell } from './AppShell'
import { version } from '../../package.json'
import type { ReactNode } from 'react'
import { NotificationProvider } from '../providers/NotificationProvider'

const wrapper = ({ children }: { children: ReactNode }) => <NotificationProvider accountKey="test">{children}</NotificationProvider>

const auth = vi.hoisted(() => ({ isDemo: false, session: null, signOut: vi.fn() }))
const access = vi.hoisted(() => ({ isSiteAdmin: false, identity: 'test', tripId: 'trip', workspace: { data: { trip: { id: 'trip' }, currentRole: 'owner' } } }))
vi.mock('../providers/AuthProvider', () => ({ useAuth: () => auth }))
vi.mock('../providers/WorkspaceProvider', () => ({ useWorkspaceContext: () => access }))
vi.mock('./TripManager', () => ({ TripManager: () => null }))

afterEach(() => {
  cleanup()
  localStorage.clear()
  auth.isDemo = false
  access.isSiteAdmin = false
  access.identity = 'test'
  access.tripId = 'trip'
  access.workspace.data = { trip: { id: 'trip' }, currentRole: 'owner' }
})

it('offers the guide to editors and remembers closing it across reloads per trip and account', () => {
  access.workspace.data.currentRole = 'editor'
  const shell = <MemoryRouter><AppShell /></MemoryRouter>
  const first = render(shell, { wrapper })
  const guide = within(screen.getByRole('region', { name: 'Hướng dẫn nhanh' }))
  expect(guide.getByRole('heading', { name: 'Bắt đầu với chuyến đi' })).toBeVisible()
  expect(guide.getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual(['/itinerary', '/expenses', '/group'])
  fireEvent.click(guide.getByRole('button', { name: 'Đóng hướng dẫn' }))
  first.unmount()

  const view = render(shell, { wrapper })
  expect(screen.getByRole('button', { name: 'Hướng dẫn' })).toHaveAttribute('aria-expanded', 'false')
  access.tripId = 'other-trip'
  access.workspace.data.trip.id = 'other-trip'
  view.rerender(<MemoryRouter><AppShell /></MemoryRouter>)
  expect(screen.getByRole('heading', { name: 'Bắt đầu với chuyến đi' })).toBeVisible()

  access.tripId = 'trip'
  access.workspace.data.trip.id = 'trip'
  access.identity = 'friend'
  view.rerender(<MemoryRouter><AppShell /></MemoryRouter>)
  expect(screen.getByRole('heading', { name: 'Bắt đầu với chuyến đi' })).toBeVisible()

  access.identity = 'test'
  view.rerender(<MemoryRouter><AppShell /></MemoryRouter>)
  fireEvent.click(screen.getByRole('button', { name: 'Hướng dẫn' }))
  expect(screen.getByRole('heading', { name: 'Bắt đầu với chuyến đi' })).toBeVisible()
  view.unmount()
  render(shell, { wrapper })
  expect(screen.getByRole('heading', { name: 'Bắt đầu với chuyến đi' })).toBeVisible()
})

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
    expect(screen.queryByRole('region', { name: 'Hướng dẫn nhanh' })).not.toBeInTheDocument()
    expect(screen.queryByText('Lưu trực tuyến')).not.toBeInTheDocument()
    expect(screen.queryByText('Đã đồng bộ')).not.toBeInTheDocument()
  })
})
