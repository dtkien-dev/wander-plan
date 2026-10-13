import type { Expense, TripPerson } from '../types'

export interface MemberBalance {
  userId: string
  amountVnd: number
}

export interface SettlementTransfer {
  fromUserId: string
  toUserId: string
  amountVnd: number
}

const splitEvenly = (amountVnd: number, participantUserIds: string[]) => {
  const participants = [...new Set(participantUserIds)].sort()
  const baseShare = Math.floor(amountVnd / participants.length)
  const remainder = amountVnd % participants.length
  return participants.map((userId, index) => ({ userId, amountVnd: baseShare + (index < remainder ? 1 : 0) }))
}

export const calculateExpenseSettlement = (expenses: Expense[], people: TripPerson[]) => {
  const activeUserIds = people.flatMap((person) => person.status === 'active' && person.userId ? [person.userId] : [])
  const balances = new Map(activeUserIds.map((userId) => [userId, 0]))

  expenses.forEach((expense) => {
    if (expense.actualAmountVnd === null || expense.participantUserIds.length === 0) return
    balances.set(expense.paidByUserId, (balances.get(expense.paidByUserId) ?? 0) + expense.actualAmountVnd)
    splitEvenly(expense.actualAmountVnd, expense.participantUserIds).forEach((share) => {
      balances.set(share.userId, (balances.get(share.userId) ?? 0) - share.amountVnd)
    })
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
