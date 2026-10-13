import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ExcelImportModal } from './ExcelImportModal'
import { parseTravelExcel, type TravelExcelPreview } from '../lib/travelExcel'
import type { Trip } from '../types'

vi.mock('../lib/travelExcel', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/travelExcel')>()
  return { ...actual, parseTravelExcel: vi.fn() }
})

const trip: Trip = {
  id: 'trip', name: 'Đà Lạt', destination: 'Đà Lạt', startDate: '2026-11-27', endDate: '2026-11-30',
  timezone: 'Asia/Ho_Chi_Minh', budgetVnd: 1_000_000, maxMembers: 4, version: 1,
}

const preview: TravelExcelPreview = {
  fileName: 'chi-phi.xlsx',
  itinerary: [],
  expenses: [{
    sheet: 'ChiPhi', rowNumber: 2, label: 'Ăn sáng', errors: [], action: 'create',
    data: {
      title: 'Ăn sáng', category: 'food', expenseDate: '2026-11-27',
      estimatedAmountVnd: 100_000, actualAmountVnd: null, paidByUserId: 'demo-owner', participantUserIds: ['demo-owner'], notes: '',
    },
  }],
}

describe('ExcelImportModal', () => {
  beforeEach(() => {
    vi.mocked(parseTravelExcel).mockResolvedValue(preview)
  })

  it('clears the selected preview after a successful import', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(
      <ExcelImportModal
        open
        trip={trip}
        itinerary={[]}
        expenses={[]}
        people={[{ userId: 'demo-owner', email: 'ban@example.com', displayName: 'Bạn', role: 'owner', status: 'active', joinedAt: '' }]}
        pending={false}
        onClose={vi.fn()}
        onSubmit={onSubmit}
      />,
    )

    fireEvent.change(screen.getByLabelText(/Chọn file Excel \.xlsx/), {
      target: { files: [new File(['xlsx'], 'chi-phi.xlsx')] },
    })
    expect(await screen.findByText('chi-phi.xlsx')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Áp dụng 1 thay đổi' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(screen.queryByText('chi-phi.xlsx')).not.toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Nhập dữ liệu' })).toBeDisabled()
  })
})
