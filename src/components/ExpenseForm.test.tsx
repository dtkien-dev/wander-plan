import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ExpenseForm } from './ExpenseForm'
import type { TripPerson } from '../types'

const people: TripPerson[] = [
  { userId: 'owner', email: 'owner@example.com', displayName: 'Bạn', role: 'owner', status: 'active', joinedAt: '' },
  { userId: 'friend', email: 'friend@example.com', displayName: 'Người bạn đồng hành', role: 'editor', status: 'active', joinedAt: '' },
]

afterEach(cleanup)

describe('ExpenseForm', () => {
  it('defaults the payer to the creator and selects all active participants', () => {
    render(
      <ExpenseForm
        tripStart="2026-11-27"
        tripEnd="2026-11-30"
        pending={false}
        people={people}
        currentUserId="owner"
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    expect(screen.getByLabelText('Người thanh toán')).toHaveValue('owner')
    expect(screen.getByRole('checkbox', { name: 'Bạn' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Người bạn đồng hành' })).toBeChecked()
  })

  it('requires the creator to choose at least one participant', async () => {
    const onSubmit = vi.fn()
    render(
      <ExpenseForm
        tripStart="2026-11-27"
        tripEnd="2026-11-30"
        pending={false}
        people={people}
        currentUserId="owner"
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    )

    fireEvent.change(screen.getByLabelText('Khoản chi'), { target: { value: 'Ăn tối' } })
    fireEvent.click(screen.getByRole('checkbox', { name: 'Bạn' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Người bạn đồng hành' }))
    fireEvent.click(screen.getByRole('button', { name: 'Thêm chi phí' }))

    expect(await screen.findByText('Chọn ít nhất một người tham gia.')).toBeInTheDocument()
    await waitFor(() => expect(onSubmit).not.toHaveBeenCalled())
  })

  it('keeps an untouched actual amount as not yet incurred', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(
      <ExpenseForm
        tripStart="2026-11-27"
        tripEnd="2026-11-30"
        pending={false}
        people={people}
        currentUserId="owner"
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    )

    fireEvent.change(screen.getByLabelText('Khoản chi'), { target: { value: 'Ăn tối' } })
    fireEvent.change(screen.getByLabelText('Dự kiến'), { target: { value: '200000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Thêm chi phí' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ estimatedAmountVnd: 200000, actualAmountVnd: null })
  })

  it('saves a round trip as one expense with its return date', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<ExpenseForm tripStart="2026-11-27" tripEnd="2026-11-30" pending={false} people={people} currentUserId="owner" onSubmit={onSubmit} onCancel={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('Khoản chi'), { target: { value: 'Xe khứ hồi' } })
    fireEvent.change(screen.getByLabelText('Phân loại'), { target: { value: 'transport' } })
    expect(screen.queryByLabelText('Ngày về')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('checkbox', { name: /Khứ hồi/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Thêm chi phí' }))
    expect(await screen.findByText('Chọn ngày về.')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/^Ngày về/), { target: { value: '2026-11-30' } })
    fireEvent.click(screen.getByRole('button', { name: 'Thêm chi phí' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ category: 'transport', expenseDate: '2026-11-27', endDate: '2026-11-30' })
  })

  it('requires a later check-out for stays and shows nights with a nightly estimate', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<ExpenseForm tripStart="2026-11-27" tripEnd="2026-11-30" pending={false} people={people} currentUserId="owner" onSubmit={onSubmit} onCancel={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('Khoản chi'), { target: { value: 'Khách sạn' } })
    fireEvent.change(screen.getByLabelText('Phân loại'), { target: { value: 'stay' } })
    fireEvent.change(screen.getByLabelText('Dự kiến (tổng)'), { target: { value: '1800000' } })
    fireEvent.change(screen.getByLabelText('Ngày trả phòng'), { target: { value: '2026-11-27' } })
    fireEvent.click(screen.getByRole('button', { name: 'Thêm chi phí' }))
    expect(await screen.findByText('Ngày trả phòng phải sau ngày nhận phòng.')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/^Ngày trả phòng/), { target: { value: '2026-11-30' } })
    expect(await screen.findByRole('status')).toHaveTextContent('3 đêm')
    fireEvent.click(screen.getByRole('button', { name: 'Thêm chi phí' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ category: 'stay', endDate: '2026-11-30', estimatedAmountVnd: 1800000 })
  })

  it('drops a return date when a round trip becomes another category', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const expense = { id: 'e', tripId: 't', title: 'Xe khứ hồi', category: 'transport' as const, expenseDate: '2026-11-27', endDate: '2026-11-30', estimatedAmountVnd: 1000, actualAmountVnd: null, paidByUserId: 'owner', participantUserIds: ['owner'], notes: '', version: 1 }
    render(<ExpenseForm expense={expense} tripStart="2026-11-27" tripEnd="2026-11-30" pending={false} people={people} currentUserId="owner" onSubmit={onSubmit} onCancel={vi.fn()} />)

    expect(screen.getByRole('checkbox', { name: /Khứ hồi/ })).toBeChecked()
    fireEvent.change(screen.getByLabelText('Phân loại'), { target: { value: 'other' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ category: 'other', endDate: null })
  })
})
