import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { isGoogleMapsUrl } from '../lib/format'
import type { ItineraryDraft, ItineraryItem } from '../types'

const schema = z.object({
  title: z.string().trim().min(2, 'Nhập tên địa điểm.'),
  visitDate: z.string().min(1, 'Chọn ngày.'),
  startTime: z.string().min(1, 'Chọn giờ bắt đầu.'),
  endTime: z.string().min(1, 'Chọn giờ kết thúc.'),
  estimatedCostVnd: z.number().int().min(0, 'Chi phí không thể âm.'),
  address: z.string().trim().min(3, 'Nhập địa chỉ.'),
  mapsUrl: z.string().trim().refine(isGoogleMapsUrl, 'Hãy dùng Google Maps URL hợp lệ.'),
  notes: z.string().trim().max(500, 'Ghi chú tối đa 500 ký tự.'),
}).refine((data) => data.endTime > data.startTime, { message: 'Giờ kết thúc phải sau giờ bắt đầu.', path: ['endTime'] })

interface ItineraryFormProps {
  item?: ItineraryItem
  tripStart: string
  tripEnd: string
  pending: boolean
  onSubmit: (draft: ItineraryDraft) => Promise<void>
  onCancel: () => void
}

export function ItineraryForm({ item, tripStart, tripEnd, pending, onSubmit, onCancel }: ItineraryFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<ItineraryDraft>({
    resolver: zodResolver(schema),
    defaultValues: item ?? {
      title: '', visitDate: tripStart, startTime: '08:00', endTime: '09:30', estimatedCostVnd: 0,
      address: '', mapsUrl: '', notes: '',
    },
  })
  return (
    <form className="form" onSubmit={handleSubmit(onSubmit)}>
      <label className="field field--wide">Tên địa điểm<input {...register('title')} aria-invalid={Boolean(errors.title)} />{errors.title && <span>{errors.title.message}</span>}</label>
      <label className="field">Ngày đến<input type="date" min={tripStart} max={tripEnd} {...register('visitDate')} aria-invalid={Boolean(errors.visitDate)} />{errors.visitDate && <span>{errors.visitDate.message}</span>}</label>
      <label className="field">Chi phí dự kiến<input type="number" inputMode="numeric" min="0" step="1000" {...register('estimatedCostVnd', { valueAsNumber: true })} aria-invalid={Boolean(errors.estimatedCostVnd)} />{errors.estimatedCostVnd && <span>{errors.estimatedCostVnd.message}</span>}</label>
      <label className="field">Bắt đầu<input type="time" {...register('startTime')} aria-invalid={Boolean(errors.startTime)} />{errors.startTime && <span>{errors.startTime.message}</span>}</label>
      <label className="field">Kết thúc<input type="time" {...register('endTime')} aria-invalid={Boolean(errors.endTime)} />{errors.endTime && <span>{errors.endTime.message}</span>}</label>
      <label className="field field--wide">Địa chỉ<input {...register('address')} aria-invalid={Boolean(errors.address)} />{errors.address && <span>{errors.address.message}</span>}</label>
      <label className="field field--wide">Google Maps URL<input type="url" placeholder="https://maps.app.goo.gl/..." {...register('mapsUrl')} aria-invalid={Boolean(errors.mapsUrl)} />{errors.mapsUrl && <span>{errors.mapsUrl.message}</span>}</label>
      <label className="field field--wide">Ghi chú<textarea rows={3} {...register('notes')} aria-invalid={Boolean(errors.notes)} />{errors.notes && <span>{errors.notes.message}</span>}</label>
      <div className="form__actions field--wide">
        <button className="button button--ghost" type="button" onClick={onCancel}>Hủy</button>
        <button className="button button--primary" type="submit" disabled={pending}>{pending ? 'Đang lưu…' : item ? 'Lưu thay đổi' : 'Thêm địa điểm'}</button>
      </div>
    </form>
  )
}
