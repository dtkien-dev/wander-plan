import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { Expense, ExpenseDraft } from '../types'

const createSchema = (tripStart: string, tripEnd: string) => z.object({
  title: z.string().trim().min(2, 'Nhập tên khoản chi.'),
  category: z.enum(['food', 'transport', 'stay', 'ticket', 'other']),
  expenseDate: z.string().min(1, 'Chọn ngày.'),
  estimatedAmountVnd: z.number().int().min(0, 'Chi phí không thể âm.'),
  actualAmountVnd: z.number().int('Số tiền phải là số nguyên.').min(0, 'Chi phí không thể âm.').nullable(),
  notes: z.string().trim().max(500, 'Ghi chú tối đa 500 ký tự.'),
}).refine((data) => data.expenseDate >= tripStart && data.expenseDate <= tripEnd, { message: 'Ngày chi phải nằm trong thời gian chuyến đi.', path: ['expenseDate'] })

interface ExpenseFormProps {
  expense?: Expense
  tripStart: string
  tripEnd: string
  pending: boolean
  onSubmit: (draft: ExpenseDraft) => Promise<void>
  onCancel: () => void
}

export function ExpenseForm({ expense, tripStart, tripEnd, pending, onSubmit, onCancel }: ExpenseFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<ExpenseDraft>({
    resolver: zodResolver(createSchema(tripStart, tripEnd)),
    defaultValues: expense ?? {
      title: '', category: 'food', expenseDate: tripStart, estimatedAmountVnd: 0, actualAmountVnd: null, notes: '',
    },
  })
  return (
    <form className="form" onSubmit={handleSubmit(onSubmit)}>
      <label className="field field--wide">Khoản chi<input {...register('title')} aria-invalid={Boolean(errors.title)} />{errors.title && <span>{errors.title.message}</span>}</label>
      <label className="field">Phân loại<select {...register('category')}><option value="food">Ăn uống</option><option value="transport">Di chuyển</option><option value="stay">Lưu trú</option><option value="ticket">Vé tham quan</option><option value="other">Khác</option></select></label>
      <label className="field">Ngày<input type="date" min={tripStart} max={tripEnd} {...register('expenseDate')} aria-invalid={Boolean(errors.expenseDate)} />{errors.expenseDate && <span>{errors.expenseDate.message}</span>}</label>
      <label className="field">Dự kiến<input type="number" inputMode="numeric" min="0" step="1000" {...register('estimatedAmountVnd', { valueAsNumber: true })} aria-invalid={Boolean(errors.estimatedAmountVnd)} />{errors.estimatedAmountVnd && <span>{errors.estimatedAmountVnd.message}</span>}</label>
      <label className="field">Thực tế<input type="number" inputMode="numeric" min="0" step="1000" placeholder="Chưa phát sinh" {...register('actualAmountVnd', { setValueAs: (value) => value === '' ? null : Number(value) })} aria-invalid={Boolean(errors.actualAmountVnd)} />{errors.actualAmountVnd && <span>{errors.actualAmountVnd.message}</span>}</label>
      <label className="field field--wide">Ghi chú<textarea rows={3} maxLength={500} {...register('notes')} aria-invalid={Boolean(errors.notes)} />{errors.notes && <span>{errors.notes.message}</span>}</label>
      <div className="form__actions field--wide">
        <button className="button button--ghost" type="button" onClick={onCancel}>Hủy</button>
        <button className="button button--primary" type="submit" disabled={pending}>{pending ? 'Đang lưu…' : expense ? 'Lưu thay đổi' : 'Thêm chi phí'}</button>
      </div>
    </form>
  )
}
