import type { Trip } from '../types'

export type TripReminder =
  | { status: 'upcoming'; daysUntilStart: number }
  | { status: 'ongoing'; dayNumber: number; totalDays: number }
  | { status: 'ended' }

const DAY_MS = 86_400_000

function parseDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) throw new RangeError(`Invalid calendar date: ${value}`)
  const [, year, month, day] = match
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)))
  if (date.toISOString().slice(0, 10) !== value) throw new RangeError(`Invalid calendar date: ${value}`)
  return date
}

function clockInTimezone(now: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now)
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  return { date: `${values.year}-${values.month}-${values.day}`, time: `${values.hour}:${values.minute}` }
}

const dateInTimezone = (now: Date, timezone: string) => clockInTimezone(now, timezone).date

/** The trip's local calendar date and HH:MM time, for "today" views. */
export const getTripClock = (trip: Pick<Trip, 'timezone'>, now = new Date()) => clockInTimezone(now, trip.timezone)

export function getTripReminder(trip: Pick<Trip, 'startDate' | 'endDate' | 'timezone'>, now = new Date()): TripReminder {
  const today = parseDate(dateInTimezone(now, trip.timezone))
  const start = parseDate(trip.startDate)
  const end = parseDate(trip.endDate)
  if (end < start) throw new RangeError('Trip end date must be on or after start date')
  if (today < start) return { status: 'upcoming', daysUntilStart: (start.getTime() - today.getTime()) / DAY_MS }
  if (today > end) return { status: 'ended' }
  return { status: 'ongoing', dayNumber: (today.getTime() - start.getTime()) / DAY_MS + 1, totalDays: (end.getTime() - start.getTime()) / DAY_MS + 1 }
}

function escapeText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,')
}

function foldLine(line: string) {
  const chunks: string[] = []
  let current = ''
  let bytes = 0
  for (const character of line) {
    const characterBytes = new TextEncoder().encode(character).length
    if (bytes + characterBytes > 75) {
      chunks.push(current)
      current = ` ${character}`
      bytes = 1 + characterBytes
    } else {
      current += character
      bytes += characterBytes
    }
  }
  chunks.push(current)
  return chunks.join('\r\n')
}

function nextDate(value: string) {
  return new Date(parseDate(value).getTime() + DAY_MS).toISOString().slice(0, 10).replace(/-/g, '')
}

export function createTripCalendarEvent(trip: Pick<Trip, 'id' | 'name' | 'destination' | 'startDate' | 'endDate'>) {
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Wander Plan//Trip Calendar//VI', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
    `UID:${escapeText(trip.id)}@wander-plan`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`,
    `DTSTART;VALUE=DATE:${parseDate(trip.startDate).toISOString().slice(0, 10).replace(/-/g, '')}`,
    `DTEND;VALUE=DATE:${nextDate(trip.endDate)}`,
    `SUMMARY:${escapeText(trip.name)}`, `DESCRIPTION:${escapeText(trip.destination)}`,
    'END:VEVENT', 'END:VCALENDAR',
  ]
  return `${lines.map(foldLine).join('\r\n')}\r\n`
}

export function downloadTripCalendarEvent(trip: Pick<Trip, 'id' | 'name' | 'destination' | 'startDate' | 'endDate'>) {
  const blob = new Blob([createTripCalendarEvent(trip)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'chuyen-di.ics'
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  // Let the browser start reading the download before releasing the URL.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
