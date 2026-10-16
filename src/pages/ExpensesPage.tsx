import { lazy, Suspense, useMemo, useRef, useState } from 'react'
import { Download, FileUp, Pencil, Plus, Trash2, WalletCards } from 'lucide-react'
import { ExpenseForm } from '../components/ExpenseForm'
import { Modal } from '../components/Modal'
import { SettlementPanel } from '../components/SettlementPanel'
import { StateView } from '../components/StateView'
import { actualOrEstimated, describeExpenseDates, formatCurrency, formatDate, safePercent, totalExpenses } from '../lib/format'
import { calculateExpenseSettlement, involvesFormerMember, type SettlementTransfer } from '../lib/expenseSettlement'
import { downloadTravelExcelReport } from '../lib/travelExcel'
import { useWorkspace, useWorkspaceMutations } from '../hooks/useWorkspace'
import type { Expense, ExpenseCategory, ExpenseDraft, SettlementPayment, SplitMethod, TripImportDraft } from '../types'
import styles from './ExpensesPage.module.css'

const splitPrefixes: Record<SplitMethod, string> = { equal: 'Chia cho', shares: 'Chia theo phần', amounts: 'Chia theo số tiền' }
const labels: Record<ExpenseCategory, string> = { food: 'Ăn uống', transport: 'Di chuyển', stay: 'Lưu trú', ticket: 'Vé tham quan', other: 'Khác' }

const ExcelImportModal = lazy(() => import('../components/ExcelImportModal').then((module) => ({ default: module.ExcelImportModal })))

