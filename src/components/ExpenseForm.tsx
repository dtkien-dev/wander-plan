import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { Expense, ExpenseDraft, TripPerson } from '../types'

const createSchema = (tripStart: string, tripEnd: string, activeUserIds: string[]) => z.object({
  title: z.string().trim().min(2, 'Nhập tên khoản chi.'),
  category: z.enum(['food', 'transport', 'stay', 'ticket', 'other']),
  expenseDate: z.string().min(1, 'Chọn ngày.'),
  estimatedAmountVnd: z.number().int().min(0, 'Chi phí không thể âm.'),
  actualAmountVnd: z.number().int('Số tiền phải là số nguyên.').min(0, 'Chi phí không thể âm.').nullable(),
  paidByUserId: z.string().refine((value) => activeUserIds.includes(value), 'Chọn một thành viên đang hoạt động.'),
  participantUserIds: z.array(z.string()).min(1, 'Chọn ít nhất một người tham gia.')
    .refine((values) => values.every((value) => activeUserIds.includes(value)), 'Người tham gia phải đang thuộc chuyến đi.'),
  notes: z.string().trim().max(500, 'Ghi chú tối đa 500 ký tự.'),
}).refine((data) => data.expenseDate >= tripStart && data.expenseDate <= tripEnd, { message: 'Ngày chi phải nằm trong thời gian chuyến đi.', path: ['expenseDate'] })

interface ExpenseFormProps {
  expense?: Expense
  tripStart: string
  tripEnd: string
  pending: boolean
  people: TripPerson[]
  currentUserId: string
  onSubmit: (draft: ExpenseDraft) => Promise<void>
  onCancel: () => void
}

export function ExpenseForm({ expense, tripStart, tripEnd, pending, people, currentUserId, onSubmit, onCancel }: ExpenseFormProps) {
  const activePeople = people.filter((person): person is TripPerson & { userId: string } => person.status === 'active' && Boolean(person.userId))
  const activeUserIds = activePeople.map((person) => person.userId)
  const { register, handleSubmit, formState: { errors } } = useForm<ExpenseDraft>({
    resolver: zodResolver(createSchema(tripStart, tripEnd, activeUserIds)),
    defaultValues: expense ?? {
      title: '', category: 'food', expenseDate: tripStart, estimatedAmountVnd: 0, actualAmountVnd: null,
      paidByUserId: activeUserIds.includes(currentUserId) ? currentUserId : activeUserIds[0] ?? '',
      participantUserIds: activeUserIds, notes: '',
    },
  })
  return (
    <form className="form" onSubmit={handleSubmit(onSubmit)}>
      <label className="field field--wide">Khoản chi<input {...register('title')} aria-invalid={Boolean(errors.title)} />{errors.title && <span>{errors.title.message}</span>}</label>
      <label className="field">Phân loại<select {...register('category')}><option value="food">Ăn uống</option><option value="transport">Di chuyển</option><option value="stay">Lưu trú</option><option value="ticket">Vé tham quan</option><option value="other">Khác</option></select></label>
      <label className="field">Ngày<input type="date" min={tripStart} max={tripEnd} {...register('expenseDate')} aria-invalid={Boolean(errors.expenseDate)} />{errors.expenseDate && <span>{errors.expenseDate.message}</span>}</label>
      <label className="field">Dự kiến<input type="number" inputMode="numeric" min="0" step="1000" {...register('estimatedAmountVnd', { valueAsNumber: true })} aria-invalid={Boolean(errors.estimatedAmountVnd)} />{errors.estimatedAmountVnd && <span>{errors.estimatedAmountVnd.message}</span>}</label>
      <label className="field">Thực tế<input type="number" inputMode="numeric" min="0" step="1000" placeholder="Chưa phát sinh" {...register('actualAmountVnd', { setValueAs: (value) => value === '' ? null : Number(value) })} aria-invalid={Boolean(errors.actualAmountVnd)} />{errors.actualAmountVnd && <span>{errors.actualAmountVnd.message}</span>}</label>
      <label className="field field--wide">Người thanh toán<select {...register('paidByUserId')} aria-invalid={Boolean(errors.paidByUserId)}>{activePeople.map((person) => <option key={person.userId} value={person.userId}>{person.displayName}</option>)}</select>{errors.paidByUserId && <span>{errors.paidByUserId.message}</span>}</label>
      <fieldset className="field field--wide participant-field"><legend>Người tham gia</legend><div>{activePeople.map((person) => <label key={person.userId}><input type="checkbox" value={person.userId} {...register('participantUserIds')} /> <span>{person.displayName}</span></label>)}</div>{errors.participantUserIds && <span>{errors.participantUserIds.message}</span>}</fieldset>
      <label className="field field--wide">Ghi chú<textarea rows={3} maxLength={500} {...register('notes')} aria-invalid={Boolean(errors.notes)} />{errors.notes && <span>{errors.notes.message}</span>}</label>
      <div className="form__actions field--wide">
        <button className="button button--ghost" type="button" onClick={onCancel}>Hủy</button>
        <button className="button button--primary" type="submit" disabled={pending}>{pending ? 'Đang lưu…' : expense ? 'Lưu thay đổi' : 'Thêm chi phí'}</button>
      </div>
    </form>
  )
}
