import { describe, expect, it } from 'vitest'
import { calculateExpenseSettlement, splitExpenseAmount, validateSplit } from './expenseSettlement'
import type { Expense, TripPerson } from '../types'

const people: TripPerson[] = [
  { userId: 'a', email: 'a@example.com', displayName: 'An', role: 'owner', status: 'active', joinedAt: '' },
  { userId: 'b', email: 'b@example.com', displayName: 'Bình', role: 'editor', status: 'active', joinedAt: '' },
  { userId: 'c', email: 'c@example.com', displayName: 'Chi', role: 'editor', status: 'active', joinedAt: '' },
]

const expense = (overrides: Partial<Expense>): Expense => ({
  id: 'e', tripId: 't', title: 'Bữa tối', category: 'food', expenseDate: '2026-11-27', endDate: null,
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

  it('splits by shares with the leftover on the payer, or spread in fixed order when the payer is absent', () => {
    const shares = { splitMethod: 'shares' as const, splitValues: { a: 1, b: 1, c: 1 } }
    expect(splitExpenseAmount(100, { ...shares, paidByUserId: 'b', participantUserIds: ['a', 'b', 'c'] })).toEqual([
      { userId: 'a', amountVnd: 33 }, { userId: 'b', amountVnd: 34 }, { userId: 'c', amountVnd: 33 },
    ])
    expect(splitExpenseAmount(100, { splitMethod: 'shares', splitValues: { b: 2, c: 1 }, paidByUserId: 'a', participantUserIds: ['c', 'b'] })).toEqual([
      { userId: 'b', amountVnd: 67 }, { userId: 'c', amountVnd: 33 },
    ])
    const result = calculateExpenseSettlement([expense({ actualAmountVnd: 300, splitMethod: 'shares', splitValues: { a: 1, b: 2 }, participantUserIds: ['a', 'b'] })], people)
    expect(result.transfers).toEqual([{ fromUserId: 'b', toUserId: 'a', amountVnd: 200 }])
  })

  it('uses exact amounts and reports how far they are from the expense amount', () => {
    const amounts = expense({ actualAmountVnd: 150, splitMethod: 'amounts', splitValues: { a: 50, b: 100 }, participantUserIds: ['a', 'b'] })
    expect(calculateExpenseSettlement([amounts], people).transfers).toEqual([{ fromUserId: 'b', toUserId: 'a', amountVnd: 100 }])
    expect(validateSplit(amounts)).toBeNull()
    expect(validateSplit({ ...amounts, actualAmountVnd: 200 })).toMatch(/thiếu 50/)
    expect(validateSplit({ ...amounts, actualAmountVnd: null, estimatedAmountVnd: 120 })).toMatch(/thừa 30/)
    expect(validateSplit({ ...amounts, splitValues: { a: 50 } })).toMatch(/từng người/)
    expect(validateSplit({ ...amounts, splitMethod: 'shares', splitValues: { a: 1, b: 0 } })).toMatch(/từ 1 đến 1000/)
  })

  it('subtracts recorded payments and shows the remaining difference after expenses change', () => {
    const paid = { id: 'p', tripId: 't', fromUserId: 'b', toUserId: 'a', amountVnd: 45, createdAt: '' }
    const settled = calculateExpenseSettlement([expense({ actualAmountVnd: 90, participantUserIds: ['b', 'c'] })], people, [paid])
    expect(settled.transfers).toEqual([{ fromUserId: 'c', toUserId: 'a', amountVnd: 45 }])

    const raised = calculateExpenseSettlement([expense({ actualAmountVnd: 120, participantUserIds: ['b', 'c'] })], people, [paid])
    expect(raised.transfers).toEqual([
      { fromUserId: 'b', toUserId: 'a', amountVnd: 15 },
      { fromUserId: 'c', toUserId: 'a', amountVnd: 60 },
    ])

    const lowered = calculateExpenseSettlement([expense({ actualAmountVnd: 60, participantUserIds: ['b', 'c'] })], people, [paid])
    expect(lowered.transfers).toEqual([
      { fromUserId: 'c', toUserId: 'a', amountVnd: 15 },
      { fromUserId: 'c', toUserId: 'b', amountVnd: 15 },
    ])
    expect(lowered.balances.reduce((sum, balance) => sum + balance.amountVnd, 0)).toBe(0)
  })
})
