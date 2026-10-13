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

export const formatDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number)
  return dateFormatter.format(new Date(year, month - 1, day))
}

export const actualOrEstimated = (expense: Expense) =>
  expense.actualAmountVnd ?? expense.estimatedAmountVnd

export const totalExpenses = (expenses: Expense[]) =>
  expenses.reduce((total, expense) => total + actualOrEstimated(expense), 0)

export const isGoogleMapsUrl = (value: string) => {
  if (!value) return true
  try {
    const url = new URL(value)
    return ['google.com', 'www.google.com', 'maps.google.com', 'maps.app.goo.gl'].includes(url.hostname)
  } catch {
    return false
  }
}
