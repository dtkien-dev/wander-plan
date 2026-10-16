import { formatCurrency } from './format'
import type { Expense, SettlementPayment, SplitMethod, TripPerson } from '../types'

export interface MemberBalance {
  userId: string
  amountVnd: number
}

export interface SettlementTransfer {
  fromUserId: string
  toUserId: string
  amountVnd: number
}

export const MAX_SHARE_UNITS = 1000

type SplitInput = Pick<Expense, 'participantUserIds' | 'paidByUserId' | 'splitMethod' | 'splitValues'>

/** Exact-amount splits must total the actual amount, or the estimate while no actual exists. */
export const splitTargetAmount = (expense: Pick<Expense, 'actualAmountVnd' | 'estimatedAmountVnd'>) => expense.actualAmountVnd ?? expense.estimatedAmountVnd

const sortedParticipants = (participantUserIds: string[]) => [...new Set(participantUserIds)].sort()

// Leftover đồng go one each, in the fixed participant order.
const spreadRemainder = (shares: MemberBalance[], remainder: number) =>
  shares.map((share, index) => ({ ...share, amountVnd: share.amountVnd + (index < remainder ? 1 : 0) }))

export const splitExpenseAmount = (amountVnd: number, expense: SplitInput): MemberBalance[] => {
  const participants = sortedParticipants(expense.participantUserIds)
  const method: SplitMethod = expense.splitMethod ?? 'equal'
  const values = expense.splitValues ?? {}
  if (method === 'amounts') return participants.map((userId) => ({ userId, amountVnd: values[userId] ?? 0 }))
  const units = participants.map((userId) => method === 'shares' ? values[userId] ?? 1 : 1)
  const totalUnits = units.reduce((sum, unit) => sum + unit, 0)
  const shares = participants.map((userId, index) => ({ userId, amountVnd: Math.floor(amountVnd * units[index] / totalUnits) }))
  const remainder = amountVnd - shares.reduce((sum, share) => sum + share.amountVnd, 0)
  // Customer rule: with shares, the payer absorbs the leftover when they take part.
  if (method === 'shares' && participants.includes(expense.paidByUserId)) {
    return shares.map((share) => share.userId === expense.paidByUserId ? { ...share, amountVnd: share.amountVnd + remainder } : share)
  }
  return spreadRemainder(shares, remainder)
}

/** A024: someone who left the trip paid for or took part in this expense, so its money is frozen. */
export const involvesFormerMember = (expense: Pick<Expense, 'paidByUserId' | 'participantUserIds'>, activeUserIds: ReadonlySet<string>) =>
  !activeUserIds.has(expense.paidByUserId) || expense.participantUserIds.some((userId) => !activeUserIds.has(userId))

/** Returns a Vietnamese error for an incomplete or mismatched split, or null when valid. */
export const validateSplit = (expense: SplitInput & Pick<Expense, 'actualAmountVnd' | 'estimatedAmountVnd'>) => {
  const method = expense.splitMethod ?? 'equal'
  if (method === 'equal') return null
  const values = sortedParticipants(expense.participantUserIds).map((userId) => expense.splitValues?.[userId] ?? Number.NaN)
  if (method === 'shares') {
    return values.every((value) => Number.isInteger(value) && value >= 1 && value <= MAX_SHARE_UNITS)
      ? null : `Nhập số phần từ 1 đến ${MAX_SHARE_UNITS} cho từng người tham gia.`
  }
  if (!values.every((value) => Number.isInteger(value) && value >= 0)) return 'Nhập số tiền (số nguyên không âm) cho từng người tham gia.'
  const difference = splitTargetAmount(expense) - values.reduce((sum, value) => sum + value, 0)
  if (difference === 0) return null
  return `Tổng tiền chia đang ${difference > 0 ? 'thiếu' : 'thừa'} ${formatCurrency(Math.abs(difference))} so với số tiền khoản chi. Hãy nhập lại phần chia.`
}

export const calculateExpenseSettlement = (expenses: Expense[], people: TripPerson[], payments: SettlementPayment[] = []) => {
  const activeUserIds = people.flatMap((person) => person.status === 'active' && person.userId ? [person.userId] : [])
  const balances = new Map(activeUserIds.map((userId) => [userId, 0]))

  expenses.forEach((expense) => {
    if (expense.actualAmountVnd === null || expense.participantUserIds.length === 0) return
    balances.set(expense.paidByUserId, (balances.get(expense.paidByUserId) ?? 0) + expense.actualAmountVnd)
    splitExpenseAmount(expense.actualAmountVnd, expense).forEach((share) => {
      balances.set(share.userId, (balances.get(share.userId) ?? 0) - share.amountVnd)
    })
  })
  // A recorded payment moves money from payer to recipient, settling that part of their balances.
  payments.forEach((payment) => {
    balances.set(payment.fromUserId, (balances.get(payment.fromUserId) ?? 0) + payment.amountVnd)
    balances.set(payment.toUserId, (balances.get(payment.toUserId) ?? 0) - payment.amountVnd)
  })

  const debtors = [...balances.entries()].filter(([, amount]) => amount < 0).map(([userId, amount]) => ({ userId, amount: -amount }))
  const creditors = [...balances.entries()].filter(([, amount]) => amount > 0).map(([userId, amount]) => ({ userId, amount }))
  const transfers: SettlementTransfer[] = []
  let debtorIndex = 0
  let creditorIndex = 0
  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex]
    const creditor = creditors[creditorIndex]
    const amountVnd = Math.min(debtor.amount, creditor.amount)
    if (amountVnd > 0) transfers.push({ fromUserId: debtor.userId, toUserId: creditor.userId, amountVnd })
    debtor.amount -= amountVnd
    creditor.amount -= amountVnd
    if (debtor.amount === 0) debtorIndex += 1
    if (creditor.amount === 0) creditorIndex += 1
  }

  return {
    balances: [...balances.entries()].map(([userId, amountVnd]): MemberBalance => ({ userId, amountVnd })),
    transfers,
  }
}
