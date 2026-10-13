import { describe, expect, it } from 'vitest'
import { calculateExpenseSettlement } from './expenseSettlement'
import type { Expense, TripPerson } from '../types'

const people: TripPerson[] = [
  { userId: 'a', email: 'a@example.com', displayName: 'An', role: 'owner', status: 'active', joinedAt: '' },
  { userId: 'b', email: 'b@example.com', displayName: 'Bình', role: 'editor', status: 'active', joinedAt: '' },
  { userId: 'c', email: 'c@example.com', displayName: 'Chi', role: 'editor', status: 'active', joinedAt: '' },
]

const expense = (overrides: Partial<Expense>): Expense => ({
  id: 'e', tripId: 't', title: 'Bữa tối', category: 'food', expenseDate: '2026-11-27',
  estimatedAmountVnd: 0, actualAmountVnd: 100, paidByUserId: 'a', participantUserIds: ['a', 'b', 'c'],
  notes: '', version: 1, ...overrides,
})

describe('expense settlement', () => {
  it('splits actual amounts only among selected participants and conserves every đồng', () => {
    const result = calculateExpenseSettlement([
      expense({ actualAmountVnd: 100 }),
      expense({ id: 'estimate', actualAmountVnd: null, estimatedAmountVnd: 900, paidByUserId: 'b' }),
    ], people)

    expect(result.balances).toEqual([
      { userId: 'a', amountVnd: 66 },
      { userId: 'b', amountVnd: -33 },
      { userId: 'c', amountVnd: -33 },
    ])
    expect(result.balances.reduce((sum, balance) => sum + balance.amountVnd, 0)).toBe(0)
    expect(result.transfers).toEqual([
      { fromUserId: 'b', toUserId: 'a', amountVnd: 33 },
      { fromUserId: 'c', toUserId: 'a', amountVnd: 33 },
    ])
  })

  it('allows the payer to be outside the selected participant group', () => {
    const result = calculateExpenseSettlement([
      expense({ actualAmountVnd: 90, paidByUserId: 'a', participantUserIds: ['b', 'c'] }),
    ], people)

    expect(result.transfers).toEqual([
      { fromUserId: 'b', toUserId: 'a', amountVnd: 45 },
      { fromUserId: 'c', toUserId: 'a', amountVnd: 45 },
    ])
  })
})
