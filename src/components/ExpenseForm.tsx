import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { countNights, formatCurrency } from '../lib/format'
import type { Expense, ExpenseCategory, ExpenseDraft, TripPerson } from '../types'

type ExpenseFormValues = ExpenseDraft & { roundTrip: boolean }

const startDateLabels: Partial<Record<ExpenseCategory, string>> = { transport: 'Ngày đi', stay: 'Ngày nhận phòng' }

const createSchema = (tripStart: string, tripEnd: string, activeUserIds: string[]) => z.object({
  title: z.string().trim().min(2, 'Nhập tên khoản chi.'),
  category: z.enum(['food', 'transport', 'stay', 'ticket', 'other']),
  expenseDate: z.string().min(1, 'Chọn ngày.'),
  endDate: z.string().nullable(),
  roundTrip: z.boolean(),
  estimatedAmountVnd: z.number().int().min(0, 'Chi phí không thể âm.'),
  actualAmountVnd: z.number().int('Số tiền phải là số nguyên.').min(0, 'Chi phí không thể âm.').nullable(),
  paidByUserId: z.string().refine((value) => activeUserIds.includes(value), 'Chọn một thành viên đang hoạt động.'),
  participantUserIds: z.array(z.string()).min(1, 'Chọn ít nhất một người tham gia.')
    .refine((values) => values.every((value) => activeUserIds.includes(value)), 'Người tham gia phải đang thuộc chuyến đi.'),
  notes: z.string().trim().max(500, 'Ghi chú tối đa 500 ký tự.'),
}).superRefine((data, context) => {
  if (data.expenseDate < tripStart || data.expenseDate > tripEnd) {
    context.addIssue({ code: 'custom', message: 'Ngày chi phải nằm trong thời gian chuyến đi.', path: ['expenseDate'] })
  }
  const needsEndDate = data.category === 'stay' || (data.category === 'transport' && data.roundTrip)
  if (!needsEndDate) return
  const isStay = data.category === 'stay'
  if (!data.endDate) {
    context.addIssue({ code: 'custom', message: isStay ? 'Chọn ngày trả phòng.' : 'Chọn ngày về.', path: ['endDate'] })
  } else if (isStay ? data.endDate <= data.expenseDate : data.endDate < data.expenseDate) {
    context.addIssue({ code: 'custom', message: isStay ? 'Ngày trả phòng phải sau ngày nhận phòng.' : 'Ngày về phải từ ngày đi trở đi.', path: ['endDate'] })
  } else if (data.endDate > tripEnd) {
    context.addIssue({ code: 'custom', message: 'Ngày chi phải nằm trong thời gian chuyến đi.', path: ['endDate'] })
  }
})

const toDraft = ({ roundTrip, ...values }: ExpenseFormValues): ExpenseDraft => ({
  ...values,
  endDate: values.category === 'stay' || (values.category === 'transport' && roundTrip) ? values.endDate : null,
})

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
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ExpenseFormValues>({
    resolver: zodResolver(createSchema(tripStart, tripEnd, activeUserIds)),
    defaultValues: expense
      ? { ...expense, roundTrip: expense.category === 'transport' && Boolean(expense.endDate) }
      : {
          title: '', category: 'food', expenseDate: tripStart, endDate: null, roundTrip: false, estimatedAmountVnd: 0, actualAmountVnd: null,
          paidByUserId: activeUserIds.includes(currentUserId) ? currentUserId : activeUserIds[0] ?? '',
          participantUserIds: activeUserIds, notes: '',
        },
  })
  const [category, roundTrip, expenseDate, endDate, estimated, actual] = watch(['category', 'roundTrip', 'expenseDate', 'endDate', 'estimatedAmountVnd', 'actualAmountVnd'])
  const isStay = category === 'stay'
  const showEndDate = isStay || (category === 'transport' && roundTrip)
  const nights = isStay && endDate && endDate > expenseDate ? countNights(expenseDate, endDate) : 0
  const stayAmount = actual ?? estimated
  return (
    <form className="form" onSubmit={handleSubmit((values) => onSubmit(toDraft(values)))}>
      <label className="field field--wide">Khoản chi<input {...register('title')} aria-invalid={Boolean(errors.title)} />{errors.title && <span>{errors.title.message}</span>}</label>
      <label className="field">Phân loại<select {...register('category')}><option value="food">Ăn uống</option><option value="transport">Di chuyển</option><option value="stay">Lưu trú</option><option value="ticket">Vé tham quan</option><option value="other">Khác</option></select></label>
      <label className="field">{startDateLabels[category] ?? 'Ngày'}<input type="date" min={tripStart} max={tripEnd} {...register('expenseDate')} aria-invalid={Boolean(errors.expenseDate)} />{errors.expenseDate && <span>{errors.expenseDate.message}</span>}</label>
      {category === 'transport' && <label className="field field--wide field--check"><input type="checkbox" {...register('roundTrip')} /> <span>Khứ hồi (một khoản cho cả lượt đi và về)</span></label>}
      {showEndDate && <label className="field">{isStay ? 'Ngày trả phòng' : 'Ngày về'}<input type="date" min={expenseDate || tripStart} max={tripEnd} {...register('endDate', { setValueAs: (value) => value === '' || value == null ? null : value })} aria-invalid={Boolean(errors.endDate)} />{errors.endDate && <span>{errors.endDate.message}</span>}</label>}
      {isStay && nights > 0 && <p className="field field--wide field-hint" role="status">{nights} đêm · khoảng {formatCurrency(Math.round(Number(stayAmount || 0) / nights))}/đêm</p>}
      <label className="field">{isStay ? 'Dự kiến (tổng)' : 'Dự kiến'}<input type="number" inputMode="numeric" min="0" step="1000" {...register('estimatedAmountVnd', { valueAsNumber: true })} aria-invalid={Boolean(errors.estimatedAmountVnd)} />{errors.estimatedAmountVnd && <span>{errors.estimatedAmountVnd.message}</span>}</label>
      <label className="field">{isStay ? 'Thực tế (tổng)' : 'Thực tế'}<input type="number" inputMode="numeric" min="0" step="1000" placeholder="Chưa phát sinh" {...register('actualAmountVnd', { setValueAs: (value) => value === '' || value == null ? null : Number(value) })} aria-invalid={Boolean(errors.actualAmountVnd)} />{errors.actualAmountVnd && <span>{errors.actualAmountVnd.message}</span>}</label>
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
