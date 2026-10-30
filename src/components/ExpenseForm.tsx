import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { MAX_SHARE_UNITS, splitExpenseAmount, splitTargetAmount, validateSplit } from '../lib/expenseSettlement'
import { countNights, formatCurrency } from '../lib/format'
import type { Expense, ExpenseCategory, ExpenseDraft, FormerPerson, SplitMethod, TripPerson } from '../types'

// Shares and amounts keep separate inputs so switching method never reuses the other unit.
type ExpenseFormValues = Omit<ExpenseDraft, 'splitMethod' | 'splitValues'> & {
  roundTrip: boolean
  splitMethod: SplitMethod
  shareUnits: Record<string, number>
  shareAmounts: Record<string, number>
}

const splitLabels: Record<SplitMethod, string> = { equal: 'Chia đều', shares: 'Theo phần', amounts: 'Theo số tiền' }
const toNumber = (value: unknown) => value === '' || value == null ? Number.NaN : Number(value)
const pickValues = (values: Record<string, number>, userIds: string[]) => Object.fromEntries(userIds.map((userId) => [userId, values?.[userId] ?? Number.NaN]))

const startDateLabels: Partial<Record<ExpenseCategory, string>> = { transport: 'Ngày đi', stay: 'Ngày nhận phòng' }

