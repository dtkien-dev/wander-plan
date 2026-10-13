import { describe, expect, it } from 'vitest'
import { isGoogleMapsUrl, totalExpenses } from './format'

describe('travel format helpers', () => {
  it('uses actual cost when available and estimated cost otherwise', () => {
    expect(totalExpenses([
      { id: '1', tripId: 't', title: 'A', category: 'food', expenseDate: '2026-01-01', estimatedAmountVnd: 100, actualAmountVnd: 80, notes: '', version: 1 },
      { id: '2', tripId: 't', title: 'B', category: 'stay', expenseDate: '2026-01-01', estimatedAmountVnd: 200, actualAmountVnd: null, notes: '', version: 1 },
    ])).toBe(280)
  })

  it('accepts only known Google Maps hosts', () => {
    expect(isGoogleMapsUrl('https://maps.app.goo.gl/abc')).toBe(true)
    expect(isGoogleMapsUrl('https://example.com/maps')).toBe(false)
  })
})
