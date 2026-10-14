import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GroupPage } from './GroupPage'
import type { TripPerson, WorkspaceData } from '../types'

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useWorkspace: vi.fn(),
  useTripPeople: vi.fn(),
  useWorkspaceMutations: vi.fn(),
}))

vi.mock('../providers/AuthProvider', () => ({ useAuth: mocks.useAuth }))
vi.mock('../hooks/useWorkspace', () => ({
  useWorkspace: mocks.useWorkspace,
  useTripPeople: mocks.useTripPeople,
  useWorkspaceMutations: mocks.useWorkspaceMutations,
}))

const trip = {
  id: 'trip-hue', name: 'Hành trình Huế', destination: 'Huế', startDate: '2027-02-10', endDate: '2027-02-12',
  timezone: 'Asia/Ho_Chi_Minh', budgetVnd: 2_000_000, maxMembers: 4, version: 1,
}

const people: TripPerson[] = [
  { userId: 'owner-id', email: 'owner@example.com', displayName: 'Chủ nhóm', role: 'owner', status: 'active', joinedAt: null },
  { userId: 'member-1', email: 'one@example.com', displayName: 'Thành viên một', role: 'editor', status: 'active', joinedAt: null },
  { userId: 'member-2', email: 'two@example.com', displayName: 'Thành viên hai', role: 'editor', status: 'active', joinedAt: null },
  { userId: null, email: 'invitee@example.com', displayName: 'invitee@example.com', role: 'editor', status: 'invited', joinedAt: null },
]

function workspace(role: WorkspaceData['currentRole']): WorkspaceData {
  return {
    trip, people, memberCount: 3, currentUserId: role === 'owner' ? 'owner-id' : 'member-1', currentRole: role,
    itinerary: [], expenses: [],
  }
}

function setup(role: WorkspaceData['currentRole'], revokeInvitation = vi.fn().mockResolvedValue(undefined)) {
  mocks.useAuth.mockReturnValue({ isDemo: true })
  mocks.useWorkspace.mockReturnValue({ data: workspace(role), isLoading: false, isError: false, refetch: vi.fn() })
  mocks.useTripPeople.mockReturnValue({ data: people, isLoading: false, isError: false, refetch: vi.fn() })
  mocks.useWorkspaceMutations.mockReturnValue({
    updateTrip: { mutateAsync: vi.fn(), isPending: false },
    inviteMember: { mutateAsync: vi.fn(), isPending: false },
    revokeInvitation: { mutateAsync: revokeInvitation, isPending: false },
    removeMember: { mutateAsync: vi.fn(), isPending: false },
  })
  return { revokeInvitation }
}

beforeEach(() => vi.clearAllMocks())
afterEach(cleanup)

describe('GroupPage invitations', () => {
  it('shows active and held-seat counts and disables another invite when all four seats are occupied', () => {
    setup('owner')
    render(<GroupPage />)

    expect(screen.getByText(/3\/4 người đã tham gia · 1 chỗ đang giữ cho lời mời/)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Nhóm đã dùng đủ 4 chỗ: 3 thành viên và 1 lời mời đang chờ.')
    expect(screen.getByRole('button', { name: /Thêm/ })).toBeDisabled()
    expect(screen.getByLabelText('Mời bằng email')).toBeDisabled()
  })

  it('confirms revoke for the selected invitation and keeps an actionable retry after failure', async () => {
    const revokeInvitation = vi.fn()
      .mockRejectedValueOnce(new Error('Không thể kết nối.'))
      .mockResolvedValueOnce(undefined)
    setup('owner', revokeInvitation)
    render(<GroupPage />)

    fireEvent.click(screen.getByRole('button', { name: 'Huỷ lời mời invitee@example.com' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('invitee@example.com')
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận huỷ' }))

    expect(await screen.findByText('Không thể kết nối.')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    const confirm = screen.getByRole('button', { name: 'Xác nhận huỷ' })
    expect(confirm).toBeEnabled()
    fireEvent.click(confirm)

    await waitFor(() => expect(revokeInvitation).toHaveBeenLastCalledWith({ tripId: 'trip-hue', email: 'invitee@example.com' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await screen.findByText('Đã huỷ lời mời và giải phóng chỗ.')).toBeInTheDocument()
  })

  it('does not render invitation revoke controls for an editor', () => {
    setup('editor')
    render(<GroupPage />)

    expect(screen.queryByRole('button', { name: /Huỷ lời mời/ })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Mời bằng email')).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
