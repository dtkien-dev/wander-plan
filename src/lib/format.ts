import type { Expense } from '../types'

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
})

export const formatCurrency = (value: number) => currencyFormatter.format(value)

const dateParts = (value: string): [number, number, number] => {
  const [year, month, day] = value.split('-').map(Number)
  return [year, month - 1, day]
}

export const formatDate = (value: string) => dateFormatter.format(new Date(...dateParts(value)))

const formatDayMonth = (value: string) => `${value.slice(8, 10)}/${value.slice(5, 7)}`

export const countNights = (checkIn: string, checkOut: string) =>
  Math.round((Date.UTC(...dateParts(checkOut)) - Date.UTC(...dateParts(checkIn))) / 86_400_000)

// Ranged expenses still count on their start date; the range is descriptive.
export const describeExpenseDates = (expense: Pick<Expense, 'category' | 'expenseDate' | 'endDate'>) => {
  if (!expense.endDate) return formatDate(expense.expenseDate)
  const range = `${formatDayMonth(expense.expenseDate)} → ${formatDayMonth(expense.endDate)}`
  return expense.category === 'stay' ? `${range} · ${countNights(expense.expenseDate, expense.endDate)} đêm` : `${range} · Khứ hồi`
}

export const actualOrEstimated = (expense: Expense) =>
  expense.actualAmountVnd ?? expense.estimatedAmountVnd

export const totalExpenses = (expenses: Expense[]) =>
  expenses.reduce((total, expense) => total + actualOrEstimated(expense), 0)

export const safePercent = (value: number, total: number) => {
  if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) return 0
  return Math.min(Math.max((value / total) * 100, 0), 100)
}

export const isGoogleMapsUrl = (value: string) => {
  if (!value) return true
  try {
    const url = new URL(value)
    return ['google.com', 'www.google.com', 'maps.google.com', 'maps.app.goo.gl'].includes(url.hostname)
  } catch {
    return false
  }
}
