import { describe, expect, it } from 'vitest'
import readXlsxFile from 'read-excel-file/node'
import writeXlsxFile from 'write-excel-file/node'
import { buildTravelExcelPreview, buildTravelExcelReportSheets, getImportDraft } from './travelExcel'
import { demoWorkspace } from '../data/demoData'
import type { Trip } from '../types'

const trip: Trip = {
  id: 'trip', name: 'Đà Lạt', destination: 'Đà Lạt', startDate: '2026-11-27', endDate: '2026-11-30',
  timezone: 'Asia/Ho_Chi_Minh', budgetVnd: 1_000_000, maxMembers: 4, version: 1,
}

describe('travel Excel import', () => {
  it.each(['1e3', 'abc123', '1.5', '12,34', '1.000,000', true, '9007199254740992', 9007199254740992])('rejects malformed or unsafe money: %s', (amount) => {
    const preview = buildTravelExcelPreview('money.xlsx', [{ sheet: 'ChiPhi', data: [
      ['Khoản chi', 'Phân loại', 'Ngày', 'Dự kiến', 'Thực tế', 'Người thanh toán', 'Người tham gia', 'Ghi chú'],
      ['Ăn sáng', 'Ăn uống', '2026-11-28', amount, '', 'ban@example.com', 'ban@example.com', ''],
    ] }], trip, [], [], demoWorkspace.people)
    expect(preview.expenses[0].errors).toContain('Số tiền dự kiến phải là số nguyên không âm')
    expect(getImportDraft(preview).expenses).toEqual([])
  })

  it.each(['1234567', '1.234.567', '1,234,567', '1 234 567', '1\u00a0234\u00a0567', 1234567])('accepts whole money with consistent thousands groups: %s', (amount) => {
    const preview = buildTravelExcelPreview('money.xlsx', [{ sheet: 'ChiPhi', data: [
      ['Khoản chi', 'Phân loại', 'Ngày', 'Dự kiến', 'Thực tế', 'Người thanh toán', 'Người tham gia', 'Ghi chú'],
      ['Ăn sáng', 'Ăn uống', '2026-11-28', amount, '', 'ban@example.com', 'ban@example.com', ''],
    ] }], trip, [], [], demoWorkspace.people)
    expect(preview.expenses[0]).toMatchObject({ errors: [], data: { estimatedAmountVnd: 1234567, actualAmountVnd: null } })
  })

  it('reads optional end dates and keeps saved ranges when the column is absent', () => {
    const header = ['Khoản chi', 'Phân loại', 'Ngày', 'Dự kiến', 'Thực tế', 'Người thanh toán', 'Người tham gia', 'Ghi chú']
    const ranged = buildTravelExcelPreview('trip.xlsx', [{ sheet: 'ChiPhi', data: [
      [...header, 'Đến ngày'],
      ['Khách sạn', 'Lưu trú', '2026-11-27', 1800000, '', 'ban@example.com', 'ban@example.com', '', '2026-11-30'],
      ['Ăn tối', 'Ăn uống', '2026-11-27', 200000, '', 'ban@example.com', 'ban@example.com', '', '2026-11-28'],
      ['Phòng 0 đêm', 'Lưu trú', '2026-11-28', 1, '', 'ban@example.com', 'ban@example.com', '', '2026-11-28'],
    ] }], trip, [], [], demoWorkspace.people)
    expect(ranged.expenses[0]).toMatchObject({ errors: [], data: { endDate: '2026-11-30' } })
    expect(ranged.expenses[1].errors).toContain('Chỉ Di chuyển khứ hồi và Lưu trú mới có Đến ngày')
    expect(ranged.expenses[2].errors).toContain('Ngày trả phòng phải sau ngày nhận phòng')

    const existing = {
      id: 'bus', tripId: trip.id, title: 'Xe khứ hồi', category: 'transport' as const, expenseDate: '2026-11-27', endDate: '2026-11-30',
      estimatedAmountVnd: 500000, actualAmountVnd: null, paidByUserId: 'demo-owner', participantUserIds: ['demo-owner'], notes: '', version: 2,
    }
    const legacyFile = buildTravelExcelPreview('trip.xlsx', [{ sheet: 'ChiPhi', data: [
      [...header, 'ID', 'Version'],
      ['Xe khứ hồi', 'Di chuyển', '2026-11-27', 500000, '', 'ban@example.com', 'ban@example.com', '', 'bus', 2],
    ] }], trip, [], [existing], demoWorkspace.people)
    expect(legacyFile.expenses[0]).toMatchObject({ action: 'skip', data: { endDate: '2026-11-30' } })
  })

  it('imports split columns, keeps saved splits for files without them and exports both columns', () => {
    const header = ['Khoản chi', 'Phân loại', 'Ngày', 'Dự kiến', 'Thực tế', 'Người thanh toán', 'Người tham gia', 'Ghi chú']
    const both = 'ban@example.com, banthan@example.com'
    const preview = buildTravelExcelPreview('trip.xlsx', [{ sheet: 'ChiPhi', data: [
      [...header, 'Cách chia', 'Chi tiết chia'],
      ['Phòng', 'Lưu trú', '2026-11-27', 300000, '', 'ban@example.com', both, '', 'Theo phần', 'ban@example.com: 2; banthan@example.com: 1'],
      ['Ăn tối', 'Ăn uống', '2026-11-27', 0, 150000, 'ban@example.com', both, '', 'Theo số tiền', 'ban@example.com: 50.000; banthan@example.com: 90.000'],
      ['Vé', 'Vé tham quan', '2026-11-28', 1000, '', 'ban@example.com', both, '', 'Kiểu lạ', ''],
      ['Cà phê', 'Ăn uống', '2026-11-28', 1000, '', 'ban@example.com', both, '', '', ''],
      ['Taxi', 'Di chuyển', '2026-11-28', 1000, '', 'ban@example.com', 'ban@example.com', '', 'Theo phần', 'la@example.com: 1'],
    ] }], trip, [], [], demoWorkspace.people)
    expect(preview.expenses[0]).toMatchObject({ errors: [], data: { splitMethod: 'shares', splitValues: { 'demo-owner': 2, 'demo-editor': 1 } } })
    expect(preview.expenses[1].errors[0]).toMatch(/thiếu 10\.000/)
    expect(preview.expenses[2].errors).toContain('Cách chia phải là Chia đều, Theo phần hoặc Theo số tiền')
    expect(preview.expenses[3]).toMatchObject({ errors: [], data: { splitMethod: 'equal', splitValues: {} } })
    expect(preview.expenses[4].errors).toContain('Chi tiết chia có email không thuộc chuyến đi hoặc thiếu số')

    const saved = {
      id: 'room', tripId: trip.id, title: 'Phòng', category: 'stay' as const, expenseDate: '2026-11-27', endDate: null,
      estimatedAmountVnd: 300000, actualAmountVnd: null, paidByUserId: 'demo-owner', participantUserIds: ['demo-owner', 'demo-editor'],
      splitMethod: 'shares' as const, splitValues: { 'demo-owner': 2, 'demo-editor': 1 }, notes: '', version: 3,
    }
    const legacy = buildTravelExcelPreview('trip.xlsx', [{ sheet: 'ChiPhi', data: [
      [...header, 'ID', 'Version'],
      ['Phòng', 'Lưu trú', '2026-11-27', 300000, '', 'ban@example.com', both, '', 'room', 3],
    ] }], trip, [], [saved], demoWorkspace.people)
    expect(legacy.expenses[0]).toMatchObject({ action: 'skip', data: { splitMethod: 'shares' } })

    const sheet = buildTravelExcelReportSheets({ ...demoWorkspace, expenses: [saved] }).find((entry) => entry.sheet === 'ChiPhi')!
    const headerRow = sheet.data[0].map((cell: any) => cell.value)
    const row = sheet.data[1] as unknown[]
    expect(row[headerRow.indexOf('Cách chia')]).toBe('Theo phần')
    expect(row[headerRow.indexOf('Chi tiết chia')]).toBe('ban@example.com: 2; banthan@example.com: 1')
  })

  it('keeps former members of an exported expense when the file is imported again', () => {
    const header = ['Khoản chi', 'Phân loại', 'Ngày', 'Dự kiến', 'Thực tế', 'Người thanh toán', 'Người tham gia', 'Ghi chú']
    const saved = {
      id: 'old', tripId: trip.id, title: 'Ăn tối', category: 'food' as const, expenseDate: '2026-11-27', endDate: null,
      estimatedAmountVnd: 0, actualAmountVnd: 90000, paidByUserId: 'gone', participantUserIds: ['demo-owner', 'gone'],
      splitMethod: 'amounts' as const, splitValues: { 'demo-owner': 30000, gone: 60000 }, notes: '', version: 2,
    }
    const exported = buildTravelExcelReportSheets({ ...demoWorkspace, expenses: [saved] }).find((entry) => entry.sheet === 'ChiPhi')!
    const headerRow = exported.data[0].map((cell: any) => cell.value)
    const row = exported.data[1] as any[]
    expect(row[headerRow.indexOf('Chi tiết chia')]).toBe('ban@example.com: 30000')
    const preview = buildTravelExcelPreview('trip.xlsx', [{ sheet: 'ChiPhi', data: [
      [...header, 'Cách chia', 'Chi tiết chia', 'ID', 'Version'],
      ['Ăn tối sửa', 'Ăn uống', '2026-11-27', 0, 90000, '', 'ban@example.com', '', 'Theo số tiền', 'ban@example.com: 30000', 'old', 2],
    ] }], trip, [], [saved], demoWorkspace.people)
    expect(preview.expenses[0]).toMatchObject({ errors: [], action: 'update', data: { paidByUserId: 'gone', participantUserIds: ['demo-owner', 'gone'], splitValues: { 'demo-owner': 30000, gone: 60000 } } })
    const changed = buildTravelExcelPreview('trip.xlsx', [{ sheet: 'ChiPhi', data: [
      [...header, 'Cách chia', 'Chi tiết chia', 'ID', 'Version'],
      ['Ăn tối', 'Ăn uống', '2026-11-27', 0, 120000, '', 'ban@example.com', '', 'Theo số tiền', 'ban@example.com: 60000', 'old', 2],
    ] }], trip, [], [saved], demoWorkspace.people)
    expect(changed.expenses[0].errors).toContain('Khoản chi có người đã rời nhóm: không thể đổi số tiền, cách chia, người trả hay người tham gia')
  })

  it('parses Vietnamese template rows and maps expense categories', () => {
    const preview = buildTravelExcelPreview('trip.xlsx', [
      { sheet: 'LichTrinh', data: [
        ['Tên địa điểm', 'Ngày', 'Bắt đầu', 'Kết thúc', 'Chi phí dự kiến', 'Địa chỉ', 'Google Maps URL', 'Ghi chú'],
        ['Đồi chè', '28/11/2026', '05:30', '08:00', '350.000', 'Cầu Đất', '', 'Mang áo ấm'],
      ] },
      { sheet: 'ChiPhi', data: [
        ['Khoản chi', 'Phân loại', 'Ngày', 'Dự kiến', 'Thực tế', 'Người thanh toán', 'Người tham gia', 'Ghi chú'],
        ['Ăn sáng', 'Ăn uống', '2026-11-28', 200000, '', 'ban@example.com', 'ban@example.com, banthan@example.com', ''],
      ] },
    ], trip, [], [], demoWorkspace.people)

    expect(preview.itinerary[0].data).toMatchObject({ visitDate: '2026-11-28', estimatedCostVnd: 350000 })
    expect(preview.expenses[0].data).toMatchObject({ category: 'food', actualAmountVnd: null })
    expect(preview.itinerary[0].action).toBe('create')
    expect(preview.expenses[0].action).toBe('create')
    expect(getImportDraft(preview)).toEqual({
      itinerary: [{ draft: preview.itinerary[0].data, id: undefined, version: undefined }],
      expenses: [{ draft: preview.expenses[0].data, id: undefined, version: undefined }],
    })
  })

  it('reports invalid rows and skips duplicates from existing data or the same file', () => {
    const preview = buildTravelExcelPreview('trip.xlsx', [{ sheet: 'ChiPhi', data: [
      ['Khoản chi', 'Phân loại', 'Ngày', 'Dự kiến', 'Thực tế', 'Người thanh toán', 'Người tham gia', 'Ghi chú'],
      ['Homestay', 'Lưu trú', '2026-11-27', 2400000, 2250000, 'ban@example.com', 'ban@example.com, banthan@example.com', ''],
      ['Homestay', 'Lưu trú', '2026-11-27', 2400000, 2250000, 'ban@example.com', 'ban@example.com, banthan@example.com', ''],
      ['Taxi', 'Không rõ', '2026-12-01', -1, '', 'ban@example.com', 'ban@example.com', ''],
    ] }], trip, [], [{
      id: 'e1', tripId: trip.id, title: 'Homestay', category: 'stay', expenseDate: '2026-11-27', endDate: null,
      estimatedAmountVnd: 2400000, actualAmountVnd: 2250000, paidByUserId: 'demo-owner', participantUserIds: ['demo-owner', 'demo-editor'], notes: '', version: 1,
    }], demoWorkspace.people)

    expect(preview.expenses[0].action).toBe('skip')
    expect(preview.expenses[1].action).toBe('skip')
    expect(preview.expenses[2].errors).toEqual(expect.arrayContaining([
      'Phân loại không hợp lệ', 'Ngày nằm ngoài chuyến đi', 'Số tiền dự kiến phải là số nguyên không âm',
    ]))
    expect(getImportDraft(preview).expenses).toEqual([])
  })

  it('rejects impossible dates and non-numeric money instead of treating them as valid values', () => {
    const preview = buildTravelExcelPreview('trip.xlsx', [{ sheet: 'ChiPhi', data: [
      ['Khoản chi', 'Phân loại', 'Ngày', 'Dự kiến', 'Thực tế', 'Người thanh toán', 'Người tham gia', 'Ghi chú'],
      ['Taxi', 'Di chuyển', '31/11/2026', 'không rõ', '', 'ban@example.com', 'ban@example.com', ''],
    ] }], trip, [], [], demoWorkspace.people)

    expect(preview.expenses[0].errors).toEqual(expect.arrayContaining([
      'Ngày không hợp lệ', 'Số tiền dự kiến phải là số nguyên không âm',
    ]))
  })

  it('recognizes edited exported rows as optimistic updates', () => {
    const existing = {
      id: 'expense-1', tripId: trip.id, title: 'Homestay', category: 'stay' as const, expenseDate: '2026-11-27', endDate: null,
      estimatedAmountVnd: 2400000, actualAmountVnd: null, paidByUserId: 'demo-owner', participantUserIds: ['demo-owner'], notes: '', version: 4,
    }
    const preview = buildTravelExcelPreview('trip.xlsx', [{ sheet: 'ChiPhi', data: [
      ['Khoản chi', 'Phân loại', 'Ngày', 'Dự kiến', 'Thực tế', 'Người thanh toán', 'Người tham gia', 'Ghi chú', 'Đang tính', 'Trạng thái', 'ID', 'Version'],
      ['Homestay mới', 'Lưu trú', '2026-11-27', 2500000, '', 'ban@example.com', 'ban@example.com', 'Đã sửa', 2500000, 'Dự kiến', existing.id, existing.version],
    ] }], trip, [], [existing], demoWorkspace.people)

    expect(preview.expenses[0].action).toBe('update')
    expect(getImportDraft(preview).expenses[0]).toMatchObject({
      id: existing.id, version: existing.version,
      draft: { title: 'Homestay mới', estimatedAmountVnd: 2500000, notes: 'Đã sửa' },
    })
  })

  it('skips unchanged exported rows and reports stale versions as conflicts', () => {
    const existing = {
      id: 'expense-1', tripId: trip.id, title: 'Homestay', category: 'stay' as const, expenseDate: '2026-11-27', endDate: null,
      estimatedAmountVnd: 2400000, actualAmountVnd: null, paidByUserId: 'demo-owner', participantUserIds: ['demo-owner'], notes: '', version: 4,
    }
    const header = ['Khoản chi', 'Phân loại', 'Ngày', 'Dự kiến', 'Thực tế', 'Người thanh toán', 'Người tham gia', 'Ghi chú', 'ID', 'Version']
    const unchanged = buildTravelExcelPreview('trip.xlsx', [{ sheet: 'ChiPhi', data: [
      header, ['Homestay', 'Lưu trú', '2026-11-27', 2400000, '', 'ban@example.com', 'ban@example.com', '', existing.id, 4],
    ] }], trip, [], [existing], demoWorkspace.people)
    const stale = buildTravelExcelPreview('trip.xlsx', [{ sheet: 'ChiPhi', data: [
      header, ['Homestay mới', 'Lưu trú', '2026-11-27', 2500000, '', 'ban@example.com', 'ban@example.com', '', existing.id, 3],
    ] }], trip, [], [existing], demoWorkspace.people)
    const missingId = buildTravelExcelPreview('trip.xlsx', [{ sheet: 'ChiPhi', data: [
      header, ['Homestay mới', 'Lưu trú', '2026-11-27', 2500000, '', 'ban@example.com', 'ban@example.com', '', '', 4],
    ] }], trip, [], [existing], demoWorkspace.people)

    expect(unchanged.expenses[0]).toMatchObject({ action: 'skip', statusMessage: 'Không có thay đổi' })
    expect(stale.expenses[0].action).toBe('conflict')
    expect(stale.expenses[0].statusMessage).toContain('Version đã thay đổi')
    expect(missingId.expenses[0]).toMatchObject({ action: 'conflict', statusMessage: expect.stringContaining('thiếu ID') })
    expect(getImportDraft(stale).expenses).toEqual([])
  })

  it('builds a shareable report with summary totals and typed Excel dates', () => {
    const sheets = buildTravelExcelReportSheets(demoWorkspace, new Date(2026, 9, 13, 9, 30))
    const summary = sheets.find((sheet) => sheet.sheet === 'TongQuan')!
    const itinerary = sheets.find((sheet) => sheet.sheet === 'LichTrinh')!
    const cellValue = (cell: unknown) => typeof cell === 'object' && cell !== null && 'value' in cell
      ? (cell as { value: unknown }).value
      : cell
    const summaryRow = summary.data.find((row) => cellValue(row[0]) === 'Chi phí đang tính')!

    expect(sheets.map((sheet) => sheet.sheet)).toEqual(['TongQuan', 'LichTrinh', 'ChiPhi'])
    expect(cellValue(summaryRow[1])).toBe(3_150_000)
    expect(cellValue(itinerary.data[1][1])).toBeInstanceOf(Date)
    expect(cellValue(itinerary.data[1][0])).toBe('Cà phê bên đồi thông')
    expect(itinerary.data[0].map(cellValue)).toEqual(expect.arrayContaining(['ID', 'Version']))
    const expenses = sheets.find((sheet) => sheet.sheet === 'ChiPhi')!
    const endDateColumn = expenses.data[0].map(cellValue).indexOf('Đến ngày')
    const homestay = expenses.data.find((row) => cellValue(row[0]) === 'Homestay 3 đêm')!
    expect(endDateColumn).toBeGreaterThan(-1)
    expect(cellValue(homestay[endDateColumn])).toBeInstanceOf(Date)
  })

  it('serializes the report as a readable three-sheet xlsx workbook', async () => {
    const originalTimezone = process.env.TZ
    process.env.TZ = 'America/Los_Angeles'
    try {
      const report = buildTravelExcelReportSheets(demoWorkspace, new Date(2026, 9, 13, 9, 30))
      const buffer = await writeXlsxFile(report, { fontFamily: 'Arial', fontSize: 10 }).toBuffer()
      const sheets = await readXlsxFile(buffer)

      expect(sheets.map((sheet) => sheet.sheet)).toEqual(['TongQuan', 'LichTrinh', 'ChiPhi'])
      expect(sheets[0].data.some((row) => row[0] === 'Chi phí đang tính' && row[1] === 3_150_000)).toBe(true)
      expect(sheets[1].data[0]).toEqual(expect.arrayContaining(['Tên địa điểm', 'Ngày', 'Bắt đầu', 'ID', 'Version']))

      const unchanged = buildTravelExcelPreview('report.xlsx', sheets, demoWorkspace.trip, demoWorkspace.itinerary, demoWorkspace.expenses, demoWorkspace.people)
      expect([...unchanged.itinerary, ...unchanged.expenses].every((row) => row.action === 'skip')).toBe(true)

      sheets[1].data[1][0] = 'Cà phê bên đồi thông (đã sửa)'
      const edited = buildTravelExcelPreview('report.xlsx', sheets, demoWorkspace.trip, demoWorkspace.itinerary, demoWorkspace.expenses, demoWorkspace.people)
      expect(edited.itinerary[0].action).toBe('update')
    } finally {
      if (originalTimezone === undefined) delete process.env.TZ
      else process.env.TZ = originalTimezone
    }
  })
})
