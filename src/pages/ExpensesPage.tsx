import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2, WalletCards } from 'lucide-react'
import { ExpenseForm } from '../components/ExpenseForm'
import { Modal } from '../components/Modal'
import { StateView } from '../components/StateView'
import { actualOrEstimated, formatCurrency, formatDate, totalExpenses } from '../lib/format'
import { useWorkspace, useWorkspaceMutations } from '../hooks/useWorkspace'
import type { Expense, ExpenseCategory, ExpenseDraft } from '../types'
import styles from './ExpensesPage.module.css'

const labels: Record<ExpenseCategory, string> = { food: 'Ăn uống', transport: 'Di chuyển', stay: 'Lưu trú', ticket: 'Vé tham quan', other: 'Khác' }

export function ExpensesPage() {
  const workspace = useWorkspace()
  const mutations = useWorkspaceMutations()
  const [editing, setEditing] = useState<Expense | null | undefined>()
  const [feedback, setFeedback] = useState('')
  const grouped = useMemo(() => {
    const result = new Map<ExpenseCategory, number>()
    workspace.data?.expenses.forEach((expense) => result.set(expense.category, (result.get(expense.category) ?? 0) + actualOrEstimated(expense)))
    return [...result.entries()].sort((a, b) => b[1] - a[1])
  }, [workspace.data])
  if (workspace.isLoading) return <StateView state="loading" />
  if (workspace.isError) return <StateView state="error" onAction={() => void workspace.refetch()} />
  if (!workspace.data) return <StateView state="empty" title="Chưa có chuyến đi" />
  const { trip, expenses } = workspace.data
  const total = totalExpenses(expenses)

  const save = async (draft: ExpenseDraft) => {
    try {
      await mutations.expense.mutateAsync({ draft, existing: editing ?? undefined })
      setEditing(undefined)
      setFeedback('Đã lưu chi phí.')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Không thể lưu chi phí.')
    }
  }

  return (
    <div className={styles.page} data-ai-id="expenses-page">
      <header className="section-header section-header--page"><div><p className="eyebrow">Đi đúng ngân sách</p><h1>Chi phí chuyến đi</h1><p>Ước tính trước, cập nhật thực tế sau — không cần chia bảng tính.</p></div><button className="button button--primary" type="button" onClick={() => setEditing(null)}><Plus size={19} /> Thêm chi phí</button></header>
      {feedback && <div className="feedback" role="status">{feedback}<button type="button" onClick={() => setFeedback('')}>Đóng</button></div>}
      <section className={styles.summary} data-ai-id="expense-summary">
        <article className={styles.total}><span><WalletCards size={28} /></span><p>Tổng đang tính</p><strong>{formatCurrency(total)}</strong><small>Còn {formatCurrency(Math.max(trip.budgetVnd - total, 0))} trong ngân sách</small></article>
        <div className={styles.categories}>{grouped.length ? grouped.map(([category, amount]) => <div key={category}><span>{labels[category]}</span><strong>{formatCurrency(amount)}</strong><div><i style={{ width: `${Math.max((amount / total) * 100, 4)}%` }} /></div></div>) : <p>Chưa có phân bổ chi phí.</p>}</div>
      </section>
      {expenses.length === 0 ? <StateView state="empty" title="Chưa có khoản chi nào" actionLabel="Thêm khoản chi đầu tiên" onAction={() => setEditing(null)} /> : (
        <section className={styles.list} aria-label="Danh sách chi phí">
          {expenses.map((expense) => <article className={styles.expense} key={expense.id}><span className={styles.category}>{labels[expense.category]}</span><div><h2>{expense.title}</h2><p>{formatDate(expense.expenseDate)} · {expense.notes || 'Không có ghi chú'}</p></div><div className={styles.amount}><strong>{formatCurrency(actualOrEstimated(expense))}</strong><small>{expense.actualAmountVnd === null ? 'Dự kiến' : 'Thực tế'}</small></div><div className={styles.actions}><button className="icon-button" type="button" onClick={() => setEditing(expense)} aria-label={`Sửa ${expense.title}`}><Pencil size={18} /></button><button className="icon-button icon-button--danger" type="button" onClick={() => window.confirm(`Xóa “${expense.title}”?`) && void mutations.deleteExpense.mutateAsync(expense)} aria-label={`Xóa ${expense.title}`}><Trash2 size={18} /></button></div></article>)}
        </section>
      )}
      <Modal open={editing !== undefined} title={editing ? 'Chỉnh sửa chi phí' : 'Thêm chi phí'} onClose={() => setEditing(undefined)}>
        <ExpenseForm expense={editing ?? undefined} tripStart={trip.startDate} tripEnd={trip.endDate} pending={mutations.expense.isPending} onSubmit={save} onCancel={() => setEditing(undefined)} />
      </Modal>
    </div>
  )
}
