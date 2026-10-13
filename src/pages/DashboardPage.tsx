import { ArrowRight, CalendarDays, MapPin, ReceiptText, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { StateView } from '../components/StateView'
import { formatCurrency, formatDate, safePercent, totalExpenses } from '../lib/format'
import { useWorkspace, useWorkspaceMutations } from '../hooks/useWorkspace'
import styles from './DashboardPage.module.css'

export function DashboardPage() {
  const workspace = useWorkspace()
  const { createTrip } = useWorkspaceMutations()
  if (workspace.isLoading) return <StateView state="loading" />
  if (workspace.isError) return <StateView state="error" onAction={() => void workspace.refetch()} />
  if (!workspace.data) return <StateView state={createTrip.isError ? 'error' : 'empty'} title={createTrip.isError ? 'Chưa thể tham gia chuyến đi' : 'Bạn chưa thuộc chuyến đi nào'} message={createTrip.error instanceof Error ? createTrip.error.message : 'Nếu bạn là người tạo nhóm, hãy khởi tạo chuyến Đà Lạt. Thành viên còn lại cần được chủ chuyến đi mời bằng email.'} actionLabel={createTrip.isPending ? 'Đang khởi tạo…' : createTrip.isError ? 'Thử lại' : 'Khởi tạo chuyến Đà Lạt'} actionDisabled={createTrip.isPending} onAction={() => createTrip.mutate()} />
  const { trip, itinerary, expenses, memberCount } = workspace.data
  const spent = totalExpenses(expenses)
  const budgetPercent = safePercent(spent, trip.budgetVnd)
  const upcoming = itinerary.slice(0, 3)

  return (
    <div className={styles.dashboard} data-ai-id="dashboard-page">
      <section className={styles.hero} data-ai-id="trip-overview">
        <div>
          <p className="eyebrow"><MapPin size={18} /> {trip.destination}</p>
          <h1>{trip.name}</h1>
          <p className={styles.dates}>{formatDate(trip.startDate)} — {formatDate(trip.endDate)}</p>
        </div>
        <div className={styles.companions}>
          <Users size={24} aria-hidden="true" />
          <strong>{memberCount} người</strong>
          <span>cùng lên kế hoạch</span>
        </div>
      </section>

      <section className={styles.metrics} aria-label="Tóm tắt chuyến đi">
        <article className={styles.metric}><span><CalendarDays size={22} /></span><p>Điểm đến</p><strong>{itinerary.length}</strong><small>trong lịch trình</small></article>
        <article className={styles.metric}><span><ReceiptText size={22} /></span><p>Đã dự trù</p><strong>{formatCurrency(spent)}</strong><small>trên {formatCurrency(trip.budgetVnd)}</small></article>
        <article className={`${styles.metric} ${styles.progress}`}><p>Ngân sách còn lại</p><strong>{formatCurrency(Math.max(trip.budgetVnd - spent, 0))}</strong><div className={styles.bar}><span style={{ width: `${budgetPercent}%` }} /></div><small>{Math.round(budgetPercent)}% ngân sách đã dùng</small></article>
      </section>

      <section className={styles.schedule} data-ai-id="upcoming-itinerary">
        <header className="section-header"><div><p className="eyebrow">Sắp tới</p><h2>Những điểm hẹn đầu tiên</h2></div><Link className="text-link" to="/itinerary">Xem lịch trình <ArrowRight size={18} /></Link></header>
        {upcoming.length === 0 ? <StateView state="empty" /> : (
          <ol className={styles.timeline}>
            {upcoming.map((item, index) => <li key={item.id}><span className={styles.number}>{String(index + 1).padStart(2, '0')}</span><time>{item.startTime}</time><div><strong>{item.title}</strong><p>{item.address}</p></div></li>)}
          </ol>
        )}
      </section>
    </div>
  )
}
