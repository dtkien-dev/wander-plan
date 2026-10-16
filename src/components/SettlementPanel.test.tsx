import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { SettlementPanel } from './SettlementPanel'
import type { SettlementPayment } from '../types'
afterEach(cleanup)

const names: Record<string, string> = { a: 'An', b: 'Bình', c: 'Chi' }
const personName = (userId: string) => names[userId]
const payment: SettlementPayment = { id: 'p', tripId: 't', fromUserId: 'b', toUserId: 'a', amountVnd: 45_000, createdAt: '2026-11-27T10:00:00Z' }
const panel = (currentUserId: string, onConfirm = vi.fn(), onUndo = vi.fn()) => render(
  <SettlementPanel balances={[]} transfers={[{ fromUserId: 'c', toUserId: 'a', amountVnd: 45_000 }]} payments={[payment]}
    currentUserId={currentUserId} pending={false} personName={personName} onConfirm={onConfirm} onUndo={onUndo} />,
)

it('lets only the recipient confirm a transfer and undo a recorded payment', () => {
  const onConfirm = vi.fn()
  const onUndo = vi.fn()
  panel('a', onConfirm, onUndo)
  fireEvent.click(screen.getByRole('button', { name: /Đã nhận tiền/ }))
  expect(onConfirm).toHaveBeenCalledWith({ fromUserId: 'c', toUserId: 'a', amountVnd: 45_000 })
  fireEvent.click(screen.getByRole('button', { name: /Hủy xác nhận .* từ Bình/ }))
  expect(onUndo).toHaveBeenCalledWith(payment)
})

it('shows payers and other members a waiting note without confirm or undo controls', () => {
  panel('c')
  expect(screen.getByText('Chờ An xác nhận đã nhận')).toBeInTheDocument()
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
  expect(screen.getByRole('region', { name: 'Đã thanh toán' })).toHaveTextContent('Bình đã trả An')
})

it('labels settled balances and shows when each payment was confirmed', () => {
  render(<SettlementPanel balances={[{ userId: 'a', amountVnd: 0 }]} transfers={[]} payments={[{ ...payment, createdAt: new Date(2026, 10, 27, 9, 5).toISOString() }]}
    currentUserId="c" pending={false} personName={personName} onConfirm={vi.fn()} onUndo={vi.fn()} />)
  expect(screen.getByText('Đã cân bằng')).toBeInTheDocument()
  expect(screen.getByText('Đã quyết toán xong.')).toBeInTheDocument()
  expect(screen.getByText('27/11 09:05')).toBeInTheDocument()
})

it('keeps a payment from someone who left without an undo control', () => {
  render(<SettlementPanel balances={[]} transfers={[]} payments={[payment]} currentUserId="a" pending={false} personName={personName}
    isFormer={(userId) => userId === 'b'} onConfirm={vi.fn()} onUndo={vi.fn()} />)
  expect(screen.getByRole('region', { name: 'Đã thanh toán' })).toHaveTextContent('Bình đã trả An')
  expect(screen.queryByRole('button', { name: /Hủy xác nhận/ })).not.toBeInTheDocument()
})
