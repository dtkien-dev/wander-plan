import { describe, expect, it } from 'vitest'
import { overlaps } from './itineraryOverlap'

const slot = (startTime: string, endTime: string, visitDate = '2026-11-27', id?: string) => ({ id, visitDate, startTime, endTime })

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

  it('never compares an item with itself', () => {
    expect(overlaps(slot('09:00', '10:00', undefined, 'a'), slot('09:00', '10:00', undefined, 'a'))).toBe(false)
  })
})
