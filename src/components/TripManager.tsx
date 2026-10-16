import { useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useWorkspaceContext } from '../providers/WorkspaceProvider'
import { useWorkspaceMutations } from '../hooks/useWorkspace'
import { formatDate } from '../lib/format'
import type { ArchivedTrip, TripDraft } from '../types'
import { Modal } from './Modal'
import { TripSelect } from './TripSelect'
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
  const { tripId, selectTrip, trips, invitations, archivedTrips } = useWorkspaceContext()
  const { respondInvitation, archiveTrip } = useWorkspaceMutations()
  const [creating, setCreating] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [archiveError, setArchiveError] = useState('')
  const [notice, setNotice] = useState('')
  const respond = async (id: string, accept: boolean) => {
    try { await respondInvitation.mutateAsync({ tripId: id, accept }); setNotice(accept ? 'Bạn đã tham gia chuyến đi.' : 'Đã từ chối lời mời.') }
    catch (error) { setNotice(error instanceof Error ? error.message : 'Không thể xử lý lời mời. Hãy tải lại.') }
  }
  const restore = async (trip: ArchivedTrip) => {
    setArchiveError('')
    try {
      await archiveTrip.mutateAsync({ tripId: trip.id, archived: false, version: trip.version })
      setShowArchived(false)
      setNotice('Đã khôi phục chuyến đi. Thành viên có thể xem và chỉnh sửa trở lại.')
    } catch (error) { setArchiveError(error instanceof Error ? error.message : 'Chưa thể khôi phục. Hãy thử lại.') }
  }
  return <section className={styles.manager} aria-label="Chọn chuyến đi và lời mời">
    <div className={styles.toolbar}>
      {trips.data?.length ? <TripSelect label="Chuyến đang xem" trips={trips.data} value={tripId} disabled={respondInvitation.isPending} onChange={selectTrip} /> : <p>{trips.isLoading ? 'Đang tải chuyến đi…' : trips.isError ? 'Chưa thể tải chuyến đi.' : 'Tạo chuyến đi hoặc nhận lời mời để bắt đầu.'}</p>}
      <div className={styles.actions}><button className="button button--soft" type="button" onClick={() => setCreating(true)}>Tạo chuyến mới</button>
        {(Boolean(archivedTrips.data?.length) || archivedTrips.isError) && <button type="button" className="button button--ghost" onClick={() => { setArchiveError(''); setShowArchived(true) }}>Đã lưu trữ{archivedTrips.data?.length ? ` (${archivedTrips.data.length})` : ''}</button>}
      </div>
    </div>
    {notice && <div className="feedback" role="status">{notice}<button type="button" onClick={() => setNotice('')}>Đóng</button></div>}
    {invitations.isError && <p role="alert">Chưa thể tải lời mời. <button className="text-link" type="button" onClick={() => void invitations.refetch()}>Thử lại</button></p>}
    {Boolean(invitations.data?.length) && <div className={styles.invitations}><h2>Lời mời đang chờ</h2>{invitations.data!.map((invitation) => <article key={invitation.tripId}>
      <div><strong>{invitation.tripName}</strong><p>{invitation.destination} · {formatDate(invitation.startDate)} — {formatDate(invitation.endDate)}</p></div>
      <div className={styles.actions}><button className="button button--primary" disabled={respondInvitation.isPending} type="button" onClick={() => void respond(invitation.tripId, true)}>Nhận lời mời</button><button className="button button--ghost" disabled={respondInvitation.isPending} type="button" onClick={() => void respond(invitation.tripId, false)}>Từ chối</button></div>
    </article>)}</div>}
    <Modal open={creating} title="Tạo chuyến đi mới" onClose={() => setCreating(false)}>{creating && <CreateTripForm onDone={() => setCreating(false)} />}</Modal>
    <Modal open={showArchived} title="Chuyến đã lưu trữ" onClose={() => { if (!archiveTrip.isPending) setShowArchived(false) }}>
      <p>Nội dung được giữ kín cho đến khi chủ nhóm khôi phục.</p>
      {archiveError && <p className="form-error-banner" role="alert">{archiveError}</p>}
      {archivedTrips.isError ? <p role="alert">Chưa thể tải chuyến đã lưu trữ. <button type="button" className="text-link" onClick={() => void archivedTrips.refetch()}>Thử lại</button></p>
        : archivedTrips.isLoading ? <p aria-busy="true">Đang tải…</p>
          : <ul className={styles.archivedList}>{archivedTrips.data?.map((trip) => <li key={trip.id}><strong>{trip.name}</strong><button type="button" className="button button--soft" disabled={archiveTrip.isPending} aria-label={`Khôi phục ${trip.name}`} onClick={() => void restore(trip)}>{archiveTrip.isPending ? 'Đang khôi phục…' : 'Khôi phục'}</button></li>)}</ul>}
      {!archivedTrips.isError && !archivedTrips.isLoading && !archivedTrips.data?.length && <p>Không có chuyến đã lưu trữ.</p>}
    </Modal>
  </section>
}