export function ExpensesPage() {
  const workspace = useWorkspace()
  const mutations = useWorkspaceMutations()
  const [editing, setEditing] = useState<Expense | null | undefined>()
  const [feedback, setFeedback] = useState('')
  const [formError, setFormError] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const exportPending = useRef(false)
  const grouped = useMemo(() => {
    const result = new Map<ExpenseCategory, number>()
    workspace.data?.expenses.forEach((expense) => result.set(expense.category, (result.get(expense.category) ?? 0) + actualOrEstimated(expense)))
    return [...result.entries()].sort((a, b) => b[1] - a[1])
  }, [workspace.data])
  const daily = useMemo(() => {
    const result = new Map<string, number>()
    workspace.data?.expenses.forEach((expense) => result.set(expense.expenseDate, (result.get(expense.expenseDate) ?? 0) + actualOrEstimated(expense)))
    return [...result.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [workspace.data])
  if (workspace.isLoading) return <StateView state="loading" />
  if (workspace.isError) return <StateView state="error" onAction={() => void workspace.refetch()} />
  if (!workspace.data) return <StateView state="empty" title="Chưa có chuyến đang hoạt động" />
  const data = workspace.data
  const { trip, expenses, people, currentUserId } = data
  const total = totalExpenses(expenses)
  const activePeople = people.filter((person) => person.status === 'active' && person.userId)
  const peopleById = new Map(activePeople.map((person) => [person.userId!, person]))
  const activeUserIds = new Set(peopleById.keys())
  const payments = data.settlementPayments ?? []
  const settlement = calculateExpenseSettlement(expenses, people, payments)
  const formerById = new Map((data.formerPeople ?? []).map((person) => [person.userId, person.displayName]))
  const personName = (userId: string) => peopleById.get(userId)?.displayName ?? `${formerById.get(userId) ?? 'Thành viên cũ'} (đã rời nhóm)`
  const splitSummary = (expense: Expense) => {
    const method = expense.splitMethod ?? 'equal'
    const value = (userId: string) => {
      if (method === 'shares') return ` ×${expense.splitValues?.[userId] ?? 1}`
      return method === 'amounts' ? ` ${formatCurrency(expense.splitValues?.[userId] ?? 0)}` : ''
    }
    return `${splitPrefixes[method]} ${expense.participantUserIds.map((userId) => personName(userId) + value(userId)).join(', ')}`
  }

  const save = async (draft: ExpenseDraft) => {
    try {
      setFormError('')
      await mutations.expense.mutateAsync({ draft, tripId: trip.id, existing: editing ?? undefined })
      setEditing(undefined)
      setFeedback('Đã lưu chi phí.')
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Không thể lưu chi phí.')
    }
  }

  const remove = async (expense: Expense) => {
    if (!window.confirm(`Xóa “${expense.title}”?`)) return
    try {
      await mutations.deleteExpense.mutateAsync(expense)
      setFeedback('Đã xóa khoản chi.')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Không thể xóa khoản chi.')
    }
  }

  const confirmPayment = async (transfer: SettlementTransfer) => {
    if (!window.confirm(`Xác nhận bạn đã nhận ${formatCurrency(transfer.amountVnd)} từ ${personName(transfer.fromUserId)}?`)) return
    try {
      await mutations.recordPayment.mutateAsync({ tripId: trip.id, fromUserId: transfer.fromUserId, amountVnd: transfer.amountVnd, expectedCount: data.settlementPaymentCount ?? 0 })
      setFeedback('Đã ghi nhận thanh toán.')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Không thể ghi nhận thanh toán.')
    }
  }

  const undoPayment = async (payment: SettlementPayment) => {
    if (!window.confirm(`Hủy xác nhận đã nhận ${formatCurrency(payment.amountVnd)} từ ${personName(payment.fromUserId)}?`)) return
    try {
      await mutations.undoPayment.mutateAsync(payment)
      setFeedback('Đã hủy xác nhận thanh toán.')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Không thể hủy xác nhận thanh toán.')
    }
  }

  const importData = async (draft: TripImportDraft) => {
    const result = await mutations.importTripData.mutateAsync({ draft, tripId: trip.id })
    setImportOpen(false)
    setFeedback(`Đã tạo mới ${result.createdCount} và cập nhật ${result.updatedCount} dòng.`)
  }

  const exportData = async () => {
    if (exportPending.current) return
    exportPending.current = true
    try {
      setExporting(true)
      await downloadTravelExcelReport(data)
      setFeedback('Đã xuất báo cáo Excel của chuyến đi.')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Không thể xuất báo cáo Excel.')
    } finally {
      exportPending.current = false
      setExporting(false)
    }
  }

  return (
    <div className={styles.page} data-ai-id="expenses-page">
      <header className="section-header section-header--page"><div><p className="eyebrow">Đi đúng ngân sách</p><h1>Chi phí chuyến đi</h1><p>Ước tính trước, cập nhật thực tế sau — không cần chia bảng tính.</p></div><div className="section-header__actions"><button className="button button--ghost" type="button" onClick={() => setImportOpen(true)}><FileUp size={19} /> Nhập Excel</button><button className="button button--soft" type="button" disabled={exporting} onClick={() => void exportData()}><Download size={19} /> {exporting ? 'Đang xuất…' : 'Xuất Excel'}</button><button className="button button--primary" type="button" onClick={() => { setFormError(''); setEditing(null) }}><Plus size={19} /> Thêm chi phí</button></div></header>
      {feedback && <div className="feedback" role="status">{feedback}<button type="button" onClick={() => setFeedback('')}>Đóng</button></div>}
      <section className={styles.summary} data-ai-id="expense-summary">
        <article className={styles.total}><span><WalletCards size={28} /></span><p>Tổng đang tính</p><strong>{formatCurrency(total)}</strong><small>Còn {formatCurrency(Math.max(trip.budgetVnd - total, 0))} trong ngân sách</small></article>
        <div className={styles.categories}>{grouped.length ? grouped.map(([category, amount]) => <div key={category}><span>{labels[category]}</span><strong>{formatCurrency(amount)}</strong><div><i style={{ width: `${Math.max(safePercent(amount, total), amount > 0 ? 4 : 0)}%` }} /></div></div>) : <p>Chưa có phân bổ chi phí.</p>}</div>
      </section>
      {daily.length > 0 && <section className={styles.daily} aria-labelledby="daily-title"><header><p className="eyebrow">Theo từng ngày</p><h2 id="daily-title">Nhịp chi tiêu</h2></header><div>{daily.map(([date, amount]) => <article key={date}><time dateTime={date}>{formatDate(date)}</time><strong>{formatCurrency(amount)}</strong></article>)}</div></section>}
      <SettlementPanel balances={settlement.balances} transfers={settlement.transfers} payments={payments} currentUserId={currentUserId} pending={mutations.recordPayment.isPending || mutations.undoPayment.isPending} personName={personName} isFormer={(userId) => !activeUserIds.has(userId)} onConfirm={(transfer) => void confirmPayment(transfer)} onUndo={(payment) => void undoPayment(payment)} />
      {expenses.length === 0 ? <StateView state="empty" title="Chưa có khoản chi nào" message="Thêm khoản chi đầu tiên để theo dõi ngân sách và chia tiền cùng nhóm." actionLabel="Thêm khoản chi đầu tiên" onAction={() => { setFormError(''); setEditing(null) }} /> : (
        <section className={styles.list} aria-label="Danh sách chi phí">
          {expenses.map((expense) => <article className={styles.expense} key={expense.id}><span className={styles.category}>{labels[expense.category]}</span><div><h2>{expense.title}</h2><p>{describeExpenseDates(expense)} · {expense.notes || 'Không có ghi chú'}</p><p className={styles.splitMeta}>Trả bởi {personName(expense.paidByUserId)} · {splitSummary(expense)}</p></div><div className={styles.amount}><strong>{formatCurrency(actualOrEstimated(expense))}</strong><small>{expense.actualAmountVnd === null ? 'Dự kiến' : 'Thực tế'}</small></div><div className={styles.actions}><button className="icon-button" type="button" onClick={() => { setFormError(''); setEditing(expense) }} aria-label={`Sửa ${expense.title}`}><Pencil size={18} /></button>{involvesFormerMember(expense, activeUserIds)
            ? <button className="icon-button icon-button--danger" type="button" disabled title="Có người đã rời nhóm nên không thể xóa" aria-label={`Không thể xóa ${expense.title} vì có người đã rời nhóm`}><Trash2 size={18} /></button>
            : <button className="icon-button icon-button--danger" type="button" disabled={mutations.deleteExpense.isPending} onClick={() => void remove(expense)} aria-label={`Xóa ${expense.title}`}><Trash2 size={18} /></button>}</div></article>)}
        </section>
      )}
      <Modal open={editing !== undefined} title={editing ? 'Chỉnh sửa chi phí' : 'Thêm chi phí'} onClose={() => setEditing(undefined)}>
        {formError && <div className="form-error-banner" role="alert">{formError}</div>}
        <ExpenseForm expense={editing ?? undefined} tripStart={trip.startDate} tripEnd={trip.endDate} pending={mutations.expense.isPending} people={people} currentUserId={currentUserId} formerPeople={data.formerPeople} onSubmit={save} onCancel={() => setEditing(undefined)} />
      </Modal>
      {importOpen && <Suspense fallback={<StateView state="loading" />}><ExcelImportModal open={importOpen} trip={trip} itinerary={data.itinerary} expenses={expenses} people={people} pending={mutations.importTripData.isPending} onClose={() => setImportOpen(false)} onSubmit={importData} /></Suspense>}
    </div>
  )
}
