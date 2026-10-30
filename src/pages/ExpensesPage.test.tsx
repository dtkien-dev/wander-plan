import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { ExpensesPage } from './ExpensesPage'
import { demoWorkspace } from '../data/demoData'

const mocks = vi.hoisted(() => ({ workspace: vi.fn(), mutations: vi.fn(), success: vi.fn() }))
vi.mock('../hooks/useWorkspace', () => ({ useWorkspace: mocks.workspace }))
vi.mock('../hooks/useWorkspaceMutations', () => ({ useWorkspaceMutations: mocks.mutations }))
vi.mock('../providers/NotificationProvider', () => ({ useNotify: () => ({ success: mocks.success, error: vi.fn() }) }))
let data: typeof demoWorkspace
let remove: ReturnType<typeof vi.fn>
let restore: ReturnType<typeof vi.fn>
beforeEach(() => {
  data = structuredClone(demoWorkspace)
  remove = vi.fn().mockResolvedValue(undefined)
  restore = vi.fn().mockResolvedValue(undefined)
  mocks.workspace.mockImplementation(() => ({ data }))
  mocks.mutations.mockReturnValue({ deleteExpense: { mutateAsync: remove, isPending: false }, restoreExpense: { mutateAsync: restore, isPending: false },
    expense: { isPending: false }, recordPayment: { isPending: false }, undoPayment: { isPending: false }, importTripData: { isPending: false } })
})
afterEach(() => { cleanup(); vi.clearAllMocks() })

it('confirms expense deletion in an in-app dialog and keeps errors inline', async () => {
  const confirm = vi.spyOn(window, 'confirm')
  const expense = data.expenses[0]
  remove.mockRejectedValueOnce(new Error('Chi phí đã thay đổi.'))
  render(<ExpensesPage />)
  fireEvent.click(screen.getByRole('button', { name: `Xóa ${expense.title}` }))
  fireEvent.click(screen.getByRole('button', { name: 'Hủy' }))
  expect(remove).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: `Xóa ${expense.title}` }))
  fireEvent.click(screen.getByRole('button', { name: 'Xóa khoản chi' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Chi phí đã thay đổi.')
  fireEvent.click(screen.getByRole('button', { name: 'Xóa khoản chi' }))
  await vi.waitFor(() => expect(mocks.success).toHaveBeenCalledWith('Đã chuyển khoản chi vào thùng rác trong 7 ngày.'))
  expect(remove).toHaveBeenCalledWith(expense)
  expect(confirm).not.toHaveBeenCalled()
})

it('lists recoverable expenses with who deleted them and reports restore errors inline', async () => {
  data.expenseTrash = [{ ...data.expenses[0], deletedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 86400000).toISOString(), deletedByUserId: 'demo-owner' },
    { ...data.expenses[1], deletedAt: new Date().toISOString(), expiresAt: new Date(Date.now() - 1).toISOString(), deletedByUserId: 'demo-owner' }]
  restore.mockRejectedValue(new Error('Không thể khôi phục vì người trả hoặc người tham gia khoản chi này đã rời nhóm.'))
  render(<ExpensesPage />)
  fireEvent.click(screen.getByRole('button', { name: 'Thùng rác (1)' }))
  fireEvent.click(screen.getByRole('button', { name: `Khôi phục ${data.expenses[0].title}` }))
  expect(await screen.findByRole('alert')).toHaveTextContent('đã rời nhóm')
  expect(restore).toHaveBeenCalledWith(data.expenseTrash[0])
  expect(screen.getByText(/Xóa bởi/)).toBeInTheDocument()
})

it('confirms a received payment in an in-app dialog that names payer and amount', async () => {
  const confirm = vi.spyOn(window, 'confirm')
  const record = vi.fn().mockRejectedValueOnce(new Error('Đã có người ghi nhận trước.')).mockResolvedValue(undefined)
  mocks.mutations.mockReturnValue({ ...mocks.mutations(), recordPayment: { mutateAsync: record, isPending: false } })
  render(<ExpensesPage />)
  fireEvent.click(screen.getByRole('button', { name: /Đã nhận tiền/ }))
  const dialog = screen.getByRole('dialog')
  expect(dialog).toHaveTextContent('đã trả bạn')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Đã nhận tiền' }))
  expect(await within(dialog).findByRole('alert')).toHaveTextContent('Đã có người ghi nhận trước.')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Đã nhận tiền' }))
  await vi.waitFor(() => expect(mocks.success).toHaveBeenCalledWith('Đã ghi nhận thanh toán.'))
  expect(record).toHaveBeenCalledWith(expect.objectContaining({ tripId: data.trip.id, expectedCount: data.settlementPaymentCount ?? 0 }))
  expect(confirm).not.toHaveBeenCalled()
})
