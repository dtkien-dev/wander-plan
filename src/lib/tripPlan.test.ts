import { expect, it } from 'vitest'
import { demoWorkspace } from '../data/demoData'
import { previewTripPlan, shiftPlanDate } from './tripPlan'

it('moves across leap day and year boundaries without changing times, money or source data', () => {
  const source = structuredClone(demoWorkspace)
  source.trip.startDate = '2028-02-28'; source.trip.endDate = '2028-03-02'
  source.itinerary = [{ ...source.itinerary[0], visitDate: '2028-02-29', endDate: '2028-03-01', startTime: '20:00', endTime: '08:00' }]
  source.expenses = [{ ...source.expenses[0], expenseDate: '2028-02-28', endDate: '2028-03-01', actualAmountVnd: 12345 }]
  const before = structuredClone(source)
  const preview = previewTripPlan(source, '2028-03-01', true)
  expect(preview.trip.endDate).toBe('2028-03-04')
  expect(preview.itinerary[0]).toMatchObject({ visitDate: '2028-03-02', endDate: '2028-03-03', startTime: '20:00', endTime: '08:00' })
  expect(preview.expenses[0]).toMatchObject({ expenseDate: '2028-03-01', endDate: '2028-03-03', actualAmountVnd: 12345 })
  expect(source).toEqual(before)
  expect(shiftPlanDate('2027-01-01', -1)).toBe('2026-12-31')
})

it('reports preserved expense dates outside the new trip and rejects normalized/overflow dates', () => {
  const preview = previewTripPlan(demoWorkspace, '2027-01-01', false)
  expect(preview.conflictingExpenses.length).toBeGreaterThan(0)
  expect(preview.expenses).toEqual(demoWorkspace.expenses)
  for (const date of ['', '2027-02-29', '2026-04-31', '2027-1-1', '0000-01-01']) expect(() => shiftPlanDate(date, 0)).toThrow()
  expect(() => shiftPlanDate('9999-12-31', 1)).toThrow()
})
