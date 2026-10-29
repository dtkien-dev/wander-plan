import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { formatCurrency, formatDayMonth, isGoogleMapsUrl } from '../lib/format'
import { findOverlaps } from '../lib/itineraryOverlap'
import type { ItineraryDraft, ItineraryItem } from '../types'

const createSchema = (tripStart: string, tripEnd: string) => z.object({
  title: z.string().trim().min(2, 'Nhập tên địa điểm.'),
  visitDate: z.string().min(1, 'Chọn ngày.'),
  endDate: z.string().nullable(),
  startTime: z.string().min(1, 'Chọn giờ bắt đầu.'),
  endTime: z.string().min(1, 'Chọn giờ kết thúc.'),
  estimatedCostVnd: z.number().int().min(0, 'Chi phí không thể âm.'),
  address: z.string().trim().min(3, 'Nhập địa chỉ.'),
  mapsUrl: z.string().trim().refine(isGoogleMapsUrl, 'Hãy dùng Google Maps URL hợp lệ.'),
  notes: z.string().trim().max(500, 'Ghi chú tối đa 500 ký tự.'),
})
  .refine((data) => data.visitDate >= tripStart && data.visitDate <= tripEnd, { message: 'Ngày đến phải nằm trong thời gian chuyến đi.', path: ['visitDate'] })
  .refine((data) => !data.endDate || (data.endDate > data.visitDate && data.endDate <= tripEnd), { message: 'Đến ngày phải sau ngày đến và trong thời gian chuyến đi.', path: ['endDate'] })
  // Multi-day: start time is on the first day and end time on the last, so any times are valid.
  .refine((data) => Boolean(data.endDate) || data.endTime > data.startTime, { message: 'Giờ kết thúc phải sau giờ bắt đầu.', path: ['endTime'] })

interface ItineraryFormProps {
  item?: ItineraryItem
  tripStart: string
  tripEnd: string
  itinerary: ItineraryItem[]
  pending: boolean
  onSubmit: (draft: ItineraryDraft) => Promise<void>
  onCancel: () => void
}

export function ItineraryForm({ item, tripStart, tripEnd, itinerary, pending, onSubmit, onCancel }: ItineraryFormProps) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ItineraryDraft>({
    resolver: zodResolver(createSchema(tripStart, tripEnd)),
    defaultValues: item ?? {
      title: '', visitDate: tripStart, endDate: null, startTime: '08:00', endTime: '09:30', estimatedCostVnd: 0,
      address: '', mapsUrl: '', notes: '',
    },
  })
  const [visitDate, endDate, startTime, endTime, estimatedCost] = watch(['visitDate', 'endDate', 'startTime', 'endTime', 'estimatedCostVnd'])
  const clashes = findOverlaps({ id: item?.id, visitDate, endDate, startTime, endTime }, itinerary)
  return (
    <form className="form" onSubmit={handleSubmit(onSubmit)}>
      <label className="field field--wide">Tên địa điểm<input aria-required="true" {...register('title')} aria-invalid={Boolean(errors.title)} />{errors.title && <span>{errors.title.message}</span>}</label>
      <label className="field">Ngày đến<input type="date" min={tripStart} max={tripEnd} {...register('visitDate')} aria-invalid={Boolean(errors.visitDate)} />{errors.visitDate && <span>{errors.visitDate.message}</span>}</label>
      <label className="field">Đến ngày (nếu nhiều ngày)<input type="date" min={visitDate || tripStart} max={tripEnd} {...register('endDate', { setValueAs: (value) => value === '' || value == null ? null : value })} aria-invalid={Boolean(errors.endDate)} />{errors.endDate && <span>{errors.endDate.message}</span>}</label>
      <label className="field">Bắt đầu<input type="time" {...register('startTime')} aria-invalid={Boolean(errors.startTime)} />{errors.startTime && <span>{errors.startTime.message}</span>}</label>
      <label className="field">Kết thúc<input type="time" {...register('endTime')} aria-invalid={Boolean(errors.endTime)} />{errors.endTime && <span>{errors.endTime.message}</span>}</label>
      <label className="field">Chi phí dự kiến<span className="money-input"><input type="number" inputMode="numeric" min="0" step="1" {...register('estimatedCostVnd', { valueAsNumber: true })} aria-invalid={Boolean(errors.estimatedCostVnd)} /></span>{Number(estimatedCost) >= 1000 && <small className="field-preview" aria-hidden="true">{formatCurrency(Number(estimatedCost))}</small>}{errors.estimatedCostVnd && <span>{errors.estimatedCostVnd.message}</span>}</label>
      {clashes.length > 0 && <p className="form-warning field--wide" role="status">Trùng giờ với {clashes.map((clash) => `“${clash.title}” (${clash.endDate ? `${formatDayMonth(clash.visitDate)} ${clash.startTime} → ${formatDayMonth(clash.endDate)} ${clash.endTime}` : `${clash.startTime}–${clash.endTime}`})`).join(', ')}. Bạn vẫn có thể lưu.</p>}
      <label className="field field--wide">Địa chỉ<input aria-required="true" {...register('address')} aria-invalid={Boolean(errors.address)} />{errors.address && <span>{errors.address.message}</span>}</label>
      <label className="field field--wide">Google Maps URL<small className="field-optional"> (không bắt buộc)</small><input type="url" placeholder="https://maps.app.goo.gl/..." {...register('mapsUrl')} aria-invalid={Boolean(errors.mapsUrl)} />{errors.mapsUrl && <span>{errors.mapsUrl.message}</span>}</label>
      <label className="field field--wide">Ghi chú<small className="field-optional"> (không bắt buộc)</small><textarea rows={3} {...register('notes')} aria-invalid={Boolean(errors.notes)} />{errors.notes && <span>{errors.notes.message}</span>}</label>
      <div className="form__actions field--wide">
        <button className="button button--ghost" type="button" onClick={onCancel}>Hủy</button>
        <button className="button button--primary" type="submit" disabled={pending}>{pending ? 'Đang lưu…' : item ? 'Lưu thay đổi' : 'Thêm địa điểm'}</button>
      </div>
    </form>
  )
}
