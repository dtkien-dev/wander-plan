import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ItineraryForm } from './ItineraryForm'
import type { ItineraryItem } from '../types'

const museum: ItineraryItem = {
  id: 'museum', tripId: 'trip', title: 'Bảo tàng', visitDate: '2026-11-27', startTime: '09:00', endTime: '10:00',
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
})
