import { useRef, useState, type FormEvent } from 'react'
import { Copy, CalendarRange } from 'lucide-react'
import { Modal } from './Modal'
import { useWorkspaceMutations } from '../hooks/useWorkspaceMutations'
import { useNotify } from '../providers/NotificationProvider'
import { previewTripPlan } from '../lib/tripPlan'
import type { WorkspaceData } from '../types'
import styles from './TripPlanActions.module.css'

type Action = 'reschedule' | 'clone'
const dates = (start: string, end: string | null) => end ? `${start} → ${end}` : start

function PlanForm({ data, action, onDone }: { data: WorkspaceData; action: Action; onDone: () => void }) {
  const [source] = useState(data)
  const [startDate, setStartDate] = useState('')
  const [name, setName] = useState(`${data.trip.name.slice(0, 90)} (bản sao)`)
  const [shiftExpenses, setShiftExpenses] = useState(false)
  const [error, setError] = useState('')
  const requestId = useRef(crypto.randomUUID())
  const mutations = useWorkspaceMutations()
  const notify = useNotify()
  const cloning = action === 'clone'
  const busy = cloning ? mutations.cloneTrip.isPending : mutations.rescheduleTrip.isPending
  let preview: ReturnType<typeof previewTripPlan> | undefined
  let dateError = ''
  if (startDate) {
    try { preview = previewTripPlan(source, startDate, shiftExpenses) }
    catch { dateError = 'Ngày mới không hợp lệ hoặc vượt giới hạn lịch.' }
  }
  const conflicts = !cloning ? preview?.conflictingExpenses ?? [] : []
  const sameDate = !cloning && preview?.offset === 0
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!preview || sameDate || conflicts.length || busy) return
    setError('')
    try {
      if (cloning) {
        await mutations.cloneTrip.mutateAsync({ source, name, startDate, requestId: requestId.current })
        notify.success('Đã tạo bản sao chuyến đi. Mời thành viên vào chuyến mới khi bạn sẵn sàng.')
      } else {
        await mutations.rescheduleTrip.mutateAsync({ source, startDate, shiftExpenses })
        notify.success('Đã dời ngày chuyến đi và cập nhật kế hoạch.')
      }
      onDone()
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Chưa thể cập nhật kế hoạch.') }
  }
  return <form className="form" onSubmit={submit}>
    {cloning && <label className="field field--wide">Tên chuyến mới<input required minLength={2} maxLength={100} value={name} disabled={busy} onChange={(event) => setName(event.target.value)} /></label>}
    <label className="field field--wide">Ngày bắt đầu mới<input required type="date" value={startDate} disabled={busy} onChange={(event) => { setStartDate(event.target.value); setError('') }} /></label>
    <p className="field--wide">Giữ nguyên số ngày của chuyến. {cloning ? 'Chỉ sao chép lịch trình và nội dung checklist; bỏ đánh dấu hoàn thành và người phụ trách. Không sao chép thành viên, lời mời, chi phí, thanh toán hay thùng rác.' : 'Các hoạt động dời cùng số ngày; giờ bắt đầu/kết thúc được giữ nguyên.'}</p>
    {!cloning && source.expenses.length > 0 && <label className={styles.option}><input type="checkbox" checked={shiftExpenses} disabled={busy} onChange={(event) => { setShiftExpenses(event.target.checked); setError('') }} /> Dời ngày các khoản chi cùng chuyến</label>}
    {!cloning && <p className="field--wide">Số tiền, cách chia, người trả và các khoản thanh toán được giữ nguyên. {shiftExpenses ? 'Ngày các khoản chi đã ghi nhận cũng sẽ dời theo lựa chọn này.' : 'Ngày chi phí giữ nguyên nếu bạn không chọn dời.'} Mục trong thùng rác giữ ngày cũ.</p>}
    {dateError && <p className="form-error-banner field--wide" role="alert">{dateError}</p>}
    {sameDate && <p className="field--wide">Chọn ngày bắt đầu khác ngày hiện tại.</p>}
    {preview && <div className="field--wide">
      <p><strong>Chuyến mới: {dates(preview.trip.startDate, preview.trip.endDate)}</strong></p>
      <div className={styles.preview} role="region" aria-label="Xem trước ngày kế hoạch" tabIndex={0}>
        <table><caption>Xem trước trước khi xác nhận</caption><thead><tr><th scope="col">Nội dung</th><th scope="col">Ngày cũ</th><th scope="col">Ngày mới</th></tr></thead><tbody>
          {preview.itinerary.map((item, index) => <tr key={item.id}><th scope="row">{item.title}</th><td>{dates(source.itinerary[index].visitDate, source.itinerary[index].endDate)}</td><td>{dates(item.visitDate, item.endDate)}</td></tr>)}
          {!cloning && preview.expenses.map((item, index) => <tr key={item.id}><th scope="row">Chi phí: {item.title}</th><td>{dates(source.expenses[index].expenseDate, source.expenses[index].endDate)}</td><td>{dates(item.expenseDate, item.endDate)}</td></tr>)}
        </tbody></table>
      </div>
      {cloning && <p>Sao chép {source.itinerary.length} hoạt động và {source.checklist?.length ?? 0} mục checklist. Chuyến mới chỉ có bạn.</p>}
    </div>}
    {conflicts.length > 0 && <p className="form-error-banner field--wide" role="alert">Có {conflicts.length} khoản chi nằm ngoài khoảng ngày mới. Chọn dời ngày các khoản chi để tiếp tục.</p>}
    {error && <p className="form-error-banner field--wide" role="alert">{error}</p>}
    <div className="form__actions field--wide"><button className="button button--ghost" type="button" disabled={busy} onClick={onDone}>Hủy</button><button className="button button--primary" type="submit" disabled={busy || !preview || sameDate || conflicts.length > 0}>{busy ? 'Đang xử lý…' : cloning ? 'Tạo bản sao' : 'Xác nhận dời chuyến'}</button></div>
  </form>
}

export function TripPlanActions({ data }: { data: WorkspaceData }) {
  const [action, setAction] = useState<Action | null>(null)
  const mutations = useWorkspaceMutations()
  if (data.currentRole !== 'owner') return null
  const busy = action === 'clone' ? mutations.cloneTrip.isPending : action === 'reschedule' ? mutations.rescheduleTrip.isPending : false
  return <section className={styles.actions} aria-label="Dời ngày và nhân bản chuyến">
    <button className="button button--soft" type="button" onClick={() => setAction('reschedule')}><CalendarRange size={18} /> Dời ngày chuyến</button>
    <button className="button button--soft" type="button" onClick={() => setAction('clone')}><Copy size={18} /> Nhân bản chuyến</button>
    <Modal open={action !== null} title={action === 'clone' ? 'Nhân bản chuyến làm mẫu' : 'Dời ngày chuyến và kế hoạch'} onClose={() => { if (!busy) setAction(null) }}>
      {action && <PlanForm data={data} action={action} onDone={() => setAction(null)} />}
    </Modal>
  </section>
}
