import type { ItineraryItem } from '../types'

type Slot = Pick<ItineraryItem, 'visitDate' | 'startTime' | 'endTime'> & { id?: string, endDate?: string | null }

// Start time belongs to the first day and end time to the last day (endDate, else visitDate).
// "YYYY-MM-DDTHH:MM" strings compare correctly as text.
const interval = (slot: Slot) => [`${slot.visitDate}T${slot.startTime}`, `${slot.endDate || slot.visitDate}T${slot.endTime}`]

// Intersecting [start, end) intervals; an incomplete or inverted draft never warns (the form already reports it).
export const overlaps = (a: Slot, b: Slot) => {
  if (a.id === b.id || !a.visitDate || !a.startTime || !a.endTime) return false
  const [aStart, aEnd] = interval(a)
  const [bStart, bEnd] = interval(b)
  return aStart < aEnd && aStart < bEnd && bStart < aEnd
}

export const findOverlaps = <T extends Slot>(slot: Slot, items: T[]) => items.filter((item) => overlaps(slot, item))
