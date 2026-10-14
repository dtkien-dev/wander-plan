import { lazy, Suspense, useMemo, useRef, useState } from 'react'
import { ArrowRight, Download, FileUp, HandCoins, Pencil, Plus, Trash2, WalletCards } from 'lucide-react'
import { ExpenseForm } from '../components/ExpenseForm'
import { Modal } from '../components/Modal'
import { StateView } from '../components/StateView'
import { actualOrEstimated, formatCurrency, formatDate, safePercent, totalExpenses } from '../lib/format'
import { calculateExpenseSettlement } from '../lib/expenseSettlement'
import { downloadTravelExcelReport } from '../lib/travelExcel'
import { useWorkspace, useWorkspaceMutations } from '../hooks/useWorkspace'
import type { Expense, ExpenseCategory, ExpenseDraft, TripImportDraft } from '../types'
import styles from './ExpensesPage.module.css'

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
  if (!workspace.data) return <StateView state="empty" title="Chưa có chuyến đi" />
  const data = workspace.data
  const { trip, expenses, people, currentUserId } = data
  const total = totalExpenses(expenses)
  const activePeople = people.filter((person) => person.status === 'active' && person.userId)
  const peopleById = new Map(activePeople.map((person) => [person.userId!, person]))
  const settlement = calculateExpenseSettlement(expenses, people)
  const personName = (userId: string) => peopleById.get(userId)?.displayName ?? 'Thành viên cũ'

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
      <section className={styles.settlement} aria-labelledby="settlement-title">
        <header><span><HandCoins size={22} /></span><div><p className="eyebrow">Quyết toán thực tế</p><h2 id="settlement-title">Ai cần trả cho ai?</h2></div></header>
        <div className={styles.balances}>{settlement.balances.map((balance) => <div key={balance.userId}><span>{personName(balance.userId)}</span><strong className={balance.amountVnd >= 0 ? styles.credit : styles.debt}>{balance.amountVnd >= 0 ? `Nhận ${formatCurrency(balance.amountVnd)}` : `Trả ${formatCurrency(-balance.amountVnd)}`}</strong></div>)}</div>
        <div className={styles.transfers}>{settlement.transfers.length ? settlement.transfers.map((transfer) => <article key={`${transfer.fromUserId}-${transfer.toUserId}`}><strong>{personName(transfer.fromUserId)}</strong><ArrowRight size={18} /><strong>{personName(transfer.toUserId)}</strong><span>{formatCurrency(transfer.amountVnd)}</span></article>) : <p>Chưa có khoản thực tế cần quyết toán.</p>}</div>
      </section>
      {expenses.length === 0 ? <StateView state="empty" title="Chưa có khoản chi nào" actionLabel="Thêm khoản chi đầu tiên" onAction={() => { setFormError(''); setEditing(null) }} /> : (
        <section className={styles.list} aria-label="Danh sách chi phí">
          {expenses.map((expense) => <article className={styles.expense} key={expense.id}><span className={styles.category}>{labels[expense.category]}</span><div><h2>{expense.title}</h2><p>{formatDate(expense.expenseDate)} · {expense.notes || 'Không có ghi chú'}</p><p className={styles.splitMeta}>Trả bởi {personName(expense.paidByUserId)} · Chia cho {expense.participantUserIds.map(personName).join(', ')}</p></div><div className={styles.amount}><strong>{formatCurrency(actualOrEstimated(expense))}</strong><small>{expense.actualAmountVnd === null ? 'Dự kiến' : 'Thực tế'}</small></div><div className={styles.actions}><button className="icon-button" type="button" onClick={() => { setFormError(''); setEditing(expense) }} aria-label={`Sửa ${expense.title}`}><Pencil size={18} /></button><button className="icon-button icon-button--danger" type="button" disabled={mutations.deleteExpense.isPending} onClick={() => void remove(expense)} aria-label={`Xóa ${expense.title}`}><Trash2 size={18} /></button></div></article>)}
        </section>
      )}
      <Modal open={editing !== undefined} title={editing ? 'Chỉnh sửa chi phí' : 'Thêm chi phí'} onClose={() => setEditing(undefined)}>
        {formError && <div className="form-error-banner" role="alert">{formError}</div>}
        <ExpenseForm expense={editing ?? undefined} tripStart={trip.startDate} tripEnd={trip.endDate} pending={mutations.expense.isPending} people={people} currentUserId={currentUserId} onSubmit={save} onCancel={() => setEditing(undefined)} />
      </Modal>
      {importOpen && <Suspense fallback={<StateView state="loading" />}><ExcelImportModal open={importOpen} trip={trip} itinerary={data.itinerary} expenses={expenses} people={people} pending={mutations.importTripData.isPending} onClose={() => setImportOpen(false)} onSubmit={importData} /></Suspense>}
    </div>
  )
}
