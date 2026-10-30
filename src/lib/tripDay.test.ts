import { describe, expect, it } from 'vitest'
import { boardStatus, itemsOnDay, splitTotals } from './tripDay'
import type { Expense } from '../types'

const item = (visitDate: string, startTime: string, endTime: string, endDate: string | null = null) => ({ visitDate, endDate, startTime, endTime })

describe('trip day board', () => {
  it('lists single and multi-day activities on each day they span, in start order', () => {
    const camping = item('2026-11-27', '20:00', '08:00', '2026-11-29')
    const cafe = item('2026-11-28', '09:00', '10:00')
    expect(itemsOnDay([cafe, camping], '2026-11-28')).toEqual([camping, cafe])
    expect(itemsOnDay([cafe, camping], '2026-11-30')).toEqual([])
  })

  it('derives done/now/next from the [start, end) interval across days', () => {
    const camping = item('2026-11-27', '20:00', '08:00', '2026-11-29')
    expect(boardStatus(camping, '2026-11-27T19:59')).toBe('next')
    expect(boardStatus(camping, '2026-11-28T12:00')).toBe('now')
    expect(boardStatus(camping, '2026-11-29T08:00')).toBe('done')
  })

  it('keeps actual spending separate from estimate-only expenses', () => {
    const expense = (actual: number | null, estimate: number) => ({ actualAmountVnd: actual, estimatedAmountVnd: estimate }) as Expense
    expect(splitTotals([expense(100, 80), expense(null, 50), expense(0, 30)])).toEqual({ actual: 100, estimateOnly: 50 })
  })
})
