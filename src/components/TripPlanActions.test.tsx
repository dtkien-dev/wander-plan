import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { TripPlanActions } from './TripPlanActions'
import { demoWorkspace } from '../data/demoData'

const mocks = vi.hoisted(() => ({ move: vi.fn(), copy: vi.fn(), notify: vi.fn() }))
vi.mock('../hooks/useWorkspaceMutations', () => ({ useWorkspaceMutations: () => ({ rescheduleTrip: { mutateAsync: mocks.move, isPending: false }, cloneTrip: { mutateAsync: mocks.copy, isPending: false } }) }))
vi.mock('../providers/NotificationProvider', () => ({ useNotify: () => ({ success: mocks.notify }) }))
beforeEach(() => { vi.clearAllMocks(); mocks.move.mockResolvedValue(undefined); mocks.copy.mockResolvedValue('new-trip') })
afterEach(cleanup)

it('previews the move, blocks preserved out-of-range costs and requires explicit expense choice', async () => {
  const source = structuredClone(demoWorkspace)
  render(<TripPlanActions data={source} />)
  fireEvent.click(screen.getByRole('button', { name: 'Dời ngày chuyến', exact: true }))
  expect(screen.getByRole('button', { name: 'Xác nhận dời chuyến' })).toBeDisabled()
  fireEvent.change(screen.getByLabelText('Ngày bắt đầu mới'), { target: { value: '2026-12-04' } })
  expect(screen.getByRole('alert')).toHaveTextContent('ngoài khoảng ngày mới')
  expect(mocks.move).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('checkbox', { name: 'Dời ngày các khoản chi cùng chuyến' }))
  expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận dời chuyến' }))
  await waitFor(() => expect(mocks.move).toHaveBeenCalledWith({ source, startDate: '2026-12-04', shiftExpenses: true }))
})

it('retains the original preview versions after realtime changes and shows server errors inline', async () => {
  mocks.move.mockRejectedValue(new Error('Kế hoạch đã thay đổi.'))
  const source = structuredClone(demoWorkspace)
  const view = render(<TripPlanActions data={source} />)
  fireEvent.click(screen.getByRole('button', { name: 'Dời ngày chuyến', exact: true }))
  fireEvent.change(screen.getByLabelText('Ngày bắt đầu mới'), { target: { value: '2026-12-04' } })
  fireEvent.click(screen.getByRole('checkbox', { name: 'Dời ngày các khoản chi cùng chuyến' }))
  view.rerender(<TripPlanActions data={{ ...source, trip: { ...source.trip, version: 99 } }} />)
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận dời chuyến' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Kế hoạch đã thay đổi.')
  expect(mocks.move.mock.calls[0][0].source.trip.version).toBe(source.trip.version)
})

it('copies the plan with a request key and safely cancels a draft', async () => {
  render(<TripPlanActions data={structuredClone(demoWorkspace)} />)
  fireEvent.click(screen.getByRole('button', { name: 'Nhân bản chuyến', exact: true }))
  fireEvent.change(screen.getByLabelText('Ngày bắt đầu mới'), { target: { value: '2027-01-01' } })
  fireEvent.click(screen.getByRole('button', { name: 'Hủy', exact: true }))
  expect(mocks.copy).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Nhân bản chuyến', exact: true }))
  fireEvent.change(screen.getByLabelText('Tên chuyến mới'), { target: { value: 'New plan' } })
  fireEvent.change(screen.getByLabelText('Ngày bắt đầu mới'), { target: { value: '2027-01-01' } })
  expect(screen.getByText(/Không sao chép thành viên/)).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Tạo bản sao', exact: true }))
  await waitFor(() => expect(mocks.copy).toHaveBeenCalledWith(expect.objectContaining({ name: 'New plan', startDate: '2027-01-01', requestId: expect.any(String) })))
})

it('hides planning actions from editors', () => {
  render(<TripPlanActions data={{ ...demoWorkspace, currentRole: 'editor' }} />)
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
})
