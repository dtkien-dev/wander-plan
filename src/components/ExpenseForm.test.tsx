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
})
