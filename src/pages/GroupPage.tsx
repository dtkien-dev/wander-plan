import { useEffect, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { CalendarRange, CheckCircle2, Clock3, Crown, MailPlus, MapPin, UserMinus, UsersRound, WalletCards } from 'lucide-react'
import { z } from 'zod'
import { StateView } from '../components/StateView'
import { Modal } from '../components/Modal'
import { useAuth } from '../providers/AuthProvider'
import { useTripPeople, useWorkspace, useWorkspaceMutations } from '../hooks/useWorkspace'
import { formatCurrency, formatDate } from '../lib/format'
import type { TripDraft } from '../types'
import styles from './GroupPage.module.css'

const tripSchema = z.object({
  name: z.string().trim().min(2, 'Tên chuyến đi cần ít nhất 2 ký tự.').max(100),
  destination: z.string().trim().min(2, 'Nhập điểm đến.').max(150),
  startDate: z.string().min(1, 'Chọn ngày bắt đầu.'),
  endDate: z.string().min(1, 'Chọn ngày kết thúc.'),
  budgetVnd: z.number().int().min(0, 'Ngân sách không thể âm.'),
  maxMembers: z.number().int().min(1, 'Nhóm cần ít nhất 1 người.').max(20, 'Tối đa 20 người.'),
}).refine((data) => data.endDate >= data.startDate, { message: 'Ngày kết thúc phải sau ngày bắt đầu.', path: ['endDate'] })

const inviteSchema = z.object({ email: z.email('Nhập email hợp lệ.').transform((value) => value.trim().toLowerCase()) })

type InviteValues = z.infer<typeof inviteSchema>

export function GroupPage() {
  const { isDemo } = useAuth()
  const workspace = useWorkspace()
  const people = useTripPeople(workspace.data?.trip.id)
  const mutations = useWorkspaceMutations()
  const [notice, setNotice] = useState('')
  const [formError, setFormError] = useState('')
  const [revokingEmail, setRevokingEmail] = useState<string | null>(null)
  const capacityInput = useRef<HTMLInputElement | null>(null)
  const trip = workspace.data?.trip
  const isOwner = workspace.data?.currentRole === 'owner'
  const tripForm = useForm<TripDraft>({
    resolver: zodResolver(tripSchema),
    defaultValues: trip ? {
      name: trip.name,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      budgetVnd: trip.budgetVnd,
      maxMembers: trip.maxMembers,
    } : { name: '', destination: '', startDate: '', endDate: '', budgetVnd: 0, maxMembers: 4 },
  })
  const inviteForm = useForm<InviteValues>({ resolver: zodResolver(inviteSchema), defaultValues: { email: '' } })
  const resetTripForm = tripForm.reset
  const capacityField = tripForm.register('maxMembers', { valueAsNumber: true })

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 5000)
    return () => window.clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    if (!trip) return
    resetTripForm({ name: trip.name, destination: trip.destination, startDate: trip.startDate, endDate: trip.endDate, budgetVnd: trip.budgetVnd, maxMembers: trip.maxMembers })
  }, [trip, resetTripForm])

  if (workspace.isLoading) return <StateView state="loading" />
  if (workspace.isError) return <StateView state="error" onAction={() => void workspace.refetch()} />
  if (!workspace.data || !trip) return <StateView state="empty" title="Chưa có chuyến đi" />

  const occupiedSeats = people.data?.length ?? workspace.data.memberCount
  const pendingInvitations = people.data?.filter((person) => person.status === 'invited').length ?? 0
  const isFull = occupiedSeats >= trip.maxMembers
  const membersLoading = !people.data || people.isError
  const activeMembers = people.data?.filter((person) => person.status === 'active').length ?? workspace.data.memberCount

  const saveTrip = async (draft: TripDraft) => {
    setFormError('')
    try {
      await mutations.updateTrip.mutateAsync({ draft, existing: trip })
      setNotice('Đã cập nhật thông tin chuyến đi.')
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Không thể cập nhật chuyến đi.')
    }
  }

  const invite = async ({ email }: InviteValues) => {
    try {
      await mutations.inviteMember.mutateAsync({ tripId: trip.id, email })
      inviteForm.reset()
      setNotice('Đã tạo lời mời và giữ một chỗ. Hãy chia sẻ đường dẫn trang web; người nhận đăng nhập đúng email để nhận lời mời. Hệ thống chưa gửi email mời tự động.')
    } catch (error) {
      inviteForm.setError('email', { message: error instanceof Error ? error.message : 'Không thể gửi lời mời.' })
    }
  }

  const revokeInvitation = async (email: string) => {
    try {
      await mutations.revokeInvitation.mutateAsync({ tripId: trip.id, email })
      setRevokingEmail(null)
      setNotice('Đã huỷ lời mời và giải phóng chỗ.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Không thể huỷ lời mời.')
    }
  }

  const removeMember = async (userId: string, displayName: string) => {
    if (!window.confirm(`Loại ${displayName} khỏi nhóm? Người này sẽ mất quyền truy cập chuyến đi.`)) return
    try {
      await mutations.removeMember.mutateAsync({ tripId: trip.id, userId })
      setNotice(`Đã loại ${displayName} khỏi nhóm.`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Không thể loại thành viên khỏi nhóm.')
    }
  }

  return (
    <div className={styles.page} data-ai-id="group-page">
      <header className="section-header section-header--page">
        <div><p className="eyebrow">Nhóm {trip.maxMembers} người</p><h1>Chuyến đi & thành viên</h1><p>Một nơi để chốt ngày đi, ngân sách và những người được phép chỉnh sửa.</p></div>
        <div className={styles.sync}><CheckCircle2 size={18} aria-hidden="true" /><span>{isDemo ? 'Lưu trên trình duyệt này' : 'Cập nhật cùng nhóm'}</span></div>
      </header>
      {notice && <div className="feedback" role="status">{notice}<button type="button" onClick={() => setNotice('')}>Đóng</button></div>}
      <div className={styles.grid}>
        <section className={styles.settings} aria-labelledby="trip-settings-title">
          <header><div><span className={styles.sectionIcon}><CalendarRange size={24} /></span><p className="eyebrow">Thông tin chung</p><h2 id="trip-settings-title">{trip.name}</h2></div>{!isOwner && <span className={styles.readonly}>Chỉ chủ chuyến đi được sửa</span>}</header>
          <div className={styles.tripFacts} aria-label="Tóm tắt chuyến đi">
            <span><CalendarRange size={18} />{formatDate(trip.startDate)} — {formatDate(trip.endDate)}</span>
            <span><MapPin size={18} />{trip.destination}</span>
            <span><WalletCards size={18} />{formatCurrency(trip.budgetVnd)}</span>
            <span><UsersRound size={18} />Tối đa {trip.maxMembers} người</span>
          </div>
          {formError && <div className="form-error-banner" role="alert">{formError}</div>}
          <form className="form" onSubmit={tripForm.handleSubmit(saveTrip)}>
            <label className="field field--wide">Tên chuyến đi<input disabled={!isOwner} {...tripForm.register('name')} aria-invalid={Boolean(tripForm.formState.errors.name)} />{tripForm.formState.errors.name && <span>{tripForm.formState.errors.name.message}</span>}</label>
            <label className="field field--wide">Điểm đến<input disabled={!isOwner} {...tripForm.register('destination')} aria-invalid={Boolean(tripForm.formState.errors.destination)} />{tripForm.formState.errors.destination && <span>{tripForm.formState.errors.destination.message}</span>}</label>
            <label className="field">Ngày bắt đầu<input type="date" disabled={!isOwner} {...tripForm.register('startDate')} aria-invalid={Boolean(tripForm.formState.errors.startDate)} />{tripForm.formState.errors.startDate && <span>{tripForm.formState.errors.startDate.message}</span>}</label>
            <label className="field">Ngày kết thúc<input type="date" disabled={!isOwner} {...tripForm.register('endDate')} aria-invalid={Boolean(tripForm.formState.errors.endDate)} />{tripForm.formState.errors.endDate && <span>{tripForm.formState.errors.endDate.message}</span>}</label>
            <label className="field">Ngân sách dự kiến<input type="number" min="0" step="100000" inputMode="numeric" disabled={!isOwner} {...tripForm.register('budgetVnd', { valueAsNumber: true })} aria-invalid={Boolean(tripForm.formState.errors.budgetVnd)} />{tripForm.formState.errors.budgetVnd && <span>{tripForm.formState.errors.budgetVnd.message}</span>}</label>
            <label className="field">Số người tối đa<input type="number" min={occupiedSeats} max="20" step="1" inputMode="numeric" disabled={!isOwner} {...capacityField} ref={(input) => { capacityField.ref(input); capacityInput.current = input }} aria-invalid={Boolean(tripForm.formState.errors.maxMembers)} />{tripForm.formState.errors.maxMembers && <span>{tripForm.formState.errors.maxMembers.message}</span>}</label>
            {isOwner && <div className="form__actions field--wide"><button className="button button--primary" type="submit" disabled={mutations.updateTrip.isPending || !tripForm.formState.isDirty}>{mutations.updateTrip.isPending ? 'Đang lưu…' : 'Lưu thông tin'}</button></div>}
          </form>
        </section>

        <aside className={styles.people} aria-labelledby="people-title">
          <header><span className={styles.sectionIcon}><UsersRound size={24} /></span><p className="eyebrow">Quyền truy cập</p><h2 id="people-title">Thành viên</h2><p>{activeMembers}/{trip.maxMembers} người đã tham gia{pendingInvitations > 0 ? ` · ${pendingInvitations} chỗ đang giữ cho lời mời` : ''}</p></header>
          {isOwner && <form className={styles.invite} onSubmit={inviteForm.handleSubmit(invite)}>
            <label htmlFor="invite-email">Mời bằng email</label>
            <div><input id="invite-email" type="email" autoComplete="email" placeholder="ban@example.com" disabled={isFull || membersLoading || mutations.inviteMember.isPending} {...inviteForm.register('email')} aria-invalid={Boolean(inviteForm.formState.errors.email)} /><button className="button button--primary" type="submit" disabled={isFull || membersLoading || mutations.inviteMember.isPending}><MailPlus size={18} />{mutations.inviteMember.isPending ? 'Đang thêm…' : 'Thêm'}</button></div>
            {isFull && !membersLoading && <>
              <p className={styles.capacity}>{pendingInvitations > 0
                ? `Đã giữ đủ ${trip.maxMembers} chỗ, gồm ${activeMembers} thành viên và ${pendingInvitations} lời mời đang chờ.`
                : `Nhóm đã đủ ${activeMembers} thành viên.`}</p>
              {pendingInvitations > 0 && <p className={styles.capacity}>Bạn có thể huỷ lời mời đang chờ để giải phóng chỗ.</p>}
              {trip.maxMembers < 20 && <button className="button button--ghost" type="button" onClick={() => capacityInput.current?.focus()}>Tăng số người tối đa</button>}
            </>}
            {inviteForm.formState.errors.email && <span role="alert">{inviteForm.formState.errors.email.message}</span>}
          </form>}
          {people.isLoading ? <div className={styles.peopleLoading} aria-busy="true">Đang tải thành viên…</div> : people.isError ? <div className={styles.peopleError} role="alert"><p>Chưa thể tải danh sách thành viên.</p><button className="button button--ghost" type="button" onClick={() => void people.refetch()}>Thử lại</button></div> : (
            <ul className={styles.peopleList}>
              {people.data?.map((person) => {
                const canRemove = isOwner && person.status === 'active' && person.role !== 'owner' && Boolean(person.userId)
                const isRemoving = mutations.removeMember.isPending && mutations.removeMember.variables?.userId === person.userId
                return <li key={`${person.status}-${person.userId ?? person.email}`}>
                  <span className={styles.avatar}>{person.displayName.slice(0, 1).toUpperCase()}</span>
                  <div className={styles.identity}><strong title={person.displayName}>{person.displayName}</strong><small title={person.email}>{person.email}</small></div>
                  <div className={styles.memberActions}>
                    <span className={`${styles.status} ${person.status === 'invited' ? styles.pending : ''}`}>{person.role === 'owner' ? <Crown size={15} /> : person.status === 'invited' ? <Clock3 size={15} /> : <CheckCircle2 size={15} />}{person.role === 'owner' ? 'Chủ nhóm' : person.status === 'invited' ? 'Đã mời' : 'Thành viên'}</span>
                    {isOwner && person.status === 'invited' && <button className={styles.removeMember} type="button" disabled={mutations.revokeInvitation.isPending} onClick={() => setRevokingEmail(person.email)} aria-label={`Huỷ lời mời ${person.email}`}>Huỷ lời mời</button>}
                    {canRemove && <button className={styles.removeMember} type="button" disabled={mutations.removeMember.isPending} onClick={() => void removeMember(person.userId!, person.displayName)} aria-label={`Loại ${person.displayName} khỏi nhóm`}><UserMinus size={16} />{isRemoving ? 'Đang loại…' : 'Loại khỏi nhóm'}</button>}
                  </div>
                </li>
              })}
            </ul>
          )}
        </aside>
      </div>
      <Modal open={revokingEmail !== null} title="Huỷ lời mời" onClose={() => { if (!mutations.revokeInvitation.isPending) setRevokingEmail(null) }}>
        <p className={styles.invitationConfirm}>Huỷ lời mời gửi đến {revokingEmail}? Chỗ đang giữ sẽ được giải phóng.</p>
        <div className="form__actions"><button className="button button--ghost" type="button" disabled={mutations.revokeInvitation.isPending} onClick={() => setRevokingEmail(null)}>Giữ lời mời</button><button className="button button--primary" type="button" disabled={mutations.revokeInvitation.isPending} onClick={() => revokingEmail && void revokeInvitation(revokingEmail)}>{mutations.revokeInvitation.isPending ? 'Đang huỷ…' : 'Xác nhận huỷ'}</button></div>
      </Modal>
    </div>
  )
}
