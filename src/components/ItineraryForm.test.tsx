import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ItineraryForm } from './ItineraryForm'
import type { ItineraryItem } from '../types'

const museum: ItineraryItem = {
  id: 'museum', tripId: 'trip', title: 'Bảo tàng', visitDate: '2026-11-27', endDate: null, startTime: '09:00', endTime: '10:00',
  estimatedCostVnd: 0, address: 'Quận 1', mapsUrl: 'https://maps.app.goo.gl/abc', notes: '', version: 1,
}

const renderForm = (props: Partial<Parameters<typeof ItineraryForm>[0]> = {}) => render(
  <ItineraryForm tripStart="2026-11-27" tripEnd="2026-11-30" itinerary={[museum]} pending={false} onSubmit={vi.fn()} onCancel={vi.fn()} {...props} />,
)

afterEach(cleanup)

describe('ItineraryForm overlap warning', () => {
  it('warns while the time overlaps another activity and clears when it no longer does', () => {
    renderForm()
    expect(screen.getByRole('status')).toHaveTextContent('Trùng giờ với “Bảo tàng” (09:00–10:00)')
    fireEvent.change(screen.getByLabelText('Bắt đầu'), { target: { value: '10:00' } })
    fireEvent.change(screen.getByLabelText('Kết thúc'), { target: { value: '11:00' } })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('names the dates of an overlapping multi-day activity', () => {
    renderForm({ itinerary: [{ ...museum, id: 'trek', title: 'Trekking', endDate: '2026-11-29', startTime: '20:00', endTime: '08:00' }] })
    fireEvent.change(screen.getByLabelText('Ngày đến'), { target: { value: '2026-11-28' } })
    expect(screen.getByRole('status')).toHaveTextContent('Trùng giờ với “Trekking” (27/11 20:00 → 29/11 08:00)')
  })

  it('does not warn about the item being edited', () => {
    renderForm({ item: museum })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('still saves an overlapping activity', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    renderForm({ onSubmit })
    fireEvent.change(screen.getByLabelText('Tên địa điểm'), { target: { value: 'Ăn sáng' } })
    fireEvent.change(screen.getByLabelText('Địa chỉ'), { target: { value: 'Chợ Bến Thành' } })
    fireEvent.change(screen.getByLabelText('Google Maps URL'), { target: { value: 'https://maps.app.goo.gl/xyz' } })
    fireEvent.click(screen.getByRole('button', { name: 'Thêm địa điểm' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ title: 'Ăn sáng', startTime: '08:00' }), expect.anything()))
  })

  it('saves a multi-day activity that ends earlier in the day than it starts', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    renderForm({ itinerary: [], onSubmit })
    fireEvent.change(screen.getByLabelText('Tên địa điểm'), { target: { value: 'Trekking' } })
    fireEvent.change(screen.getByLabelText('Đến ngày (nếu nhiều ngày)'), { target: { value: '2026-11-29' } })
    fireEvent.change(screen.getByLabelText('Bắt đầu'), { target: { value: '20:00' } })
    fireEvent.change(screen.getByLabelText('Kết thúc'), { target: { value: '08:00' } })
    fireEvent.change(screen.getByLabelText('Địa chỉ'), { target: { value: 'Lạc Dương' } })
    fireEvent.change(screen.getByLabelText('Google Maps URL'), { target: { value: 'https://maps.app.goo.gl/xyz' } })
    fireEvent.click(screen.getByRole('button', { name: 'Thêm địa điểm' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ endDate: '2026-11-29', startTime: '20:00', endTime: '08:00' }), expect.anything()))
  })

  it('rejects an end date that is not after the start date', async () => {
    const onSubmit = vi.fn()
    renderForm({ itinerary: [], onSubmit })
    fireEvent.change(screen.getByLabelText('Đến ngày (nếu nhiều ngày)'), { target: { value: '2026-11-27' } })
    fireEvent.click(screen.getByRole('button', { name: 'Thêm địa điểm' }))
    expect(await screen.findByText('Đến ngày phải sau ngày đến và trong thời gian chuyến đi.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
