import { describe, expect, it } from 'vitest'
import { createTripCalendarEvent, getTripReminder } from './tripReminder'

const trip = {
  id: 'trip-1', name: 'Đi Đà Lạt', destination: 'Đà Lạt',
  startDate: '2026-10-15', endDate: '2026-10-17', timezone: 'Asia/Ho_Chi_Minh',
}

describe('trip reminders', () => {
  it('counts calendar dates in the trip timezone around UTC midnight', () => {
    const beforeLocalMidnight = new Date('2026-10-14T16:59:00.000Z')
    const afterLocalMidnight = new Date('2026-10-14T17:01:00.000Z')
    expect(getTripReminder(trip, beforeLocalMidnight)).toEqual({ status: 'upcoming', daysUntilStart: 1 })
    expect(getTripReminder(trip, afterLocalMidnight)).toEqual({ status: 'ongoing', dayNumber: 1, totalDays: 3 })
    expect(getTripReminder(trip, new Date('2026-10-15T00:00:00.000Z'))).toEqual({ status: 'ongoing', dayNumber: 1, totalDays: 3 })
    expect(getTripReminder(trip, new Date('2026-10-17T16:59:00.000Z'))).toEqual({ status: 'ongoing', dayNumber: 3, totalDays: 3 })
    expect(getTripReminder(trip, new Date('2026-10-18T00:00:00.000Z'))).toEqual({ status: 'ended' })
  })

  it.each([
    ['2026-01-31', '2026-02-01'],
    ['2026-12-31', '2027-01-01'],
    ['2024-02-28', '2024-02-29'],
    ['2024-02-29', '2024-03-01'],
  ])('sets the exclusive all-day end after %s to %s', (endDate, expectedExclusiveEnd) => {
    const event = createTripCalendarEvent({ ...trip, startDate: endDate, endDate })
    expect(event).toContain(`DTEND;VALUE=DATE:${expectedExclusiveEnd.replace(/-/g, '')}`)
  })

  it('escapes calendar text and folds UTF-8 lines at 75 octets', () => {
    const longTrip = { ...trip, name: `Tên, chuyến; đi\\\n${'Đà Lạt '.repeat(20)}` }
    const event = createTripCalendarEvent(longTrip)
    const physicalLines = event.split('\r\n').filter(Boolean)
    expect(event).toContain('SUMMARY:Tên\\, chuyến\\; đi\\\\\\n')
    expect(physicalLines.every((line) => new TextEncoder().encode(line).length <= 75)).toBe(true)
    const unfolded = event.replace(/\r\n[ \t]/g, '')
    expect(() => new TextDecoder('utf-8', { fatal: true }).decode(new TextEncoder().encode(unfolded))).not.toThrow()
    expect(unfolded).toContain(`SUMMARY:${'Tên\\, chuyến\\; đi\\\\\\n'}${'Đà Lạt '.repeat(20)}`)
    expect(event.endsWith('\r\n')).toBe(true)
  })
})
