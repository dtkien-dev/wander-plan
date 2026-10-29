import { useEffect, useState } from 'react'
import { ArrowRight, Download, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { StateView } from '../components/StateView'
import { formatCurrency, formatDate, safePercent } from '../lib/format'
import { calculateExpenseSettlement } from '../lib/expenseSettlement'
import { boardStatus, itemsOnDay, splitTotals, type BoardStatus } from '../lib/tripDay'
import { downloadTripCalendarEvent, getTripClock, getTripReminder } from '../lib/tripReminder'
import { useWorkspace } from '../hooks/useWorkspace'
import { useSeenItinerary } from '../hooks/useSeenItinerary'
import styles from './DashboardPage.module.css'

const statusLabels: Record<BoardStatus, string> = { done: 'Xong', now: 'Đang diễn ra', next: 'Sắp tới' }

export function DashboardPage() {
  const workspace = useWorkspace()
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])
  const changed = useSeenItinerary(workspace.data)
  if (workspace.isLoading) return <StateView state="loading" />
  if (workspace.isError) return <StateView state="error" onAction={() => void workspace.refetch()} />
  if (!workspace.data) return <StateView state="empty" title="Chưa có chuyến đang hoạt động" message="Bạn có thể tạo chuyến, nhận lời mời hoặc nhờ chủ nhóm khôi phục chuyến đã lưu trữ." />
  const { trip, itinerary, expenses, memberCount, people, currentUserId } = workspace.data
  const reminder = getTripReminder(trip, now)
  const clock = getTripClock(trip, now)
  // Before the trip the board previews day one; afterwards it keeps the last day.
  const day = reminder.status === 'ongoing' ? clock.date : reminder.status === 'upcoming' ? trip.startDate : trip.endDate
  const dayItems = itemsOnDay(itinerary, day)
  const nowStamp = `${clock.date}T${clock.time}`
  const totals = splitTotals(expenses)
  const planned = totals.actual + totals.estimateOnly
  const settlement = calculateExpenseSettlement(expenses, people, workspace.data.settlementPayments ?? [])
  const myBalance = settlement.balances.find((entry) => entry.userId === currentUserId)?.amountVnd
  const nameOf = (userId: string) => people.find((person) => person.userId === userId)?.displayName ?? 'Thành viên cũ'
  const myTransfers = settlement.transfers.filter((transfer) => transfer.fromUserId === currentUserId || transfer.toUserId === currentUserId)
  const dayLabel = reminder.status === 'ongoing' ? `Hôm nay · ngày ${reminder.dayNumber}/${reminder.totalDays}`
    : reminder.status === 'upcoming' ? `Còn ${reminder.daysUntilStart} ngày nữa · ngày đầu tiên` : 'Chuyến đi đã kết thúc · ngày cuối'

  return (
    <div className={styles.dashboard} data-ai-id="dashboard-page">
      <section className={styles.board} aria-labelledby="board-title" data-ai-id="trip-overview">
        <header className={styles.boardHead}>
          <div>
            <h1 id="board-title">{trip.name}</h1>
            <p><MapPin size={15} aria-hidden="true" /> {trip.destination} · {memberCount} người</p>
          </div>
          <p className={styles.boardDay} aria-live="polite"><time dateTime={day}>{formatDate(day)}</time><span>{dayLabel}</span></p>
        </header>
        {dayItems.length === 0
          ? <p className={styles.boardEmpty}>Chưa có hoạt động nào trong ngày này. <Link to="/itinerary">Thêm vào lịch trình</Link></p>
          : <ol className={styles.rows} aria-label={`Lịch ${formatDate(day)}`}>
            {dayItems.map((item) => {
              const status = reminder.status === 'ongoing' ? boardStatus(item, nowStamp) : 'next'
              const isChanged = changed.has(item.id)
              return (
                <li key={item.id} className={`${styles.row} ${status === 'done' ? styles.rowDone : ''} ${isChanged ? styles.rowChanged : ''}`}>
                  <time className={styles.time}>{item.visitDate === day ? item.startTime : '…'}</time>
                  <div className={styles.stop}><strong>{item.title}</strong><span>{item.address}</span></div>
                  <span className={styles.status}>
                    {isChanged && <span className="status-tag status-tag--changed">Đã đổi</span>}
                    <span className={`status-tag ${status === 'now' ? 'status-tag--now' : 'status-tag--muted'}`}>{statusLabels[status]}</span>
                  </span>
                </li>
              )
            })}
          </ol>}
        <footer className={styles.boardFoot}>
          <Link className={styles.boardLink} to="/itinerary">Cả lịch trình <ArrowRight size={16} aria-hidden="true" /></Link>
          <button className={styles.boardLink} type="button" onClick={() => downloadTripCalendarEvent(trip)}><Download size={16} aria-hidden="true" /> Thêm vào lịch</button>
        </footer>
      </section>

      <section className={styles.ticket} aria-labelledby="ticket-title" data-ai-id="my-balance">
        <div className={styles.ticketMain}>
          <h2 id="ticket-title">Tiền của bạn</h2>
          {myBalance === undefined ? <p className={styles.ticketNote}>Bạn không có trong phần chia tiền của chuyến này.</p> : <>
            <p className={`${styles.ticketAmount} ${myBalance > 0 ? 'amount-receive' : myBalance < 0 ? 'amount-owe' : ''}`}>
              {myBalance > 0 ? 'Bạn nhận lại ' : myBalance < 0 ? 'Bạn cần trả ' : 'Đã cân bằng'}{myBalance !== 0 && formatCurrency(Math.abs(myBalance))}
            </p>
            {myTransfers.length > 0 && <ul className={styles.ticketTransfers}>{myTransfers.map((transfer) => <li key={`${transfer.fromUserId}-${transfer.toUserId}`}>
              {transfer.toUserId === currentUserId ? `${nameOf(transfer.fromUserId)} trả bạn` : `Bạn trả ${nameOf(transfer.toUserId)}`} <data value={transfer.amountVnd}>{formatCurrency(transfer.amountVnd)}</data>
            </li>)}</ul>}
            <p className={styles.ticketNote}>Chỉ tính khoản đã chi thực tế và thanh toán đã xác nhận.</p>
          </>}
          <Link className="text-link" to="/expenses">Xem chi phí và quyết toán <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
        <dl className={styles.ticketStub}>
          <div><dt>Thực tế</dt><dd>{formatCurrency(totals.actual)}</dd></div>
          <div><dt>Dự kiến thêm</dt><dd>{formatCurrency(totals.estimateOnly)}</dd></div>
          <div><dt>Ngân sách</dt><dd>{formatCurrency(trip.budgetVnd)}</dd></div>
          <div className={styles.budgetBar} aria-hidden="true"><span style={{ width: `${Math.min(safePercent(totals.actual, trip.budgetVnd), 100)}%` }} /><span style={{ width: `${Math.min(safePercent(totals.estimateOnly, trip.budgetVnd), 100 - Math.min(safePercent(totals.actual, trip.budgetVnd), 100))}%` }} /></div>
          <p>{Math.round(safePercent(planned, trip.budgetVnd))}% ngân sách đã dự trù</p>
        </dl>
      </section>
    </div>
  )
}
