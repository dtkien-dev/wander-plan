import { lazy, Suspense, useMemo, useRef, useState } from 'react'
import { Download, FileUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { ActionsMenu } from '../components/ActionsMenu'
import { ExpenseForm } from '../components/ExpenseForm'
import { Modal } from '../components/Modal'
import { SettlementPanel } from '../components/SettlementPanel'
import { StateView } from '../components/StateView'
import { actualOrEstimated, describeExpenseDates, formatCurrency, formatDate, safePercent } from '../lib/format'
import { groupTotals, splitTotals } from '../lib/tripDay'
import { calculateExpenseSettlement, involvesFormerMember, type SettlementTransfer } from '../lib/expenseSettlement'
import { downloadTravelExcelReport } from '../lib/travelExcel'
import { useNotify } from '../providers/NotificationProvider'
import { useWorkspace } from '../hooks/useWorkspace'
import { useWorkspaceMutations } from '../hooks/useWorkspaceMutations'
import type { Expense, ExpenseCategory, ExpenseDraft, SettlementPayment, SplitMethod, TrashedExpense, TripImportDraft } from '../types'
import styles from './ExpensesPage.module.css'

const splitPrefixes: Record<SplitMethod, string> = { equal: 'Chia cho', shares: 'Chia theo phần', amounts: 'Chia theo số tiền' }
const labels: Record<ExpenseCategory, string> = { food: 'Ăn uống', transport: 'Di chuyển', stay: 'Lưu trú', ticket: 'Vé tham quan', other: 'Khác' }

const ExcelImportModal = lazy(() => import('../components/ExcelImportModal').then((module) => ({ default: module.ExcelImportModal })))

export function ExpensesPage() {
  const workspace = useWorkspace()
  const mutations = useWorkspaceMutations()
  const [editing, setEditing] = useState<Expense | null | undefined>()
  const notify = useNotify()
  const [formError, setFormError] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState<Expense | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [showTrash, setShowTrash] = useState(false)
  const [trashError, setTrashError] = useState('')
  const [exporting, setExporting] = useState(false)
  const exportPending = useRef(false)
  const [paymentAction, setPaymentAction] = useState<{ kind: 'confirm'; transfer: SettlementTransfer } | { kind: 'undo'; payment: SettlementPayment } | null>(null)
  const [paymentError, setPaymentError] = useState('')
  // Aggregates keep actual and estimate-only money apart, like the totals.
  const grouped = useMemo(() => [...groupTotals(workspace.data?.expenses ?? [], (expense) => expense.category).entries()]
    .sort((a, b) => (b[1].actual + b[1].estimateOnly) - (a[1].actual + a[1].estimateOnly)), [workspace.data])
  const daily = useMemo(() => [...groupTotals(workspace.data?.expenses ?? [], (expense) => expense.expenseDate).entries()]
    .sort(([a], [b]) => a.localeCompare(b)), [workspace.data])
  if (workspace.isLoading) return <StateView state="loading" />
  if (workspace.isError) return <StateView state="error" onAction={() => void workspace.refetch()} />
  if (!workspace.data) return <StateView state="empty" title="Chưa có chuyến đang hoạt động" />
  const data = workspace.data
  const { trip, expenses, people, currentUserId } = data
  const totals = splitTotals(expenses)
  const total = totals.actual + totals.estimateOnly
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
      notify.success('Đã lưu chi phí.')
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Không thể lưu chi phí.')
    }
  }

  const trash = (data.expenseTrash ?? []).filter((item) => Date.parse(item.expiresAt) > Date.now())

  const remove = async (expense: Expense) => {
    try {
      setDeleteError('')
      await mutations.deleteExpense.mutateAsync(expense)
      setConfirmingDelete(null)
      notify.success('Đã chuyển khoản chi vào thùng rác trong 7 ngày.')
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Không thể xóa khoản chi.')
    }
  }

  const restore = async (item: TrashedExpense) => {
    try {
      setTrashError('')
      await mutations.restoreExpense.mutateAsync(item)
      notify.success('Đã khôi phục khoản chi.')
    } catch (error) {
      setTrashError(error instanceof Error ? error.message : 'Chưa thể khôi phục khoản chi.')
    }
  }

  const paymentPending = mutations.recordPayment.isPending || mutations.undoPayment.isPending
  const runPaymentAction = async () => {
    if (!paymentAction) return
    try {
      setPaymentError('')
      if (paymentAction.kind === 'confirm') {
        const { transfer } = paymentAction
        await mutations.recordPayment.mutateAsync({ tripId: trip.id, fromUserId: transfer.fromUserId, amountVnd: transfer.amountVnd, expectedCount: data.settlementPaymentCount ?? 0 })
        notify.success('Đã ghi nhận thanh toán.')
      } else {
        await mutations.undoPayment.mutateAsync(paymentAction.payment)
        notify.success('Đã hủy xác nhận thanh toán.')
      }
      setPaymentAction(null)
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : paymentAction.kind === 'confirm' ? 'Không thể ghi nhận thanh toán.' : 'Không thể hủy xác nhận thanh toán.')
    }
  }
  const paymentSubject = paymentAction?.kind === 'confirm' ? paymentAction.transfer : paymentAction?.payment

  const importData = async (draft: TripImportDraft) => {
    const result = await mutations.importTripData.mutateAsync({ draft, tripId: trip.id })
    setImportOpen(false)
    notify.success(`Đã tạo mới ${result.createdCount} và cập nhật ${result.updatedCount} dòng.`)
  }

  const exportData = async () => {
    if (exportPending.current) return
    exportPending.current = true
    try {
      setExporting(true)
      await downloadTravelExcelReport(data)
      notify.success('Đã xuất báo cáo Excel của chuyến đi.')
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Không thể xuất báo cáo Excel.')
    } finally {
      exportPending.current = false
      setExporting(false)
    }
  }

  return (
    <div className={styles.page} data-ai-id="expenses-page">
      <header className="section-header section-header--page">
        <div><h1>Chi phí</h1><p>Ghi dự kiến trước, cập nhật thực tế khi đã chi; quyết toán chỉ dùng số thực tế.</p></div>
        <div className="section-header__actions">
          <button className="button button--primary" type="button" onClick={() => { setFormError(''); setEditing(null) }}><Plus size={18} aria-hidden="true" /> Thêm chi phí</button>
          <ActionsMenu>
              <button type="button" onClick={() => setImportOpen(true)}><FileUp size={18} aria-hidden="true" /> Nhập Excel</button>
              <button type="button" disabled={exporting} onClick={() => void exportData()}><Download size={18} aria-hidden="true" /> {exporting ? 'Đang xuất…' : 'Xuất Excel'}</button>
              <button type="button" onClick={() => { setTrashError(''); setShowTrash(true) }}><Trash2 size={18} aria-hidden="true" /> Thùng rác ({trash.length})</button>
          </ActionsMenu>
        </div>
      </header>
      <section className={styles.summary} data-ai-id="expense-summary">
        <dl className={styles.total}>
          <div><dt>Thực tế đã chi</dt><dd>{formatCurrency(totals.actual)}</dd></div>
          <div><dt>Dự kiến thêm</dt><dd>{formatCurrency(totals.estimateOnly)}</dd></div>
          <div><dt>{trip.budgetVnd >= total ? 'Còn trong ngân sách' : 'Vượt ngân sách'}</dt><dd className={trip.budgetVnd >= total ? '' : 'amount-owe'}>{formatCurrency(Math.abs(trip.budgetVnd - total))}</dd></div>
          <p>Ngân sách {formatCurrency(trip.budgetVnd)} · đã dự trù {Math.round(safePercent(total, trip.budgetVnd))}%</p>
        </dl>
        <div className={styles.categories}>{grouped.length ? grouped.map(([category, amount]) => <div key={category}><span>{labels[category]}</span><strong>{formatCurrency(amount.actual)}{amount.estimateOnly > 0 && <small> + dự kiến {formatCurrency(amount.estimateOnly)}</small>}</strong><div><i style={{ width: `${safePercent(amount.actual, total)}%` }} /><i className={styles.estimateBar} style={{ width: `${safePercent(amount.estimateOnly, total)}%` }} /></div></div>) : <p>Chưa có phân bổ chi phí.</p>}</div>
      </section>
      {daily.length > 0 && <section className={styles.daily} aria-labelledby="daily-title"><header><h2 id="daily-title">Chi theo ngày</h2><p>Lưu trú và khứ hồi tính vào ngày bắt đầu.</p></header><ol>{daily.map(([date, amount]) => <li key={date}><time dateTime={date}>{formatDate(date)}</time><strong>{formatCurrency(amount.actual)}</strong>{amount.estimateOnly > 0 && <small>+ dự kiến {formatCurrency(amount.estimateOnly)}</small>}</li>)}</ol></section>}
      <SettlementPanel balances={settlement.balances} transfers={settlement.transfers} payments={payments} currentUserId={currentUserId} pending={mutations.recordPayment.isPending || mutations.undoPayment.isPending} personName={personName} isFormer={(userId) => !activeUserIds.has(userId)} onConfirm={(transfer) => { setPaymentError(''); setPaymentAction({ kind: 'confirm', transfer }) }} onUndo={(payment) => { setPaymentError(''); setPaymentAction({ kind: 'undo', payment }) }} />
      {expenses.length === 0 ? <StateView state="empty" title="Chưa có khoản chi nào" message="Thêm khoản chi đầu tiên để theo dõi ngân sách và chia tiền cùng nhóm." actionLabel="Thêm khoản chi đầu tiên" onAction={() => { setFormError(''); setEditing(null) }} /> : (
        <section className={styles.list} aria-label="Danh sách chi phí">
          {expenses.map((expense) => <article className={styles.expense} key={expense.id}><span className={styles.category}>{labels[expense.category]}</span><div><h2>{expense.title}</h2><p>{describeExpenseDates(expense)} · {expense.notes || 'Không có ghi chú'}</p><p className={styles.splitMeta}>Trả bởi {personName(expense.paidByUserId)} · {splitSummary(expense)}</p></div><div className={`${styles.amount} ${expense.actualAmountVnd === null ? styles.amountEstimate : ''}`}><strong>{formatCurrency(actualOrEstimated(expense))}</strong>{expense.actualAmountVnd === null ? <span className="status-tag status-tag--estimate">Dự kiến · chưa quyết toán</span> : <small>Thực tế</small>}</div><div className={styles.actions}><button className="icon-button" type="button" onClick={() => { setFormError(''); setEditing(expense) }} aria-label={`Sửa ${expense.title}`}><Pencil size={18} /></button>{involvesFormerMember(expense, activeUserIds)
            ? <button className="icon-button icon-button--danger" type="button" disabled title="Có người đã rời nhóm nên không thể xóa" aria-label={`Không thể xóa ${expense.title} vì có người đã rời nhóm`}><Trash2 size={18} /></button>
            : <button className="icon-button icon-button--danger" type="button" disabled={mutations.deleteExpense.isPending} onClick={() => { setDeleteError(''); setConfirmingDelete(expense) }} aria-label={`Xóa ${expense.title}`}><Trash2 size={18} /></button>}</div></article>)}
        </section>
      )}
      <Modal open={paymentAction !== null} title={paymentAction?.kind === 'confirm' ? 'Xác nhận đã nhận tiền?' : 'Hủy xác nhận đã nhận?'} onClose={() => { if (!paymentPending) setPaymentAction(null) }}>
        {paymentSubject && <p className={styles.paymentSentence}><strong>{personName(paymentSubject.fromUserId)}</strong> {paymentAction?.kind === 'confirm' ? 'đã trả bạn' : 'trả bạn'} <strong className="amount-receive">{formatCurrency(paymentSubject.amountVnd)}</strong></p>}
        <p>{paymentAction?.kind === 'confirm' ? 'Chỉ xác nhận khi tiền đã thực sự đến. Số dư của cả nhóm sẽ tính lại ngay.' : 'Khoản này sẽ quay lại danh sách cần quyết toán.'}</p>
        {paymentError && <p className="form-error-banner" role="alert">{paymentError}</p>}
        <div className="form__actions"><button className="button button--ghost" type="button" disabled={paymentPending} onClick={() => setPaymentAction(null)}>Hủy</button><button className="button button--primary" type="button" disabled={paymentPending} onClick={() => void runPaymentAction()}>{paymentPending ? 'Đang lưu…' : paymentAction?.kind === 'confirm' ? 'Đã nhận tiền' : 'Hủy xác nhận'}</button></div>
      </Modal>
      <Modal open={confirmingDelete !== null} title="Xóa khoản chi?" onClose={() => { if (!mutations.deleteExpense.isPending) setConfirmingDelete(null) }}>
        <p>“{confirmingDelete?.title}” sẽ được chuyển vào thùng rác. Bạn hoặc chủ nhóm có thể khôi phục trong 7 ngày; số dư được tính lại ngay.</p>
        {deleteError && <p className="form-error-banner" role="alert">{deleteError}</p>}
        <div className="form__actions"><button className="button button--ghost" type="button" disabled={mutations.deleteExpense.isPending} onClick={() => setConfirmingDelete(null)}>Hủy</button><button className="button button--danger" type="button" disabled={mutations.deleteExpense.isPending} onClick={() => confirmingDelete && void remove(confirmingDelete)}>{mutations.deleteExpense.isPending ? 'Đang xóa…' : 'Xóa khoản chi'}</button></div>
      </Modal>
      {showTrash && <Modal open title="Thùng rác chi phí" onClose={() => { if (!mutations.restoreExpense.isPending) setShowTrash(false) }}>
        <p>Khoản chi đã xóa được giữ 7 ngày rồi tự dọn. {data.currentRole === 'owner' ? 'Chủ nhóm thấy mọi khoản đã xóa.' : 'Bạn thấy các khoản do chính bạn xóa.'} Không khôi phục được nếu người trả hoặc người tham gia đã rời nhóm.</p>
        {trashError && <p className="form-error-banner" role="alert">{trashError}</p>}
        {trash.length === 0 ? <p>Thùng rác đang trống.</p> : <ul className={styles.trash}>{trash.map((item) => <li key={item.id}>
          <div><strong>{item.title}</strong><p>{describeExpenseDates(item)} · {formatCurrency(actualOrEstimated(item))} {item.actualAmountVnd === null ? '(Dự kiến)' : '(Thực tế)'}</p><small>Xóa bởi {personName(item.deletedByUserId)} · khôi phục trước {new Date(item.expiresAt).toLocaleString('vi-VN')}</small></div>
          <button className="button button--soft" type="button" disabled={mutations.restoreExpense.isPending} aria-label={`Khôi phục ${item.title}`} onClick={() => void restore(item)}>Khôi phục</button>
        </li>)}</ul>}
      </Modal>}
      <Modal open={editing !== undefined} title={editing ? 'Chỉnh sửa chi phí' : 'Thêm chi phí'} onClose={() => setEditing(undefined)}>
        {formError && <div className="form-error-banner" role="alert">{formError}</div>}
        <ExpenseForm expense={editing ?? undefined} tripStart={trip.startDate} tripEnd={trip.endDate} pending={mutations.expense.isPending} people={people} currentUserId={currentUserId} formerPeople={data.formerPeople} onSubmit={save} onCancel={() => setEditing(undefined)} />
      </Modal>
      {importOpen && <Suspense fallback={<StateView state="loading" />}><ExcelImportModal open={importOpen} trip={trip} itinerary={data.itinerary} expenses={expenses} people={people} pending={mutations.importTripData.isPending} onClose={() => setImportOpen(false)} onSubmit={importData} /></Suspense>}
    </div>
  )
}
