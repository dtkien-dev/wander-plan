import type { WorkspaceData } from '../types'

const timestamp = (date: string) => {
  const value = Date.parse(`${date}T00:00:00Z`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(value) || new Date(value).toISOString().slice(0, 10) !== date || date < '0001-01-01') throw new Error('Chọn ngày hợp lệ.')
  return value
}

export const shiftPlanDate = (date: string, days: number) => {
  const result = new Date(timestamp(date) + days * 86_400_000).toISOString().slice(0, 10)
  timestamp(result)
  return result
}

export function previewTripPlan(source: WorkspaceData, startDate: string, shiftExpenses: boolean) {
  const offset = (timestamp(startDate) - timestamp(source.trip.startDate)) / 86_400_000
  const trip = { ...source.trip, startDate, endDate: shiftPlanDate(source.trip.endDate, offset) }
  const itinerary = source.itinerary.map((item) => ({ ...item, visitDate: shiftPlanDate(item.visitDate, offset), endDate: item.endDate ? shiftPlanDate(item.endDate, offset) : null }))
  const expenses = source.expenses.map((item) => shiftExpenses
    ? { ...item, expenseDate: shiftPlanDate(item.expenseDate, offset), endDate: item.endDate ? shiftPlanDate(item.endDate, offset) : null } : item)
  const conflictingExpenses = expenses.filter((item) => item.expenseDate < trip.startDate || (item.endDate ?? item.expenseDate) > trip.endDate)
  return { trip, itinerary, expenses, conflictingExpenses, offset }
}

export const planVersions = (items: { id: string; version: number }[]) => items.map(({ id, version }) => ({ id, version })).sort((a, b) => a.id.localeCompare(b.id))

export function checkDemoPlanSnapshot(current: WorkspaceData, source: WorkspaceData, content: 'expenses' | 'checklist') {
  if (current.trip.version !== source.trip.version || JSON.stringify(planVersions(current.itinerary)) !== JSON.stringify(planVersions(source.itinerary))
    || JSON.stringify(planVersions(current[content] ?? [])) !== JSON.stringify(planVersions(source[content] ?? []))) {
    throw new Error('Kế hoạch đã thay đổi. Đóng cửa sổ và xem trước lại.')
  }
}
