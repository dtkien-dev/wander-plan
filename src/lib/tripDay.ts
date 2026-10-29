import type { Expense, ItineraryItem } from '../types'

export type BoardStatus = 'done' | 'now' | 'next'

/** Activities shown on `day`, including multi-day ones that span it, in start order. */
export const itemsOnDay = <T extends Pick<ItineraryItem, 'visitDate' | 'endDate' | 'startTime'>>(itinerary: T[], day: string) =>
  itinerary.filter((item) => item.visitDate <= day && day <= (item.endDate || item.visitDate))
    .sort((a, b) => `${a.visitDate}T${a.startTime}`.localeCompare(`${b.visitDate}T${b.startTime}`))

// Same [start, end) convention as itineraryOverlap: start on the first day, end on the last.
export const boardStatus = (item: Pick<ItineraryItem, 'visitDate' | 'endDate' | 'startTime' | 'endTime'>, nowStamp: string): BoardStatus => {
  if (nowStamp >= `${item.endDate || item.visitDate}T${item.endTime}`) return 'done'
  return nowStamp >= `${item.visitDate}T${item.startTime}` ? 'now' : 'next'
}

/** splitTotals per key, e.g. per category or per start date. */
export const groupTotals = <K,>(expenses: Expense[], keyOf: (expense: Expense) => K) => {
  const groups = new Map<K, Expense[]>()
  expenses.forEach((expense) => {
    const key = keyOf(expense)
    groups.set(key, [...groups.get(key) ?? [], expense])
  })
  return new Map([...groups].map(([key, items]) => [key, splitTotals(items)]))
}

/** Actual money spent and the estimate-only remainder, never mixed. */
export const splitTotals = (expenses: Expense[]) => expenses.reduce((totals, expense) => {
  if (expense.actualAmountVnd === null) totals.estimateOnly += expense.estimatedAmountVnd
  else totals.actual += expense.actualAmountVnd
  return totals
}, { actual: 0, estimateOnly: 0 })
