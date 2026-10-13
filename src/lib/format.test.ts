import { describe, expect, it } from 'vitest'
import { isGoogleMapsUrl, safePercent, totalExpenses } from './format'

describe('travel format helpers', () => {
  it('uses actual cost when available and estimated cost otherwise', () => {
    expect(totalExpenses([
      { id: '1', tripId: 't', title: 'A', category: 'food', expenseDate: '2026-01-01', estimatedAmountVnd: 100, actualAmountVnd: 80, paidByUserId: 'a', participantUserIds: ['a'], notes: '', version: 1 },
      { id: '2', tripId: 't', title: 'B', category: 'stay', expenseDate: '2026-01-01', estimatedAmountVnd: 200, actualAmountVnd: null, paidByUserId: 'a', participantUserIds: ['a'], notes: '', version: 1 },
    ])).toBe(280)
  })

  it('accepts only known Google Maps hosts', () => {
    expect(isGoogleMapsUrl('https://maps.app.goo.gl/abc')).toBe(true)
    expect(isGoogleMapsUrl('https://example.com/maps')).toBe(false)
  })

  it('keeps progress percentages finite for zero or invalid budgets', () => {
    expect(safePercent(100, 0)).toBe(0)
    expect(safePercent(120, 100)).toBe(100)
    expect(safePercent(-10, 100)).toBe(0)
  })
})
