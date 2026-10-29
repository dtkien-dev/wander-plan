import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ItineraryPage } from './ItineraryPage'
import { demoWorkspace } from '../data/demoData'

const mocks = vi.hoisted(() => ({ workspace: vi.fn(), mutations: vi.fn(), success: vi.fn() }))
vi.mock('../hooks/useWorkspace', () => ({ useWorkspace: mocks.workspace, useWorkspaceMutations: mocks.mutations }))
vi.mock('../providers/NotificationProvider', () => ({ useNotify: () => ({ success: mocks.success, error: vi.fn() }) }))
let data: typeof demoWorkspace
let remove: ReturnType<typeof vi.fn>
beforeEach(() => {
  data = structuredClone(demoWorkspace)
  data.itinerary = [{ ...data.itinerary[0], title: 'Camping', visitDate: data.trip.startDate, endDate: data.trip.endDate }, { ...data.itinerary[1], title: 'Cafe' }]
  remove = vi.fn().mockResolvedValue(undefined)
  mocks.workspace.mockImplementation(() => ({ data }))
  mocks.mutations.mockReturnValue({ restoreItinerary: { mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false }, deleteItineraries: { mutateAsync: remove, isPending: false }, deleteItinerary: { isPending: false }, itinerary: { isPending: false }, importTripData: { isPending: false } })
})
afterEach(() => { cleanup(); vi.clearAllMocks() })

it('shares selection across multi-day copies, cancels safely, and confirms unique selected rows', async () => {
  render(<ItineraryPage />)
  const copies = screen.getAllByRole('checkbox', { name: /^Chọn Camping ngày/ })
  fireEvent.click(copies[0])
  for (const copy of copies) expect(copy).toBeChecked()
  fireEvent.click(screen.getByRole('button', { name: 'Xóa mục đã chọn (1)' }))
  fireEvent.click(screen.getByRole('button', { name: 'Hủy' }))
  expect(remove).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('checkbox', { name: 'Chọn tất cả (2)' }))
  fireEvent.click(screen.getByRole('button', { name: 'Xóa mục đã chọn (2)' }))
  expect(remove).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận xóa 2 mục' }))
  await waitFor(() => expect(remove).toHaveBeenCalledWith({ tripId: data.trip.id, items: data.itinerary }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  expect(screen.getByRole('button', { name: 'Xóa mục đã chọn (0)' })).toBeDisabled()
})

it('keeps a failed confirmation visible and preserves selected versions after a remote edit', async () => {
  remove.mockRejectedValue(new Error('Lịch trình đã thay đổi.'))
  const original = structuredClone(data.itinerary[0])
  const view = render(<ItineraryPage />)
  fireEvent.click(screen.getAllByRole('checkbox', { name: /^Chọn Camping ngày/ })[0])
  data = { ...data, itinerary: data.itinerary.map((item) => ({ ...item, version: item.version + 1 })) }
  view.rerender(<ItineraryPage />)
  fireEvent.click(screen.getByRole('button', { name: 'Xóa mục đã chọn (1)' }))
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận xóa 1 mục' }))
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Lịch trình đã thay đổi.'))
  expect(remove).toHaveBeenCalledWith({ tripId: data.trip.id, items: [original] })
  expect(screen.getByRole('dialog')).toBeInTheDocument()
})

it('hides bulk controls from editors', () => {
  data.currentRole = 'editor'
  render(<ItineraryPage />)
  expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /Xóa mục đã chọn/ })).not.toBeInTheDocument()
})

it('lists recoverable activities for the owner and reports restore errors inline', async () => {
  data.itineraryTrash = [{ ...data.itinerary[0], deletedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 86400000).toISOString() }]
  const restore = mocks.mutations().restoreItinerary.mutateAsync
  restore.mockRejectedValue(new Error('Ngày nằm ngoài chuyến đi.'))
  render(<ItineraryPage />)
  fireEvent.click(screen.getByRole('button', { name: 'Thùng rác (1)' }))
  fireEvent.click(screen.getByRole('button', { name: 'Khôi phục Camping', exact: true }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Ngày nằm ngoài chuyến đi.')
  expect(restore).toHaveBeenCalledWith(data.itineraryTrash[0])
})
