import { describe, expect, it } from 'vitest'
import { addDays, countNights, describeExpenseDates, isGoogleMapsUrl, safePercent, totalExpenses } from './format'

describe('travel format helpers', () => {
  it('uses actual cost when available and estimated cost otherwise', () => {
    expect(totalExpenses([
      { id: '1', tripId: 't', title: 'A', category: 'food', expenseDate: '2026-01-01', endDate: null, estimatedAmountVnd: 100, actualAmountVnd: 80, paidByUserId: 'a', participantUserIds: ['a'], notes: '', version: 1 },
      { id: '2', tripId: 't', title: 'B', category: 'stay', expenseDate: '2026-01-01', endDate: null, estimatedAmountVnd: 200, actualAmountVnd: null, paidByUserId: 'a', participantUserIds: ['a'], notes: '', version: 1 },
    ])).toBe(280)
  })

  it('accepts only known Google Maps hosts', () => {
    expect(isGoogleMapsUrl('https://maps.app.goo.gl/abc')).toBe(true)
    expect(isGoogleMapsUrl('https://example.com/maps')).toBe(false)
    expect(isGoogleMapsUrl('http://maps.app.goo.gl/abc')).toBe(false)
    expect(isGoogleMapsUrl('javascript:alert(1)')).toBe(false)
  })

  it('keeps progress percentages finite for zero or invalid budgets', () => {
    expect(safePercent(100, 0)).toBe(0)
    expect(safePercent(120, 100)).toBe(100)
    expect(safePercent(-10, 100)).toBe(0)
  })

  it('describes round trips and stays by their date ranges', () => {
    expect(describeExpenseDates({ category: 'transport', expenseDate: '2026-11-27', endDate: '2026-11-30' })).toBe('27/11 → 30/11 · Khứ hồi')
    expect(describeExpenseDates({ category: 'stay', expenseDate: '2026-11-27', endDate: '2026-11-30' })).toBe('27/11 → 30/11 · 3 đêm')
    expect(describeExpenseDates({ category: 'transport', expenseDate: '2026-11-27', endDate: null })).not.toContain('→')
  })

  it('counts nights across month boundaries', () => {
    expect(countNights('2026-11-29', '2026-12-02')).toBe(3)
    expect(addDays('2026-11-29', 3)).toBe('2026-12-02')
  })
})
