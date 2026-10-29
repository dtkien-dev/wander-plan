import { useEffect, useRef, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { CalendarRange, CheckCircle2, Clock3, Crown, MailPlus, MapPin, UserMinus, UsersRound, WalletCards } from 'lucide-react'
import { z } from 'zod'
import { StateView } from '../components/StateView'
import { Modal } from '../components/Modal'
import { DisplayNameForm } from '../components/DisplayNameForm'
import { TripPlanActions } from '../components/TripPlanActions'
import { TripChecklist } from '../components/TripChecklist'
import { ArchiveTripControl } from '../components/ArchiveTripControl'
import { useTripPeople, useWorkspace } from '../hooks/useWorkspace'
import { useWorkspaceMutations } from '../hooks/useWorkspaceMutations'
import { formatCurrency, formatDate } from '../lib/format'
import { useNotify } from '../providers/NotificationProvider'
import type { MemberRole, TripDraft } from '../types'
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
  const workspace = useWorkspace()
  const people = useTripPeople(workspace.data?.trip.id)
  const mutations = useWorkspaceMutations()
  const notify = useNotify()
  const [formError, setFormError] = useState('')
  const [removing, setRemoving] = useState<{ userId: string; displayName: string } | null>(null)
  const [removeError, setRemoveError] = useState('')
  const [revokingEmail, setRevokingEmail] = useState<string | null>(null)
  const [roleChange, setRoleChange] = useState<{ tripId: string; userId: string; name: string; role: MemberRole; expectedRole: MemberRole } | null>(null)
  const [roleError, setRoleError] = useState('')
  const [editingTrip, setEditingTrip] = useState<'general' | 'capacity' | null>(null)
  const capacityInput = useRef<HTMLInputElement | null>(null)
  const trip = workspace.data?.trip
  const isOwner = workspace.data?.currentRole === 'owner'
  const isCreator = Boolean(trip?.createdByUserId && trip.createdByUserId === workspace.data?.currentUserId)
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
    if (!trip) return
    resetTripForm({ name: trip.name, destination: trip.destination, startDate: trip.startDate, endDate: trip.endDate, budgetVnd: trip.budgetVnd, maxMembers: trip.maxMembers })
  }, [trip, resetTripForm])

  useEffect(() => {
    if (editingTrip !== 'capacity') return
    const frame = window.requestAnimationFrame(() => capacityInput.current?.focus())
    return () => window.cancelAnimationFrame(frame)
  }, [editingTrip])

  if (workspace.isLoading) return <StateView state="loading" />
  if (workspace.isError) return <StateView state="error" onAction={() => void workspace.refetch()} />
  if (!workspace.data || !trip) return <StateView state="empty" title="Chưa có chuyến đang hoạt động" message="Chủ nhóm có thể khôi phục trong mục Đã lưu trữ, hoặc bạn có thể tạo hay nhận lời mời vào chuyến khác." />

  const occupiedSeats = people.data?.length ?? workspace.data.memberCount
  const pendingInvitations = people.data?.filter((person) => person.status === 'invited').length ?? 0
  const isFull = occupiedSeats >= trip.maxMembers
  const membersLoading = !people.data || people.isError
  const activeMembers = people.data?.filter((person) => person.status === 'active').length ?? workspace.data.memberCount
  const self = people.data?.find((person) => person.userId === workspace.data?.currentUserId)

  const saveTrip = async (draft: TripDraft) => {
    setFormError('')
    try {
      await mutations.updateTrip.mutateAsync({ draft, existing: trip })
      setEditingTrip(null)
      notify.success('Đã cập nhật thông tin chuyến đi.')
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Không thể cập nhật chuyến đi.')
    }
  }

  const invite = async ({ email }: InviteValues) => {
    try {
      await mutations.inviteMember.mutateAsync({ tripId: trip.id, email })
      inviteForm.reset()
      notify.success('Đã tạo lời mời và giữ một chỗ. Hãy chia sẻ đường dẫn trang web; người nhận đăng nhập đúng email để nhận lời mời. Hệ thống chưa gửi email mời tự động.')
    } catch (error) {
      inviteForm.setError('email', { message: error instanceof Error ? error.message : 'Không thể gửi lời mời.' })
    }
  }

  const revokeInvitation = async (email: string) => {
    try {
      await mutations.revokeInvitation.mutateAsync({ tripId: trip.id, email })
      setRevokingEmail(null)
      notify.success('Đã huỷ lời mời và giải phóng chỗ.')
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Không thể huỷ lời mời.')
    }
  }

  const removeMember = async ({ userId, displayName }: { userId: string; displayName: string }) => {
    try {
      setRemoveError('')
      await mutations.removeMember.mutateAsync({ tripId: trip.id, userId })
      setRemoving(null)
      notify.success(`Đã loại ${displayName} khỏi nhóm.`)
    } catch (error) {
      setRemoveError(error instanceof Error ? error.message : 'Không thể loại thành viên khỏi nhóm.')
    }
  }

  return (
    <div className={styles.page} data-ai-id="group-page">
      <header className="section-header section-header--page">
        <div><h1>Nhóm</h1><p>Thành viên, thông tin chuyến và những việc cần làm trước ngày đi.</p></div>
      </header>
      <div className={styles.grid}>
        <section className={styles.settings} aria-labelledby="trip-settings-title">
          <header><div><h2 id="trip-settings-title">{trip.name}</h2></div>{isOwner ? <button className="button button--soft" type="button" onClick={() => { resetTripForm(); setFormError(''); setEditingTrip('general') }}>Chỉnh sửa chuyến</button> : <span className={styles.readonly}>Chỉ chủ chuyến đi được sửa</span>}</header>
          <div className={styles.tripFacts} aria-label="Tóm tắt chuyến đi">
            <span><CalendarRange size={18} />{formatDate(trip.startDate)} — {formatDate(trip.endDate)}</span>
            <span><MapPin size={18} />{trip.destination}</span>
            <span><WalletCards size={18} />{formatCurrency(trip.budgetVnd)}</span>
            <span><UsersRound size={18} />Tối đa {trip.maxMembers} người</span>
          </div>

        </section>

        <aside className={styles.people} aria-labelledby="people-title">
          <header><h2 id="people-title">Thành viên</h2><p>{activeMembers}/{trip.maxMembers} người đã tham gia{pendingInvitations > 0 ? ` · ${pendingInvitations} chỗ đang giữ cho lời mời` : ''}</p></header>
          {self && <details className={styles.profile}><summary>Tên hiển thị của bạn<span>Chỉnh sửa hồ sơ</span></summary><DisplayNameForm key={workspace.data.currentUserId} initialName={workspace.data.ownDisplayName ?? (self.displayName === self.email || self.displayName === self.email.split('@')[0] ? '' : self.displayName)} fallback={self.email.split('@')[0]} saving={mutations.displayName.isPending} onSave={(name) => mutations.displayName.mutateAsync(name)} /></details>}
          {isOwner && <form className={styles.invite} onSubmit={inviteForm.handleSubmit(invite)}>
            <label htmlFor="invite-email">Mời bằng email</label>
            <div><input id="invite-email" type="email" autoComplete="email" placeholder="ban@example.com" disabled={isFull || membersLoading || mutations.inviteMember.isPending} {...inviteForm.register('email')} aria-invalid={Boolean(inviteForm.formState.errors.email)} /><button className="button button--primary" type="submit" disabled={isFull || membersLoading || mutations.inviteMember.isPending}><MailPlus size={18} />{mutations.inviteMember.isPending ? 'Đang thêm…' : 'Thêm'}</button></div>
            {isFull && !membersLoading && <>
              <p className={styles.capacity}>{pendingInvitations > 0
                ? `Đã giữ đủ ${trip.maxMembers} chỗ, gồm ${activeMembers} thành viên và ${pendingInvitations} lời mời đang chờ.`
                : `Nhóm đã đủ ${activeMembers} thành viên.`}</p>
              {pendingInvitations > 0 && <p className={styles.capacity}>Bạn có thể huỷ lời mời đang chờ để giải phóng chỗ.</p>}
              {trip.maxMembers < 20 && <button className="button button--ghost" type="button" onClick={() => { resetTripForm(); setFormError(''); setEditingTrip('capacity') }}>Tăng số người tối đa</button>}
            </>}
            {inviteForm.formState.errors.email && <span role="alert">{inviteForm.formState.errors.email.message}</span>}
          </form>}
          {people.isLoading ? <div className={styles.peopleLoading} aria-busy="true">Đang tải thành viên…</div> : people.isError ? <div className={styles.peopleError} role="alert"><p>Chưa thể tải danh sách thành viên.</p><button className="button button--ghost" type="button" onClick={() => void people.refetch()}>Thử lại</button></div> : (
            <ul className={styles.peopleList}>
              {people.data?.map((person) => {
                const canRemove = isOwner && person.status === 'active' && person.role !== 'owner' && Boolean(person.userId)
                const canPromote = isOwner && person.status === 'active' && person.role === 'editor' && Boolean(person.userId)
                const canDemote = isCreator && person.status === 'active' && person.role === 'owner' && Boolean(person.userId) && person.userId !== trip.createdByUserId
                const isRemoving = mutations.removeMember.isPending && mutations.removeMember.variables?.userId === person.userId
                return <li key={`${person.status}-${person.userId ?? person.email}`}>
                  <span className={styles.avatar}>{person.displayName.slice(0, 1).toUpperCase()}</span>
                  <div className={styles.identity}><strong title={person.displayName}>{person.displayName}</strong><small title={person.email}>{person.email}</small></div>
                  <div className={styles.memberActions}>
                    <span className={`${styles.status} ${person.status === 'invited' ? styles.pending : ''}`}>{person.role === 'owner' ? <Crown size={15} /> : person.status === 'invited' ? <Clock3 size={15} /> : <CheckCircle2 size={15} />}{person.role === 'owner' ? 'Chủ nhóm' : person.status === 'invited' ? 'Đã mời' : 'Thành viên'}</span>
                    {isOwner && person.status === 'invited' && <button className={styles.removeMember} type="button" disabled={mutations.revokeInvitation.isPending} onClick={() => setRevokingEmail(person.email)} aria-label={`Huỷ lời mời ${person.email}`}>Huỷ lời mời</button>}
                    {(canPromote || canDemote) && <button className={styles.memberButton} type="button" disabled={mutations.setMemberRole.isPending} aria-label={canPromote ? `Bổ nhiệm ${person.displayName} làm chủ nhóm` : `Thu hồi quyền chủ nhóm của ${person.displayName}`} onClick={() => { setRoleError(''); setRoleChange({ tripId: trip.id, userId: person.userId!, name: person.displayName, role: canPromote ? 'owner' : 'editor', expectedRole: person.role }) }}>{canPromote ? <><Crown size={15} aria-hidden="true" /> Làm chủ nhóm</> : 'Thu hồi chủ nhóm'}</button>}
                    {canRemove && <button className={`${styles.memberButton} ${styles.removeMember}`} type="button" disabled={mutations.removeMember.isPending} onClick={() => { setRemoveError(''); setRemoving({ userId: person.userId!, displayName: person.displayName }) }} aria-label={`Loại ${person.displayName} khỏi nhóm`}><UserMinus size={15} aria-hidden="true" />{isRemoving ? 'Đang loại…' : 'Loại'}</button>}
                  </div>
                </li>
              })}
            </ul>
          )}
        </aside>
        <TripChecklist items={workspace.data.checklist ?? []} people={people.data ?? []} busy={mutations.checklist.isPending || mutations.deleteChecklist.isPending} onSave={(draft, existing) => mutations.checklist.mutateAsync({ draft, tripId: trip.id, existing })} onDelete={(item) => mutations.deleteChecklist.mutateAsync(item)} />
      </div>

      <TripPlanActions data={workspace.data} />
      {isOwner && <details className={styles.archive}><summary>Quản lý lưu trữ chuyến</summary><ArchiveTripControl name={trip.name} busy={mutations.archiveTrip.isPending} onArchive={() => mutations.archiveTrip.mutateAsync({ tripId: trip.id, archived: true, version: trip.version })} /></details>}
      <Modal open={editingTrip !== null && isOwner} title="Chỉnh sửa chuyến đi" onClose={() => { if (!mutations.updateTrip.isPending) setEditingTrip(null) }}>
          {formError && <div className="form-error-banner" role="alert">{formError}</div>}
          <form className="form" onSubmit={tripForm.handleSubmit(saveTrip)}>
            <label className="field field--wide">Tên chuyến đi<input disabled={!isOwner} {...tripForm.register('name')} aria-invalid={Boolean(tripForm.formState.errors.name)} />{tripForm.formState.errors.name && <span>{tripForm.formState.errors.name.message}</span>}</label>
            <label className="field field--wide">Điểm đến<input disabled={!isOwner} {...tripForm.register('destination')} aria-invalid={Boolean(tripForm.formState.errors.destination)} />{tripForm.formState.errors.destination && <span>{tripForm.formState.errors.destination.message}</span>}</label>
            <label className="field">Ngày bắt đầu<input type="date" disabled={!isOwner} {...tripForm.register('startDate')} aria-invalid={Boolean(tripForm.formState.errors.startDate)} />{tripForm.formState.errors.startDate && <span>{tripForm.formState.errors.startDate.message}</span>}</label>
            <label className="field">Ngày kết thúc<input type="date" disabled={!isOwner} {...tripForm.register('endDate')} aria-invalid={Boolean(tripForm.formState.errors.endDate)} />{tripForm.formState.errors.endDate && <span>{tripForm.formState.errors.endDate.message}</span>}</label>
            <label className="field">Ngân sách dự kiến<input type="number" min="0" step="100000" inputMode="numeric" disabled={!isOwner} {...tripForm.register('budgetVnd', { valueAsNumber: true })} aria-invalid={Boolean(tripForm.formState.errors.budgetVnd)} />{tripForm.formState.errors.budgetVnd && <span>{tripForm.formState.errors.budgetVnd.message}</span>}</label>
            <label className="field">Số người tối đa<input type="number" min={occupiedSeats} max="20" step="1" inputMode="numeric" disabled={!isOwner} {...capacityField} ref={(input) => { capacityField.ref(input); capacityInput.current = input }} aria-invalid={Boolean(tripForm.formState.errors.maxMembers)} />{tripForm.formState.errors.maxMembers && <span>{tripForm.formState.errors.maxMembers.message}</span>}</label>
            {isOwner && <div className="form__actions field--wide"><button className="button button--primary" type="submit" disabled={mutations.updateTrip.isPending || !tripForm.formState.isDirty}>{mutations.updateTrip.isPending ? 'Đang lưu…' : 'Lưu thông tin'}</button><button className="button button--ghost" type="button" disabled={mutations.updateTrip.isPending} onClick={() => setEditingTrip(null)}>Hủy chỉnh sửa</button></div>}
          </form>
      </Modal>
      <Modal open={removing !== null} title="Loại thành viên khỏi nhóm?" onClose={() => { if (!mutations.removeMember.isPending) setRemoving(null) }}>
        <p className={styles.invitationConfirm}>{removing?.displayName} sẽ mất quyền truy cập chuyến đi. Chỉ loại được khi số dư của người này đã về 0; khoản chi cũ giữ nguyên tên họ.</p>
        {removeError && <p className="form-error-banner" role="alert">{removeError}</p>}
        <div className="form__actions"><button className="button button--ghost" type="button" disabled={mutations.removeMember.isPending} onClick={() => setRemoving(null)}>Giữ lại</button><button className="button button--danger" type="button" disabled={mutations.removeMember.isPending} onClick={() => removing && void removeMember(removing)}>{mutations.removeMember.isPending ? 'Đang loại…' : 'Loại khỏi nhóm'}</button></div>
      </Modal>
      <Modal open={revokingEmail !== null} title="Huỷ lời mời" onClose={() => { if (!mutations.revokeInvitation.isPending) setRevokingEmail(null) }}>
        <p className={styles.invitationConfirm}>Huỷ lời mời gửi đến {revokingEmail}? Chỗ đang giữ sẽ được giải phóng.</p>
        <div className="form__actions"><button className="button button--ghost" type="button" disabled={mutations.revokeInvitation.isPending} onClick={() => setRevokingEmail(null)}>Giữ lời mời</button><button className="button button--primary" type="button" disabled={mutations.revokeInvitation.isPending} onClick={() => revokingEmail && void revokeInvitation(revokingEmail)}>{mutations.revokeInvitation.isPending ? 'Đang huỷ…' : 'Xác nhận huỷ'}</button></div>
      </Modal>
      <Modal open={roleChange !== null} title={roleChange?.role === 'owner' ? 'Bổ nhiệm chủ nhóm' : 'Thu hồi quyền chủ nhóm'} onClose={() => { if (!mutations.setMemberRole.isPending) setRoleChange(null) }}>
        <p className={styles.invitationConfirm}>{roleChange?.role === 'owner' ? `${roleChange.name} sẽ có đầy đủ quyền quản lý chuyến đi như bạn. Chỉ người tạo chuyến được thu hồi quyền này.` : `${roleChange?.name} sẽ trở lại vai trò thành viên. Dữ liệu, khoản chi và công việc được giữ nguyên.`}</p>
        {roleError && <p className="form-error-banner" role="alert">{roleError}</p>}
        <div className="form__actions">
          <button className="button button--ghost" type="button" disabled={mutations.setMemberRole.isPending} onClick={() => setRoleChange(null)}>Hủy</button>
          <button className="button button--primary" type="button" disabled={mutations.setMemberRole.isPending} onClick={async () => {
            if (!roleChange) return
            setRoleError('')
            try { await mutations.setMemberRole.mutateAsync(roleChange); notify.success(roleChange.role === 'owner' ? 'Đã bổ nhiệm chủ nhóm.' : 'Đã thu hồi quyền đồng chủ nhóm.'); setRoleChange(null) }
            catch (error) { setRoleError(error instanceof Error ? error.message : 'Chưa thể thay đổi vai trò. Hãy thử lại.') }
          }}>{mutations.setMemberRole.isPending ? 'Đang lưu…' : 'Xác nhận'}</button>
        </div>
      </Modal>
    </div>
  )
}
