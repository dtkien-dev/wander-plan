import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TripManager } from './TripManager'

const mocks = vi.hoisted(() => ({
  context: { tripId: null as string | null, selectTrip: vi.fn(), trips: {} as Record<string, unknown>, invitations: {} as Record<string, unknown> },
  mutations: { createTrip: {} as Record<string, unknown>, respondInvitation: {} as Record<string, unknown> },
}))

vi.mock('../providers/WorkspaceProvider', () => ({ useWorkspaceContext: () => mocks.context }))
vi.mock('../hooks/useWorkspace', () => ({ useWorkspaceMutations: () => mocks.mutations }))

const invitation = {
  tripId: 'invited-trip', tripName: 'Chuyến Huế', destination: 'Huế', startDate: '2027-02-10', endDate: '2027-02-12',
}

function setInvitations() {
  mocks.context.invitations = { data: [invitation], isError: false, refetch: vi.fn() }
  mocks.context.trips = { data: [] }
}

function openCreateForm() {
  fireEvent.click(screen.getByRole('button', { name: 'Tạo chuyến mới' }))
}

function fillCreateForm(overrides: Partial<Record<string, string>> = {}) {
  const values = {
    'Tên chuyến đi': '  Hành trình Huế  ',
    'Điểm đến': '  Huế  ',
    'Ngày bắt đầu': '2027-02-10',
    'Ngày kết thúc': '2027-02-12',
    'Ngân sách (VND)': '2500000',
    'Số người tối đa': '5',
    ...overrides,
  }
  for (const [label, value] of Object.entries(values)) fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

beforeEach(() => {
  vi.clearAllMocks()
  setInvitations()
  mocks.mutations.createTrip = { mutateAsync: vi.fn().mockResolvedValue('created-trip'), isPending: false }
  mocks.mutations.respondInvitation = { mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false }
  vi.spyOn(crypto, 'randomUUID').mockReturnValue('request-id-1')
})
afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe('TripManager', () => {
  it('accepts and declines incoming invitations through the mutation contract', async () => {
    render(<TripManager />)
    fireEvent.click(screen.getByRole('button', { name: 'Nhận lời mời' }))
    await waitFor(() => expect(mocks.mutations.respondInvitation.mutateAsync).toHaveBeenCalledWith({ tripId: 'invited-trip', accept: true }))
    expect(await screen.findByRole('status')).toHaveTextContent('Bạn đã tham gia chuyến đi.')

    fireEvent.click(screen.getByRole('button', { name: 'Từ chối' }))
    await waitFor(() => expect(mocks.mutations.respondInvitation.mutateAsync).toHaveBeenLastCalledWith({ tripId: 'invited-trip', accept: false }))
    expect(await screen.findByRole('status')).toHaveTextContent('Đã từ chối lời mời.')
  })

  it('shows an invitation action error without hiding the pending invitation', async () => {
    mocks.mutations.respondInvitation = { mutateAsync: vi.fn().mockRejectedValue(new Error('Tạm thời không thể tham gia.')), isPending: false }
    render(<TripManager />)

    fireEvent.click(screen.getByRole('button', { name: 'Nhận lời mời' }))

    expect(await screen.findByRole('status')).toHaveTextContent('Tạm thời không thể tham gia.')
    expect(screen.getByText('Chuyến Huế')).toBeInTheDocument()
  })

  it('validates that the end date is not before the start date', async () => {
    render(<TripManager />)
    openCreateForm()
    fillCreateForm({ 'Ngày kết thúc': '2027-02-09' })
    fireEvent.click(screen.getByRole('button', { name: 'Tạo chuyến đi' }))

    expect(await screen.findByText('Ngày kết thúc phải từ ngày bắt đầu trở đi.')).toBeInTheDocument()
    expect(mocks.mutations.createTrip.mutateAsync).not.toHaveBeenCalled()
  })

  it('submits the validated trip draft with one stable request id', async () => {
    render(<TripManager />)
    openCreateForm()
    fillCreateForm()
    fireEvent.click(screen.getByRole('button', { name: 'Tạo chuyến đi' }))

    await waitFor(() => expect(mocks.mutations.createTrip.mutateAsync).toHaveBeenCalledWith({
      draft: { name: 'Hành trình Huế', destination: 'Huế', startDate: '2027-02-10', endDate: '2027-02-12', budgetVnd: 2_500_000, maxMembers: 5 },
      requestId: 'request-id-1',
    }))
    await act(async () => Promise.resolve())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
