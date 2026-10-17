import type { ItineraryItem } from '../types'

type Slot = Pick<ItineraryItem, 'visitDate' | 'startTime' | 'endTime'> & { id?: string }

// Same date and intersecting [start, end) ranges; "HH:MM" strings compare correctly as text.
// An incomplete or inverted draft range never warns (the form already reports it).
export const overlaps = (a: Slot, b: Slot) =>
  a.id !== b.id && a.startTime !== '' && a.startTime < a.endTime && a.visitDate === b.visitDate && a.startTime < b.endTime && b.startTime < a.endTime

export const findOverlaps = <T extends Slot>(slot: Slot, items: T[]) => items.filter((item) => overlaps(slot, item))
