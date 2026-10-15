import { useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ChevronDown } from 'lucide-react'
import { useWorkspaceContext } from '../providers/WorkspaceProvider'
import { useWorkspaceMutations } from '../hooks/useWorkspace'
import { formatDate } from '../lib/format'
import type { TripDraft } from '../types'
import { Modal } from './Modal'
import styles from './TripManager.module.css'

const schema = z.object({
  name: z.string().trim().min(2, 'Tên cần ít nhất 2 ký tự.').max(100),
  destination: z.string().trim().min(2, 'Nhập điểm đến.').max(150),
  startDate: z.string().min(1, 'Chọn ngày bắt đầu.'),
  endDate: z.string().min(1, 'Chọn ngày kết thúc.'),
  budgetVnd: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
  maxMembers: z.number().int().min(1).max(20),
}).refine((value) => value.endDate >= value.startDate, { path: ['endDate'], message: 'Ngày kết thúc phải từ ngày bắt đầu trở đi.' })

function CreateTripForm({ onDone }: { onDone: () => void }) {
  const requestId = useRef(crypto.randomUUID())
  const { createTrip } = useWorkspaceMutations()
  const { register, handleSubmit, formState: { errors } } = useForm<TripDraft>({ resolver: zodResolver(schema), defaultValues: { name: '', destination: '', startDate: '', endDate: '', budgetVnd: 0, maxMembers: 4 } })
  const [error, setError] = useState('')
  const submit = async (draft: TripDraft) => {
    setError('')
    try { await createTrip.mutateAsync({ draft, requestId: requestId.current }); onDone() }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Chưa thể tạo chuyến đi.') }
  }
  return <form className="form" onSubmit={handleSubmit(submit)}>
    <label className="field field--wide">Tên chuyến đi<input {...register('name')} autoFocus aria-invalid={Boolean(errors.name)} />{errors.name && <span>{errors.name.message}</span>}</label>
    <label className="field field--wide">Điểm đến<input {...register('destination')} aria-invalid={Boolean(errors.destination)} />{errors.destination && <span>{errors.destination.message}</span>}</label>
    <label className="field">Ngày bắt đầu<input type="date" {...register('startDate')} aria-invalid={Boolean(errors.startDate)} />{errors.startDate && <span>{errors.startDate.message}</span>}</label>
    <label className="field">Ngày kết thúc<input type="date" {...register('endDate')} aria-invalid={Boolean(errors.endDate)} />{errors.endDate && <span>{errors.endDate.message}</span>}</label>
    <label className="field">Ngân sách (VND)<input type="number" min="0" step="1" {...register('budgetVnd', { valueAsNumber: true })} aria-invalid={Boolean(errors.budgetVnd)} />{errors.budgetVnd && <span>Nhập ngân sách nguyên, không âm.</span>}</label>
    <label className="field">Số người tối đa<input type="number" min="1" max="20" {...register('maxMembers', { valueAsNumber: true })} aria-invalid={Boolean(errors.maxMembers)} />{errors.maxMembers && <span>Chọn từ 1 đến 20 người.</span>}</label>
    {error && <p className="form-error-banner field--wide" role="alert">{error}</p>}
    <div className="form__actions field--wide"><button className="button button--primary" disabled={createTrip.isPending} type="submit">{createTrip.isPending ? 'Đang tạo…' : 'Tạo chuyến đi'}</button></div>
  </form>
}

export function TripManager() {
  const { tripId, selectTrip, trips, invitations } = useWorkspaceContext()
  const { respondInvitation } = useWorkspaceMutations()
  const [creating, setCreating] = useState(false)
  const [notice, setNotice] = useState('')
  const respond = async (id: string, accept: boolean) => {
    try { await respondInvitation.mutateAsync({ tripId: id, accept }); setNotice(accept ? 'Bạn đã tham gia chuyến đi.' : 'Đã từ chối lời mời.') }
    catch (error) { setNotice(error instanceof Error ? error.message : 'Không thể xử lý lời mời. Hãy tải lại.') }
  }
  return <section className={styles.manager} aria-label="Chọn chuyến đi và lời mời">
    <div className={styles.toolbar}>
      {trips.data?.length ? <label className={styles.select}>Chuyến đang xem<span className={styles.selectControl}><select value={tripId ?? ''} onChange={(event) => selectTrip(event.target.value)} disabled={respondInvitation.isPending}>{trips.data.map((trip) => <option value={trip.id} key={trip.id}>{trip.name}</option>)}</select><ChevronDown className={styles.selectChevron} size={18} aria-hidden="true" /></span></label> : <p>{trips.isLoading ? 'Đang tải chuyến đi…' : trips.isError ? 'Chưa thể tải chuyến đi.' : 'Tạo chuyến đi hoặc nhận lời mời để bắt đầu.'}</p>}
      <button className="button button--soft" type="button" onClick={() => setCreating(true)}>Tạo chuyến mới</button>
    </div>
    {notice && <div className="feedback" role="status">{notice}<button type="button" onClick={() => setNotice('')}>Đóng</button></div>}
    {invitations.isError && <p role="alert">Chưa thể tải lời mời. <button className="text-link" type="button" onClick={() => void invitations.refetch()}>Thử lại</button></p>}
    {Boolean(invitations.data?.length) && <div className={styles.invitations}><h2>Lời mời đang chờ</h2>{invitations.data!.map((invitation) => <article key={invitation.tripId}>
      <div><strong>{invitation.tripName}</strong><p>{invitation.destination} · {formatDate(invitation.startDate)} — {formatDate(invitation.endDate)}</p></div>
      <div className={styles.actions}><button className="button button--primary" disabled={respondInvitation.isPending} type="button" onClick={() => void respond(invitation.tripId, true)}>Nhận lời mời</button><button className="button button--ghost" disabled={respondInvitation.isPending} type="button" onClick={() => void respond(invitation.tripId, false)}>Từ chối</button></div>
    </article>)}</div>}
    <Modal open={creating} title="Tạo chuyến đi mới" onClose={() => setCreating(false)}>{creating && <CreateTripForm onDone={() => setCreating(false)} />}</Modal>
  </section>
}
