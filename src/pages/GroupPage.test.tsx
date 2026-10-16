import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GroupPage } from './GroupPage'
import type { TripPerson, WorkspaceData } from '../types'

const mocks = vi.hoisted(() => ({
  useWorkspace: vi.fn(),
  useTripPeople: vi.fn(),
  useWorkspaceMutations: vi.fn(),
}))

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
  mocks.useWorkspace.mockReturnValue({ data: workspace(role), isLoading: false, isError: false, refetch: vi.fn() })
  mocks.useTripPeople.mockReturnValue({ data: people, isLoading: false, isError: false, refetch: vi.fn() })
  mocks.useWorkspaceMutations.mockReturnValue({
    displayName: { mutateAsync: vi.fn(), isPending: false },
    checklist: { mutateAsync: vi.fn(), isPending: false },
    deleteChecklist: { mutateAsync: vi.fn(), isPending: false },
    archiveTrip: { mutateAsync: vi.fn(), isPending: false },
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
  it('keeps settings compact, discards a cancelled draft and saves through the owner editor', async () => {
    setup('owner')
    const update = mocks.useWorkspaceMutations().updateTrip.mutateAsync
    update.mockResolvedValue(undefined)
    render(<GroupPage />)
    expect(screen.queryByLabelText('Tên chuyến đi')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Chỉnh sửa chuyến', exact: true }))
    fireEvent.change(screen.getByLabelText('Tên chuyến đi'), { target: { value: 'Bản nháp chưa lưu' } })
    fireEvent.click(screen.getByRole('button', { name: 'Hủy chỉnh sửa' }))
    expect(update).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Chỉnh sửa chuyến', exact: true }))
    expect(screen.getByLabelText('Tên chuyến đi')).toHaveValue(trip.name)
    fireEvent.change(screen.getByLabelText('Tên chuyến đi'), { target: { value: 'Hành trình Huế cùng bạn' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thông tin' }))
    await waitFor(() => expect(update).toHaveBeenCalledWith({ existing: trip, draft: expect.objectContaining({ name: 'Hành trình Huế cùng bạn' }) }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByRole('status')).toHaveTextContent('Đã cập nhật')
  })

  it('retains an owner draft and actionable error when saving fails', async () => {
    setup('owner')
    mocks.useWorkspaceMutations().updateTrip.mutateAsync.mockRejectedValue(new Error('Chuyến đi đã thay đổi.'))
    render(<GroupPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Chỉnh sửa chuyến', exact: true }))
    fireEvent.change(screen.getByLabelText('Điểm đến'), { target: { value: 'Huế và vùng lân cận' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thông tin' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Chuyến đi đã thay đổi.')
    expect(screen.getByLabelText('Điểm đến')).toHaveValue('Huế và vùng lân cận')
    expect(screen.getByRole('button', { name: 'Lưu thông tin' })).toBeEnabled()
  })

  it('shows active and held-seat counts and disables another invite when all four seats are occupied', () => {
    setup('owner')
    render(<GroupPage />)

    expect(screen.getByText(/3\/4 người đã tham gia · 1 chỗ đang giữ cho lời mời/)).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByText(/Bạn có thể huỷ lời mời đang chờ để giải phóng chỗ/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Thêm', exact: true })).toBeDisabled()
    expect(screen.getByLabelText('Mời bằng email')).toBeDisabled()
  })

  it('treats a full group without pending invitations as normal and offers a useful capacity action', async () => {
    setup('owner')
    const fullGroup = [...people.slice(0, 3), { ...people[1], userId: 'member-3', email: 'three@example.com' }]
    mocks.useTripPeople.mockReturnValue({ data: fullGroup, isLoading: false, isError: false })
    render(<GroupPage />)

    expect(screen.getByText('Nhóm đã đủ 4 thành viên.')).toBeInTheDocument()
    expect(screen.queryByText(/Huỷ lời mời hoặc/)).not.toBeInTheDocument()
    expect(screen.queryByText(/0 lời mời/)).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Thêm', exact: true })).toBeDisabled()
    fireEvent.click(await screen.findByRole('button', { name: 'Tăng số người tối đa' }))
    await waitFor(() => expect(screen.getByLabelText('Số người tối đa')).toHaveFocus())
  })

  it('does not suggest increasing capacity beyond the supported limit', () => {
    setup('owner')
    const fullGroup = Array.from({ length: 20 }, (_, index) => ({ ...people[1], userId: `member-${index}`, email: `member-${index}@example.com` }))
    mocks.useWorkspace.mockReturnValue({ data: { ...workspace('owner'), trip: { ...trip, maxMembers: 20 }, people: fullGroup, memberCount: 20 }, isLoading: false, isError: false })
    mocks.useTripPeople.mockReturnValue({ data: fullGroup, isLoading: false, isError: false })
    render(<GroupPage />)

    expect(screen.getByText('Nhóm đã đủ 20 thành viên.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Tăng số người tối đa' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Thêm', exact: true })).toBeDisabled()
  })

  it('enables invitations and removes full-group guidance when a place is available', () => {
    setup('owner')
    mocks.useTripPeople.mockReturnValue({ data: people.slice(0, 3), isLoading: false, isError: false })
    render(<GroupPage />)

    expect(screen.getByRole('button', { name: 'Thêm', exact: true })).toBeEnabled()
    expect(screen.getByLabelText('Mời bằng email')).toBeEnabled()
    expect(screen.queryByRole('button', { name: 'Tăng số người tối đa' })).not.toBeInTheDocument()
    expect(screen.queryByText(/Nhóm đã đủ/)).not.toBeInTheDocument()
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

    expect(screen.queryByRole('button', { name: 'Chỉnh sửa chuyến', exact: true })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Tên chuyến đi')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Huỷ lời mời/ })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Mời bằng email')).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
