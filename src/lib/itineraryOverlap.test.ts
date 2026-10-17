import { describe, expect, it } from 'vitest'
import { overlaps } from './itineraryOverlap'

const slot = (startTime: string, endTime: string, visitDate = '2026-11-27', id?: string, endDate: string | null = null) => ({ id, visitDate, endDate, startTime, endTime })

describe('overlaps', () => {
  it('flags intersecting ranges on the same date only', () => {
    expect(overlaps(slot('09:00', '10:30'), slot('10:00', '11:00', undefined, 'b'))).toBe(true)
    expect(overlaps(slot('09:00', '12:00'), slot('10:00', '11:00', undefined, 'b'))).toBe(true)
    expect(overlaps(slot('09:00', '10:30'), slot('10:00', '11:00', '2026-11-28', 'b'))).toBe(false)
  })

  it('treats ranges as [start, end): touching ranges do not overlap', () => {
    expect(overlaps(slot('09:00', '10:00'), slot('10:00', '11:00', undefined, 'b'))).toBe(false)
    expect(overlaps(slot('11:00', '12:00'), slot('10:00', '11:00', undefined, 'b'))).toBe(false)
  })

  it('ignores incomplete or inverted draft ranges', () => {
    expect(overlaps(slot('', '10:00'), slot('09:00', '11:00', undefined, 'b'))).toBe(false)
    expect(overlaps(slot('10:30', '09:30'), slot('09:00', '11:00', undefined, 'b'))).toBe(false)
  })

  it('compares multi-day activities as one continuous interval', () => {
    const trek = slot('20:00', '08:00', '2026-11-27', 'trek', '2026-11-29')
    expect(overlaps(slot('21:00', '22:00', '2026-11-28'), trek)).toBe(true)
    expect(overlaps(slot('07:00', '09:00', '2026-11-29'), trek)).toBe(true)
    expect(overlaps(slot('08:00', '09:00', '2026-11-29'), trek)).toBe(false)
    expect(overlaps(slot('18:00', '20:00', '2026-11-27'), trek)).toBe(false)
    expect(overlaps(trek, slot('09:00', '10:00', '2026-11-30', 'b'))).toBe(false)
  })

  it('never compares an item with itself', () => {
    expect(overlaps(slot('09:00', '10:00', undefined, 'a'), slot('09:00', '10:00', undefined, 'a'))).toBe(false)
  })
})