const createSchema = (tripStart: string, tripEnd: string, activeUserIds: string[], formerParticipantIds: string[], formerPayerId: string | null) => z.object({
  title: z.string().trim().min(2, 'Nhập tên khoản chi.'),
  category: z.enum(['food', 'transport', 'stay', 'ticket', 'other']),
  expenseDate: z.string().min(1, 'Chọn ngày.'),
  endDate: z.string().nullable(),
  roundTrip: z.boolean(),
  estimatedAmountVnd: z.number().int().min(0, 'Chi phí không thể âm.'),
  actualAmountVnd: z.number().int('Số tiền phải là số nguyên.').min(0, 'Chi phí không thể âm.').nullable(),
  paidByUserId: z.string().refine((value) => activeUserIds.includes(value) || value === formerPayerId, 'Chọn một thành viên đang hoạt động.'),
  participantUserIds: z.array(z.string()).refine((values) => values.length + formerParticipantIds.length > 0, 'Chọn ít nhất một người tham gia.')
    .refine((values) => values.every((value) => activeUserIds.includes(value)), 'Người tham gia phải đang thuộc chuyến đi.'),
  notes: z.string().trim().max(500, 'Ghi chú tối đa 500 ký tự.'),
  splitMethod: z.enum(['equal', 'shares', 'amounts']),
  shareUnits: z.record(z.string(), z.number().or(z.nan())),
  shareAmounts: z.record(z.string(), z.number().or(z.nan())),
}).superRefine((data, context) => {
  const splitError = validateSplit(toDraft(data, formerParticipantIds))
  if (splitError) context.addIssue({ code: 'custom', message: splitError, path: ['splitMethod'] })
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

// Former members are not editable checkboxes; they stay on the expense they were part of.
function toDraft({ roundTrip, shareUnits, shareAmounts, ...values }: ExpenseFormValues, formerParticipantIds: string[]): ExpenseDraft {
  const participantUserIds = [...values.participantUserIds, ...formerParticipantIds]
  const splitValues = values.splitMethod === 'equal' ? {} : pickValues(values.splitMethod === 'shares' ? shareUnits : shareAmounts, participantUserIds)
  return {
    ...values,
    participantUserIds,
    splitValues,
    endDate: values.category === 'stay' || (values.category === 'transport' && roundTrip) ? values.endDate : null,
  }
}

interface ExpenseFormProps {
  expense?: Expense
  tripStart: string
  tripEnd: string
  pending: boolean
  people: TripPerson[]
  currentUserId: string
  formerPeople?: FormerPerson[]
  onSubmit: (draft: ExpenseDraft) => Promise<void>
  onCancel: () => void
}

export function ExpenseForm({ expense, tripStart, tripEnd, pending, people, currentUserId, formerPeople = [], onSubmit, onCancel }: ExpenseFormProps) {
  const activePeople = people.filter((person): person is TripPerson & { userId: string } => person.status === 'active' && Boolean(person.userId))
  const activeUserIds = activePeople.map((person) => person.userId)
  const formerName = (userId: string) => `${formerPeople.find((person) => person.userId === userId)?.displayName ?? 'Thành viên cũ'} (đã rời nhóm)`
  const formerParticipants = (expense?.participantUserIds ?? []).filter((userId) => !activeUserIds.includes(userId)).map((userId) => ({ userId, displayName: formerName(userId) }))
  const formerParticipantIds = formerParticipants.map((person) => person.userId)
  const formerPayerId = expense && !activeUserIds.includes(expense.paidByUserId) ? expense.paidByUserId : null
  // A024: an expense that involves someone who left keeps its money exactly as recorded.
  const moneyLocked = formerParticipantIds.length > 0 || formerPayerId !== null
  const nameOf = (userId: string) => activePeople.find((person) => person.userId === userId)?.displayName ?? formerName(userId)
  const savedMethod = expense?.splitMethod ?? 'equal'
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ExpenseFormValues>({
    resolver: zodResolver(createSchema(tripStart, tripEnd, activeUserIds, formerParticipantIds, formerPayerId)),
    defaultValues: {
      ...(expense
        ? { ...expense, participantUserIds: expense.participantUserIds.filter((userId) => activeUserIds.includes(userId)), roundTrip: expense.category === 'transport' && Boolean(expense.endDate) }
        : {
            title: '', category: 'food', expenseDate: tripStart, endDate: null, roundTrip: false, estimatedAmountVnd: 0, actualAmountVnd: null,
            paidByUserId: activeUserIds.includes(currentUserId) ? currentUserId : activeUserIds[0] ?? '',
            participantUserIds: activeUserIds, notes: '',
          }),
      splitMethod: savedMethod,
      shareUnits: Object.fromEntries([...activeUserIds, ...formerParticipantIds].map((userId) => [userId, savedMethod === 'shares' ? expense?.splitValues?.[userId] ?? 1 : 1])),
      shareAmounts: savedMethod === 'amounts' ? { ...expense?.splitValues } : {},
    },
  })
  const [category, roundTrip, expenseDate, endDate, estimated, actual, splitMethod, participantUserIds, paidByUserId, shareUnits, shareAmounts] = watch(['category', 'roundTrip', 'expenseDate', 'endDate', 'estimatedAmountVnd', 'actualAmountVnd', 'splitMethod', 'participantUserIds', 'paidByUserId', 'shareUnits', 'shareAmounts'])
  // Split rows only render while money is editable, so they never include former members.
  const selectedPeople = activePeople.filter((person) => participantUserIds?.includes(person.userId))
  const splitTarget = splitTargetAmount({ actualAmountVnd: actual, estimatedAmountVnd: Number.isFinite(estimated) ? estimated : 0 })
  const amountTotal = selectedPeople.reduce((sum, person) => sum + (Number.isFinite(shareAmounts?.[person.userId]) ? shareAmounts[person.userId] : 0), 0)
  const shareDraft = { participantUserIds, paidByUserId, splitMethod, splitValues: pickValues(shareUnits, participantUserIds ?? []), actualAmountVnd: actual, estimatedAmountVnd: estimated }
  const sharePreview = splitMethod === 'shares' && validateSplit(shareDraft) === null
    ? new Map(splitExpenseAmount(splitTarget, shareDraft).map((share) => [share.userId, share.amountVnd]))
    : null
  const isStay = category === 'stay'
  const showEndDate = isStay || (category === 'transport' && roundTrip)
  const nights = isStay && endDate && endDate > expenseDate ? countNights(expenseDate, endDate) : 0
  const stayAmount = actual ?? estimated
  return (
    <form className="form" onSubmit={handleSubmit((values) => onSubmit(toDraft(values, formerParticipantIds)))}>
      <label className="field field--wide">Khoản chi<input aria-required="true" {...register('title')} aria-invalid={Boolean(errors.title)} />{errors.title && <span>{errors.title.message}</span>}</label>
      <label className="field">Phân loại<select {...register('category')}><option value="food">Ăn uống</option><option value="transport">Di chuyển</option><option value="stay">Lưu trú</option><option value="ticket">Vé tham quan</option><option value="other">Khác</option></select></label>
      <label className="field">{startDateLabels[category] ?? 'Ngày'}<input type="date" min={tripStart} max={tripEnd} {...register('expenseDate')} aria-invalid={Boolean(errors.expenseDate)} />{errors.expenseDate && <span>{errors.expenseDate.message}</span>}</label>
      {category === 'transport' && <label className="field field--wide field--check"><input type="checkbox" {...register('roundTrip')} /> <span>Khứ hồi (một khoản cho cả lượt đi và về)</span></label>}
      {showEndDate && <label className="field">{isStay ? 'Ngày trả phòng' : 'Ngày về'}<input type="date" min={expenseDate || tripStart} max={tripEnd} {...register('endDate', { setValueAs: (value) => value === '' || value == null ? null : value })} aria-invalid={Boolean(errors.endDate)} />{errors.endDate && <span>{errors.endDate.message}</span>}</label>}
      {isStay && nights > 0 && <p className="field field--wide field-hint" role="status">{nights} đêm · khoảng {formatCurrency(Math.round(Number(stayAmount || 0) / nights))}/đêm</p>}
      {moneyLocked ? (
        <div className="field field--wide locked-money" role="note">
          <strong>Phần tiền đã khóa vì có người đã rời nhóm</strong>
          <p>Dự kiến {formatCurrency(expense!.estimatedAmountVnd)} · Thực tế {expense!.actualAmountVnd === null ? 'chưa phát sinh' : formatCurrency(expense!.actualAmountVnd)}</p>
          <p>Trả bởi {nameOf(expense!.paidByUserId)} · {splitLabels[savedMethod]}: {expense!.participantUserIds.map(nameOf).join(', ')}</p>
          <p className="field-hint">Vẫn sửa được tên, phân loại, ngày và ghi chú.</p>
        </div>
      ) : (
        <>
        <label className="field">{isStay ? 'Dự kiến (tổng)' : 'Dự kiến'}<span className="money-input"><input type="number" inputMode="numeric" min="0" step="1" {...register('estimatedAmountVnd', { valueAsNumber: true })} aria-invalid={Boolean(errors.estimatedAmountVnd)} /></span>{Number(estimated) >= 1000 && <small className="field-preview" aria-hidden="true">{formatCurrency(Number(estimated))}</small>}{errors.estimatedAmountVnd && <span>{errors.estimatedAmountVnd.message}</span>}</label>
        <label className="field">{isStay ? 'Thực tế (tổng)' : 'Thực tế'}<small className="field-optional"> (không bắt buộc)</small><span className="money-input"><input type="number" inputMode="numeric" min="0" step="1" placeholder="Chưa phát sinh" {...register('actualAmountVnd', { setValueAs: (value) => value === '' || value == null ? null : Number(value) })} aria-invalid={Boolean(errors.actualAmountVnd)} /></span>{Number(actual) >= 1000 && <small className="field-preview" aria-hidden="true">{formatCurrency(Number(actual))}</small>}{errors.actualAmountVnd && <span>{errors.actualAmountVnd.message}</span>}</label>
        <label className="field field--wide">Người thanh toán<select {...register('paidByUserId')} aria-invalid={Boolean(errors.paidByUserId)}>{activePeople.map((person) => <option key={person.userId} value={person.userId}>{person.displayName}</option>)}</select>{errors.paidByUserId && <span>{errors.paidByUserId.message}</span>}</label>
        <fieldset className="field field--wide participant-field"><legend>Người tham gia</legend><div>{activePeople.map((person) => <label key={person.userId}><input type="checkbox" value={person.userId} {...register('participantUserIds')} /> <span>{person.displayName}</span></label>)}</div>{errors.participantUserIds && <span>{errors.participantUserIds.message}</span>}</fieldset>
        <fieldset className="field field--wide split-field" aria-describedby={errors.splitMethod ? 'split-error' : undefined}>
          <legend>Cách chia</legend>
          <div className="split-field__methods">{(Object.keys(splitLabels) as SplitMethod[]).map((method) => <label key={method}><input type="radio" value={method} {...register('splitMethod')} /> <span>{splitLabels[method]}</span></label>)}</div>
          {splitMethod !== 'equal' && selectedPeople.length > 0 && (
            <div className="split-field__rows">
              {selectedPeople.map((person) => splitMethod === 'shares'
                ? <label key={`shares-${person.userId}`}><span>{person.displayName}</span><input type="number" inputMode="numeric" min="1" max={MAX_SHARE_UNITS} step="1" aria-label={`Số phần của ${person.displayName}`} {...register(`shareUnits.${person.userId}`, { setValueAs: toNumber })} /><small>{sharePreview ? formatCurrency(sharePreview.get(person.userId) ?? 0) : '—'}</small></label>
                : <label key={`amounts-${person.userId}`}><span>{person.displayName}</span><span className="money-input"><input type="number" inputMode="numeric" min="0" step="1" aria-label={`Số tiền của ${person.displayName}`} {...register(`shareAmounts.${person.userId}`, { setValueAs: toNumber })} /></span></label>)}
              <p className={`field-hint ${splitMethod === 'amounts' ? (amountTotal === splitTarget ? 'field-hint--ok' : 'field-hint--off') : ''}`} role="status">{splitMethod === 'shares'
                ? `Tính trên ${formatCurrency(splitTarget)}; phần lẻ do người thanh toán chịu nếu có tham gia.`
                : `Đã chia ${formatCurrency(amountTotal)} / ${formatCurrency(splitTarget)}${amountTotal === splitTarget ? '' : ` · còn lệch ${formatCurrency(Math.abs(splitTarget - amountTotal))}`}`}</p>
            </div>
          )}
          {errors.splitMethod && <span id="split-error">{errors.splitMethod.message}</span>}
        </fieldset>
        </>
      )}
      <label className="field field--wide">Ghi chú<small className="field-optional"> (không bắt buộc)</small><textarea rows={3} maxLength={500} {...register('notes')} aria-invalid={Boolean(errors.notes)} />{errors.notes && <span>{errors.notes.message}</span>}</label>
      <div className="form__actions field--wide">
        <button className="button button--ghost" type="button" onClick={onCancel}>Hủy</button>
        <button className="button button--primary" type="submit" disabled={pending}>{pending ? 'Đang lưu…' : expense ? 'Lưu thay đổi' : 'Thêm chi phí'}</button>
      </div>
    </form>
  )
}
