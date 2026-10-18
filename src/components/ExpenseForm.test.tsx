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

  it('submits share and exact-amount splits and blocks amounts that do not match the expense', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<ExpenseForm tripStart="2026-11-27" tripEnd="2026-11-30" pending={false} people={people} currentUserId="owner" onSubmit={onSubmit} onCancel={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('Khoản chi'), { target: { value: 'Phòng khách sạn' } })
    fireEvent.change(screen.getByLabelText('Dự kiến'), { target: { value: '300000' } })
    fireEvent.click(screen.getByRole('radio', { name: 'Theo phần' }))
    fireEvent.change(screen.getByLabelText('Số phần của Bạn'), { target: { value: '2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Thêm chi phí' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ splitMethod: 'shares', splitValues: { owner: 2, friend: 1 } })

    fireEvent.click(screen.getByRole('radio', { name: 'Theo số tiền' }))
    expect(screen.getByLabelText('Số tiền của Bạn')).toHaveValue(null)
    fireEvent.change(screen.getByLabelText('Số tiền của Bạn'), { target: { value: '100000' } })
    fireEvent.change(screen.getByLabelText('Số tiền của Người bạn đồng hành'), { target: { value: '150000' } })
    expect(screen.getByText(/còn lệch 50\.000/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Thêm chi phí' }))
    expect(await screen.findByText(/thiếu 50\.000/)).toBeInTheDocument()
    expect(onSubmit).toHaveBeenCalledTimes(1)
    fireEvent.change(screen.getByLabelText('Số tiền của Người bạn đồng hành'), { target: { value: '200000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Thêm chi phí' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2))
    expect(onSubmit.mock.calls[1][0]).toMatchObject({ splitMethod: 'amounts', splitValues: { owner: 100000, friend: 200000 } })
  })

  it('requires exact amounts to be re-entered after the actual amount changes', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const saved = { id: 'e', tripId: 't', title: 'Ăn tối', category: 'food' as const, expenseDate: '2026-11-27', endDate: null, estimatedAmountVnd: 0,
      actualAmountVnd: 150000, paidByUserId: 'owner', participantUserIds: ['owner', 'friend'], splitMethod: 'amounts' as const,
      splitValues: { owner: 50000, friend: 100000 }, notes: '', version: 1 }
    render(<ExpenseForm expense={saved} tripStart="2026-11-27" tripEnd="2026-11-30" pending={false} people={people} currentUserId="owner" onSubmit={onSubmit} onCancel={vi.fn()} />)
    expect(screen.getByLabelText('Số tiền của Người bạn đồng hành')).toHaveValue(100000)
    fireEvent.change(screen.getByLabelText('Thực tế'), { target: { value: '180000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
    expect(await screen.findByText(/thiếu 30\.000/)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it.each([{ participantUserIds: ['owner', 'gone'] }, { participantUserIds: ['gone'] }])('keeps frozen money while editing metadata with participants $participantUserIds', async ({ participantUserIds }) => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const saved = { id: 'e', tripId: 't', title: 'Ăn tối', category: 'food' as const, expenseDate: '2026-11-27', endDate: null, estimatedAmountVnd: 0,
      actualAmountVnd: 90000, paidByUserId: 'gone', participantUserIds, splitMethod: 'shares' as const,
      splitValues: Object.fromEntries(participantUserIds.map((id) => [id, id === 'gone' ? 2 : 1])), notes: '', version: 1 }
    render(<ExpenseForm expense={saved} tripStart="2026-11-27" tripEnd="2026-11-30" pending={false} people={people} currentUserId="owner"
      formerPeople={[{ userId: 'gone', displayName: 'Chi' }]} onSubmit={onSubmit} onCancel={vi.fn()} />)
    expect(screen.getByRole('note')).toHaveTextContent('Phần tiền đã khóa vì có người đã rời nhóm')
    expect(screen.getByRole('note')).toHaveTextContent('Trả bởi Chi (đã rời nhóm) · Theo phần:')
    for (const label of ['Người thanh toán', 'Dự kiến', 'Thực tế']) expect(screen.queryByLabelText(label)).not.toBeInTheDocument()
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Khoản chi'), { target: { value: 'Ăn tối cả nhóm' } })
    fireEvent.change(screen.getByLabelText('Ghi chú'), { target: { value: 'Đã đối chiếu hóa đơn' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ title: 'Ăn tối cả nhóm', notes: 'Đã đối chiếu hóa đơn', estimatedAmountVnd: 0, actualAmountVnd: 90000, paidByUserId: 'gone', participantUserIds, splitMethod: 'shares', splitValues: saved.splitValues })
  })

  it('accepts whole-dong costs and exact splits while rejecting negative and fractional amounts', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<ExpenseForm tripStart="2026-11-27" tripEnd="2026-11-30" pending={false} people={people} currentUserId="owner" onSubmit={onSubmit} onCancel={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('Khoản chi'), { target: { value: 'Vé xe buýt' } })
    fireEvent.click(screen.getByRole('radio', { name: 'Theo số tiền' }))
    for (const [label, value] of [['Dự kiến', '12503'], ['Thực tế', '15003'], ['Số tiền của Bạn', '5001'], ['Số tiền của Người bạn đồng hành', '10002']]) {
      const input = screen.getByLabelText(label) as HTMLInputElement
      for (const invalid of ['-1', '1.5']) {
        fireEvent.change(input, { target: { value: invalid } })
        expect(input.checkValidity()).toBe(false)
      }
      fireEvent.change(input, { target: { value } })
      expect(input.checkValidity()).toBe(true)
    }
    fireEvent.click(screen.getByRole('button', { name: 'Thêm chi phí' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ estimatedAmountVnd: 12503, actualAmountVnd: 15003, splitMethod: 'amounts', splitValues: { owner: 5001, friend: 10002 } })
  })
})
