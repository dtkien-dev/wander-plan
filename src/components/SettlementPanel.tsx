import { CheckCircle2, Undo2 } from 'lucide-react'
import type { MemberBalance, SettlementTransfer } from '../lib/expenseSettlement'
import { formatCurrency } from '../lib/format'
import type { SettlementPayment } from '../types'
import styles from '../pages/ExpensesPage.module.css'

const pad = (value: number) => String(value).padStart(2, '0')
const formatPaidAt = (value: string) => {
  const date = new Date(value)
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
const describeBalance = (amountVnd: number) => {
  if (amountVnd === 0) return 'Đã cân bằng'
  return amountVnd > 0 ? `Nhận ${formatCurrency(amountVnd)}` : `Trả ${formatCurrency(-amountVnd)}`
}

interface SettlementPanelProps {
  balances: MemberBalance[]
  transfers: SettlementTransfer[]
  payments: SettlementPayment[]
  currentUserId: string
  pending: boolean
  personName: (userId: string) => string
  isFormer?: (userId: string) => boolean
  onConfirm: (transfer: SettlementTransfer) => void
  onUndo: (payment: SettlementPayment) => void
}

export function SettlementPanel({ balances, transfers, payments, currentUserId, pending, personName, isFormer = () => false, onConfirm, onUndo }: SettlementPanelProps) {
  return (
    <section className={styles.settlement} aria-labelledby="settlement-title">
      <header><h2 id="settlement-title">Ai cần trả cho ai?</h2><p className={styles.settlementHint}>Chỉ tính khoản đã chi thực tế. Người nhận tiền xác nhận khi đã nhận; số dư tự tính lại.</p></header>
      <ul className={styles.balances} aria-label="Số dư từng người">{balances.map((balance) => <li key={balance.userId}><span>{personName(balance.userId)}</span><strong className={balance.amountVnd > 0 ? 'amount-receive' : balance.amountVnd < 0 ? 'amount-owe' : ''}>{describeBalance(balance.amountVnd)}</strong></li>)}</ul>
      <div className={styles.transfers}>{transfers.length ? transfers.map((transfer) => (
        <article key={`${transfer.fromUserId}-${transfer.toUserId}`}>
          <p className={styles.transferSentence}><strong>{personName(transfer.fromUserId)}</strong> trả <strong>{personName(transfer.toUserId)}</strong></p><data className={`${styles.transferAmount} ${transfer.toUserId === currentUserId ? 'amount-receive' : transfer.fromUserId === currentUserId ? 'amount-owe' : ''}`} value={transfer.amountVnd}>{formatCurrency(transfer.amountVnd)}</data>
          {transfer.toUserId === currentUserId
            ? <button className={`button button--primary ${styles.transferAction}`} type="button" disabled={pending} onClick={() => onConfirm(transfer)}><CheckCircle2 size={17} /> Đã nhận tiền</button>
            : <small className={styles.transferAction}>Chờ {personName(transfer.toUserId)} xác nhận đã nhận</small>}
        </article>
      )) : <p>{payments.length ? 'Đã quyết toán xong.' : 'Chưa có khoản thực tế cần quyết toán.'}</p>}</div>
      {payments.length > 0 && (
        <section className={styles.payments} aria-labelledby="payments-title">
          <h3 id="payments-title">Đã thanh toán</h3>
          <ul>{payments.map((payment) => (
            <li key={payment.id}>
              <span><strong>{personName(payment.fromUserId)}</strong> đã trả <strong>{personName(payment.toUserId)}</strong></span>
              <span className={styles.paymentAmount}>{formatCurrency(payment.amountVnd)}</span>
              <time dateTime={payment.createdAt}>{formatPaidAt(payment.createdAt)}</time>
              {payment.toUserId === currentUserId && !isFormer(payment.fromUserId) && <button className="button button--ghost" type="button" disabled={pending} onClick={() => onUndo(payment)} aria-label={`Hủy xác nhận ${formatCurrency(payment.amountVnd)} từ ${personName(payment.fromUserId)}`}><Undo2 size={16} /> Hủy</button>}
            </li>
          ))}</ul>
        </section>
      )}
    </section>
  )
}
