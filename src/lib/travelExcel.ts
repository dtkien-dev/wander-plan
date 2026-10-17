import { involvesFormerMember, validateSplit } from './expenseSettlement'
import { actualOrEstimated, isGoogleMapsUrl, totalExpenses } from './format'
import { inspectXlsxArchive } from './xlsxGuard'
import type { Expense, ExpenseCategory, ExpenseDraft, ItineraryDraft, ItineraryItem, SplitMethod, Trip, TripImportDraft, TripPerson, WorkspaceData } from '../types'

type CellValue = string | number | boolean | Date | null
type SheetData = CellValue[][]

interface WorkbookSheet {
  sheet: string
  data: SheetData
}

export interface ExcelPreviewRow<T> {
  sheet: 'LichTrinh' | 'ChiPhi'
  rowNumber: number
  label: string
  data?: T
  errors: string[]
  id?: string
  version?: number
  action: 'create' | 'update' | 'skip' | 'conflict'
  statusMessage?: string
}

export interface TravelExcelPreview {
  fileName: string
  itinerary: ExcelPreviewRow<ItineraryDraft>[]
  expenses: ExcelPreviewRow<ExpenseDraft>[]
}

const MAX_FILE_BYTES = 5 * 1024 * 1024
const MAX_IMPORT_ROWS = 1000
const itineraryHeaders = ['Tên địa điểm', 'Ngày', 'Bắt đầu', 'Kết thúc', 'Chi phí dự kiến', 'Địa chỉ', 'Google Maps URL', 'Ghi chú']
const expenseHeaders = ['Khoản chi', 'Phân loại', 'Ngày', 'Dự kiến', 'Thực tế', 'Người thanh toán', 'Người tham gia', 'Ghi chú']
const endDateHeader = 'Đến ngày'
// Exported sheets keep "Đến ngày" beside "Ngày"; import still matches columns by header name.
const itinerarySheetHeaders = [...itineraryHeaders.slice(0, 2), endDateHeader, ...itineraryHeaders.slice(2)]
const expenseSheetHeaders = [...expenseHeaders.slice(0, 3), endDateHeader, ...expenseHeaders.slice(3)]
const itineraryWidths = [28, 14, 14, 12, 12, 20, 34, 36, 36].map((width) => ({ width }))
const expenseWidths = [28, 18, 14, 14, 18, 18, 28, 42, 36, 16, 48].map((width) => ({ width }))
const splitMethodHeader = 'Cách chia'
const splitDetailHeader = 'Chi tiết chia'
const splitMethodLabels: Record<SplitMethod, string> = { equal: 'Chia đều', shares: 'Theo phần', amounts: 'Theo số tiền' }
const idHeader = 'ID'
const versionHeader = 'Version'
const categoryLabels: Record<ExpenseCategory, string> = {
  food: 'Ăn uống', transport: 'Di chuyển', stay: 'Lưu trú', ticket: 'Vé tham quan', other: 'Khác',
}

const normalize = (value: unknown) => String(value ?? '')
  .trim().toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd').replace(/[^a-z0-9]/g, '')
const toText = (value: CellValue | undefined) => String(value ?? '').trim()
const isValidIsoDate = (value: string) => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

const toDateValue = (value: CellValue | undefined) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}-${String(value.getUTCDate()).padStart(2, '0')}`
  }
  const text = toText(value)
  if (isValidIsoDate(text)) return text
  const match = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (!match) return ''
  const formatted = `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`
  return isValidIsoDate(formatted) ? formatted : ''
}

const toTimeValue = (value: CellValue | undefined) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`
  }
  if (typeof value === 'number' && value >= 0 && value < 1) {
    const minutes = Math.round(value * 24 * 60) % (24 * 60)
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
  }
  const match = toText(value).match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)
  if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) return ''
  return `${match[1].padStart(2, '0')}:${match[2]}`
}

const toMoney = (value: CellValue | undefined, optional = false) => {
  if (value === null || value === undefined || value === '') return optional ? null : Number.NaN
  if (typeof value === 'number') return Number.isSafeInteger(value) ? value : Number.NaN
  if (typeof value !== 'string') return Number.NaN
  const text = value.trim()
  if (!text) return optional ? null : Number.NaN
  // Accept whole đồng or consistently grouped thousands; never repair malformed money.
  if (!/^-?(?:\d+|\d{1,3}([., \u00a0])\d{3}(?:\1\d{3})*)$/.test(text)) return Number.NaN
  const normalized = text.replace(/[., \u00a0]/g, '')
  const parsed = Number(normalized)
  return Number.isSafeInteger(parsed) ? parsed : Number.NaN
}

const categoryMap: Record<string, ExpenseCategory> = {
  anuong: 'food', food: 'food', dichuyen: 'transport', transport: 'transport',
  luutru: 'stay', stay: 'stay', vethamquan: 'ticket', ticket: 'ticket', khac: 'other', other: 'other',
}
const splitMethodMap: Record<string, SplitMethod> = {
  chiadeu: 'equal', deu: 'equal', equal: 'equal', theophan: 'shares', phan: 'shares', shares: 'shares',
  theosotien: 'amounts', sotien: 'amounts', amounts: 'amounts',
}
const formatSplitDetail = (expense: Expense, email: (userId: string) => string) => (expense.splitMethod ?? 'equal') === 'equal'
  ? ''
  : expense.participantUserIds.filter((userId) => email(userId)).map((userId) => `${email(userId)}: ${expense.splitValues?.[userId] ?? ''}`).join('; ')
// "email: 2; email: 1" → userId → number; unknown emails are reported by the caller.
const parseSplitDetail = (text: string, userIdByEmail: Map<string, string>) => {
  const values: Record<string, number> = {}
  const unknown: string[] = []
  text.split(';').map((part) => part.trim()).filter(Boolean).forEach((part) => {
    const match = part.match(/^(.+?)\s*[:=]\s*(.+)$/)
    const email = (match?.[1] ?? part).trim().toLocaleLowerCase()
    const userId = userIdByEmail.get(email)
    if (!userId || !match) { unknown.push(email); return }
    values[userId] = toMoney(match[2]) as number
  })
  return { values, unknown }
}
const getHeaderIndexes = (headerRow: CellValue[], expected: string[]) => {
  const indexes = new Map<string, number>()
  headerRow.forEach((cell, index) => indexes.set(normalize(cell), index))
  return expected.map((header) => indexes.get(normalize(header)) ?? -1)
}
const missingHeaders = (indexes: number[], expected: string[]) => expected.filter((_, index) => indexes[index] === -1)
const getOptionalHeaderIndex = (headerRow: CellValue[], header: string) => headerRow.findIndex((cell) => normalize(cell) === normalize(header))
const toVersion = (value: CellValue | undefined) => {
  if (value === null || value === undefined || value === '') return undefined
  const parsed = typeof value === 'number' ? value : Number(String(value).trim())
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}
const itineraryKey = (item: Pick<ItineraryDraft, 'title' | 'visitDate' | 'startTime'>) => `${item.visitDate}|${item.startTime}|${normalize(item.title)}`
const expenseKey = (expense: Pick<ExpenseDraft, 'title' | 'expenseDate' | 'estimatedAmountVnd' | 'actualAmountVnd'>) =>
  `${expense.expenseDate}|${normalize(expense.title)}|${expense.estimatedAmountVnd}|${expense.actualAmountVnd ?? ''}`
const sameItinerary = (draft: ItineraryDraft, existing: ItineraryItem) =>
  draft.title === existing.title && draft.visitDate === existing.visitDate && draft.endDate === existing.endDate &&
  draft.startTime === existing.startTime && draft.endTime === existing.endTime && draft.estimatedCostVnd === existing.estimatedCostVnd &&
  draft.address === existing.address && draft.mapsUrl === existing.mapsUrl && draft.notes === existing.notes
const sameMoney = (draft: ExpenseDraft, existing: Expense) =>
  draft.estimatedAmountVnd === existing.estimatedAmountVnd && draft.actualAmountVnd === existing.actualAmountVnd &&
  draft.paidByUserId === existing.paidByUserId && [...draft.participantUserIds].sort().join('|') === [...existing.participantUserIds].sort().join('|') &&
  (draft.splitMethod ?? 'equal') === (existing.splitMethod ?? 'equal') &&
  JSON.stringify(Object.entries(draft.splitValues ?? {}).sort()) === JSON.stringify(Object.entries(existing.splitValues ?? {}).sort())
const sameExpense = (draft: ExpenseDraft, existing: Expense) =>
  draft.title === existing.title && draft.category === existing.category && draft.expenseDate === existing.expenseDate &&
  draft.endDate === existing.endDate && sameMoney(draft, existing) && draft.notes === existing.notes

const parseItinerarySheet = (data: SheetData, trip: Trip, existing: ItineraryItem[]): ExcelPreviewRow<ItineraryDraft>[] => {
  if (!data.length) return []
  const indexes = getHeaderIndexes(data[0], itineraryHeaders)
  const missing = missingHeaders(indexes, itineraryHeaders)
  if (missing.length) throw new Error(`Sheet LichTrinh thiếu cột: ${missing.join(', ')}.`)
  const idIndex = getOptionalHeaderIndex(data[0], idHeader)
  const versionIndex = getOptionalHeaderIndex(data[0], versionHeader)
  const endDateIndex = getOptionalHeaderIndex(data[0], endDateHeader)
  const existingById = new Map(existing.map((item) => [item.id, item]))
  const existingKeyOwners = new Map(existing.map((item) => [itineraryKey(item), item.id]))
  const fileKeys = new Map<string, string>()
  const fileIds = new Set<string>()
  return data.slice(1).flatMap((row, rowIndex) => {
    const values = indexes.map((index) => row[index])
    const id = idIndex === -1 ? '' : toText(row[idIndex])
    const rawVersion = versionIndex === -1 ? undefined : row[versionIndex]
    if ([...values, id, rawVersion].every((value) => value === null || value === undefined || toText(value) === '')) return []
    // Files without the optional end-date column keep the saved end date of updated rows.
    const rawEndDate = endDateIndex === -1 ? undefined : toText(row[endDateIndex])
    const endDate = rawEndDate === undefined ? existingById.get(id)?.endDate ?? null : rawEndDate ? toDateValue(row[endDateIndex]) : null
    const draft: ItineraryDraft = {
      title: toText(values[0]), visitDate: toDateValue(values[1]), endDate, startTime: toTimeValue(values[2]),
      endTime: toTimeValue(values[3]), estimatedCostVnd: toMoney(values[4]) as number,
      address: toText(values[5]), mapsUrl: toText(values[6]), notes: toText(values[7]),
    }
    const errors: string[] = []
    if (draft.title.length < 2 || draft.title.length > 150) errors.push('Tên địa điểm phải có 2–150 ký tự')
    if (!draft.visitDate) errors.push('Ngày không hợp lệ')
    else if (draft.visitDate < trip.startDate || draft.visitDate > trip.endDate) errors.push('Ngày nằm ngoài chuyến đi')
    if (!draft.startTime) errors.push('Giờ bắt đầu không hợp lệ')
    if (!draft.endTime) errors.push('Giờ kết thúc không hợp lệ')
    if (rawEndDate && !endDate) errors.push('Đến ngày không hợp lệ')
    else if (endDate && draft.visitDate && endDate <= draft.visitDate) errors.push('Đến ngày phải sau Ngày')
    else if (endDate && endDate > trip.endDate) errors.push('Đến ngày nằm ngoài chuyến đi')
    if (!endDate && draft.startTime && draft.endTime && draft.endTime <= draft.startTime) errors.push('Giờ kết thúc phải sau giờ bắt đầu')
    if (!Number.isInteger(draft.estimatedCostVnd) || draft.estimatedCostVnd < 0) errors.push('Chi phí dự kiến phải là số nguyên không âm')
    if (draft.address.length < 3) errors.push('Địa chỉ phải có ít nhất 3 ký tự')
    if (!isGoogleMapsUrl(draft.mapsUrl)) errors.push('Google Maps URL không hợp lệ')
    if (draft.notes.length > 500) errors.push('Ghi chú tối đa 500 ký tự')
    const key = itineraryKey(draft)
    const version = toVersion(rawVersion)
    let action: ExcelPreviewRow<ItineraryDraft>['action'] = 'create'
    let statusMessage: string | undefined
    if (!id && rawVersion !== undefined && rawVersion !== null && toText(rawVersion) !== '') {
      action = 'conflict'; statusMessage = 'Có Version nhưng thiếu ID; hãy khôi phục ID hoặc xóa cả hai để tạo mới'
    } else if (id) {
      const current = existingById.get(id)
      if (fileIds.has(id)) {
        action = 'conflict'; statusMessage = 'ID xuất hiện nhiều lần trong file'
      } else if (!current) {
        action = 'conflict'; statusMessage = 'ID không còn tồn tại trong chuyến đi'
      } else if (!version) {
        action = 'conflict'; statusMessage = 'Version bị thiếu hoặc không hợp lệ'
      } else if (version !== current.version) {
        action = 'conflict'; statusMessage = `Version đã thay đổi (file: ${version}, hiện tại: ${current.version})`
      } else if (existingKeyOwners.has(key) && existingKeyOwners.get(key) !== id) {
        action = 'conflict'; statusMessage = 'Nội dung trùng với một lịch trình khác'
      } else if (fileKeys.has(key) && fileKeys.get(key) !== id) {
        action = 'conflict'; statusMessage = 'Nội dung trùng với một dòng khác trong file'
      } else if (sameItinerary(draft, current)) {
        action = 'skip'; statusMessage = 'Không có thay đổi'
      } else action = 'update'
      fileIds.add(id)
    } else if (existingKeyOwners.has(key) || fileKeys.has(key)) {
      action = 'skip'; statusMessage = 'Bỏ qua vì trùng dữ liệu'
    }
    fileKeys.set(key, id)
    return [{ sheet: 'LichTrinh' as const, rowNumber: rowIndex + 2, label: draft.title || '(Chưa có tên)', data: draft, errors, id: id || undefined, version, action, statusMessage }]
  })
}

const parseExpenseSheet = (data: SheetData, trip: Trip, existing: Expense[], people: TripPerson[]): ExcelPreviewRow<ExpenseDraft>[] => {
  if (!data.length) return []
  const indexes = getHeaderIndexes(data[0], expenseHeaders)
  const missing = missingHeaders(indexes, expenseHeaders)
  if (missing.length) throw new Error(`Sheet ChiPhi thiếu cột: ${missing.join(', ')}.`)
  const idIndex = getOptionalHeaderIndex(data[0], idHeader)
  const versionIndex = getOptionalHeaderIndex(data[0], versionHeader)
  const endDateIndex = getOptionalHeaderIndex(data[0], endDateHeader)
  const splitMethodIndex = getOptionalHeaderIndex(data[0], splitMethodHeader)
  const splitDetailIndex = getOptionalHeaderIndex(data[0], splitDetailHeader)
  const existingById = new Map(existing.map((expense) => [expense.id, expense]))
  const existingKeyOwners = new Map(existing.map((expense) => [expenseKey(expense), expense.id]))
  const fileKeys = new Map<string, string>()
  const fileIds = new Set<string>()
  const activePeople = people.filter((person) => person.status === 'active' && person.userId)
  const userIdByEmail = new Map(activePeople.map((person) => [person.email.trim().toLocaleLowerCase(), person.userId!]))
  const activeIds = new Set(userIdByEmail.values())
  return data.slice(1).flatMap((row, rowIndex) => {
    const values = indexes.map((index) => row[index])
    const id = idIndex === -1 ? '' : toText(row[idIndex])
    const rawVersion = versionIndex === -1 ? undefined : row[versionIndex]
    if ([...values, id, rawVersion].every((value) => value === null || value === undefined || toText(value) === '')) return []
    const category = categoryMap[normalize(values[1])]
    const payerEmail = toText(values[5]).toLocaleLowerCase()
    const participantEmails = [...new Set(toText(values[6]).split(/[;,]/).map((email) => email.trim().toLocaleLowerCase()).filter(Boolean))]
    // Former members have no email in exports; updated rows keep them exactly as saved.
    const saved = existingById.get(id)
    const formerPayerId = saved && !activeIds.has(saved.paidByUserId) ? saved.paidByUserId : ''
    const formerParticipantIds = saved?.participantUserIds.filter((userId) => !activeIds.has(userId)) ?? []
    const paidByUserId = userIdByEmail.get(payerEmail) ?? (payerEmail ? '' : formerPayerId)
    const activeParticipantIds = participantEmails.flatMap((email) => userIdByEmail.get(email) ?? [])
    const participantUserIds = [...activeParticipantIds, ...formerParticipantIds]
    // Files without the optional end-date column keep the saved range of updated rows.
    const rawEndDate = endDateIndex === -1 ? undefined : toText(row[endDateIndex])
    const endDate = rawEndDate === undefined ? existingById.get(id)?.endDate ?? null : rawEndDate ? toDateValue(row[endDateIndex]) : null
    // Files without the split columns keep an updated row's saved split; new rows split equally.
    const rawSplitMethod = splitMethodIndex === -1 ? undefined : toText(row[splitMethodIndex])
    const parsedSplitMethod = rawSplitMethod ? splitMethodMap[normalize(rawSplitMethod)] : 'equal'
    const splitMethod = rawSplitMethod === undefined ? existingById.get(id)?.splitMethod ?? 'equal' : parsedSplitMethod ?? 'equal'
    const splitDetail = splitMethod === 'equal' || splitDetailIndex === -1 ? undefined : parseSplitDetail(toText(row[splitDetailIndex]), userIdByEmail)
    const formerValues = Object.fromEntries(formerParticipantIds.flatMap((userId) => saved?.splitValues?.[userId] === undefined ? [] : [[userId, saved.splitValues[userId]]]))
    const splitValues = splitMethod === 'equal' ? {} : { ...formerValues, ...(splitDetail?.values ?? saved?.splitValues) }
    const draft: ExpenseDraft = {
      title: toText(values[0]), category: category ?? 'other', expenseDate: toDateValue(values[2]), endDate,
      estimatedAmountVnd: toMoney(values[3]) as number, actualAmountVnd: toMoney(values[4], true) as number | null,
      paidByUserId, participantUserIds, splitMethod, splitValues, notes: toText(values[7]),
    }
    const errors: string[] = []
    if (rawSplitMethod && !parsedSplitMethod) errors.push('Cách chia phải là Chia đều, Theo phần hoặc Theo số tiền')
    if (saved && involvesFormerMember(saved, activeIds) && !sameMoney(draft, saved)) errors.push('Khoản chi có người đã rời nhóm: không thể đổi số tiền, cách chia, người trả hay người tham gia')
    if (splitDetail?.unknown.length) errors.push('Chi tiết chia có email không thuộc chuyến đi hoặc thiếu số')
    else if (Object.keys(splitValues).some((userId) => !participantUserIds.includes(userId))) errors.push('Chi tiết chia chỉ được ghi cho người tham gia')
    else if (participantUserIds.length) {
      const splitError = validateSplit(draft)
      if (splitError) errors.push(splitError)
    }
    if (draft.title.length < 2 || draft.title.length > 150) errors.push('Khoản chi phải có 2–150 ký tự')
    if (!category) errors.push('Phân loại không hợp lệ')
    if (!draft.expenseDate) errors.push('Ngày không hợp lệ')
    else if (draft.expenseDate < trip.startDate || draft.expenseDate > trip.endDate) errors.push('Ngày nằm ngoài chuyến đi')
    if (rawEndDate && !endDate) errors.push('Đến ngày không hợp lệ')
    else if (endDate) {
      if (draft.category !== 'transport' && draft.category !== 'stay') errors.push('Chỉ Di chuyển khứ hồi và Lưu trú mới có Đến ngày')
      else if (draft.category === 'stay' ? endDate <= draft.expenseDate : endDate < draft.expenseDate) errors.push(draft.category === 'stay' ? 'Ngày trả phòng phải sau ngày nhận phòng' : 'Ngày về phải từ ngày đi trở đi')
      else if (endDate > trip.endDate) errors.push('Đến ngày nằm ngoài chuyến đi')
    }
    if (!Number.isInteger(draft.estimatedAmountVnd) || draft.estimatedAmountVnd < 0) errors.push('Số tiền dự kiến phải là số nguyên không âm')
    if (draft.actualAmountVnd !== null && (!Number.isInteger(draft.actualAmountVnd) || draft.actualAmountVnd < 0)) errors.push('Số tiền thực tế phải là số nguyên không âm')
    if (!paidByUserId) errors.push('Người thanh toán phải là email của thành viên đang hoạt động')
    if (!participantUserIds.length) errors.push('Chọn ít nhất một người tham gia')
    else if (activeParticipantIds.length !== participantEmails.length) errors.push('Danh sách người tham gia có email không thuộc chuyến đi')
    if (draft.notes.length > 500) errors.push('Ghi chú tối đa 500 ký tự')
    const key = expenseKey(draft)
    const version = toVersion(rawVersion)
    let action: ExcelPreviewRow<ExpenseDraft>['action'] = 'create'
    let statusMessage: string | undefined
    if (!id && rawVersion !== undefined && rawVersion !== null && toText(rawVersion) !== '') {
      action = 'conflict'; statusMessage = 'Có Version nhưng thiếu ID; hãy khôi phục ID hoặc xóa cả hai để tạo mới'
    } else if (id) {
      const current = existingById.get(id)
      if (fileIds.has(id)) {
        action = 'conflict'; statusMessage = 'ID xuất hiện nhiều lần trong file'
      } else if (!current) {
        action = 'conflict'; statusMessage = 'ID không còn tồn tại trong chuyến đi'
      } else if (!version) {
        action = 'conflict'; statusMessage = 'Version bị thiếu hoặc không hợp lệ'
      } else if (version !== current.version) {
        action = 'conflict'; statusMessage = `Version đã thay đổi (file: ${version}, hiện tại: ${current.version})`
      } else if (existingKeyOwners.has(key) && existingKeyOwners.get(key) !== id) {
        action = 'conflict'; statusMessage = 'Nội dung trùng với một khoản chi khác'
      } else if (fileKeys.has(key) && fileKeys.get(key) !== id) {
        action = 'conflict'; statusMessage = 'Nội dung trùng với một dòng khác trong file'
      } else if (sameExpense(draft, current)) {
        action = 'skip'; statusMessage = 'Không có thay đổi'
      } else action = 'update'
      fileIds.add(id)
    } else if (existingKeyOwners.has(key) || fileKeys.has(key)) {
      action = 'skip'; statusMessage = 'Bỏ qua vì trùng dữ liệu'
    }
    fileKeys.set(key, id)
    return [{ sheet: 'ChiPhi' as const, rowNumber: rowIndex + 2, label: draft.title || '(Chưa có tên)', data: draft, errors, id: id || undefined, version, action, statusMessage }]
  })
}

export const buildTravelExcelPreview = (fileName: string, sheets: WorkbookSheet[], trip: Trip, itinerary: ItineraryItem[], expenses: Expense[], people: TripPerson[]): TravelExcelPreview => {
  const itinerarySheet = sheets.find((sheet) => normalize(sheet.sheet) === 'lichtrinh')
  const expenseSheet = sheets.find((sheet) => normalize(sheet.sheet) === 'chiphi')
  if (!itinerarySheet && !expenseSheet) throw new Error('File cần có sheet LichTrinh hoặc ChiPhi.')
  const preview = {
    fileName,
    itinerary: itinerarySheet ? parseItinerarySheet(itinerarySheet.data, trip, itinerary) : [],
    expenses: expenseSheet ? parseExpenseSheet(expenseSheet.data, trip, expenses, people) : [],
  }
  if (preview.itinerary.length + preview.expenses.length > MAX_IMPORT_ROWS) throw new Error('Mỗi lần chỉ được nhập tối đa 1.000 dòng.')
  return preview
}

export const parseTravelExcel = async (file: File, trip: Trip, itinerary: ItineraryItem[], expenses: Expense[], people: TripPerson[]) => {
  if (!file.name.toLocaleLowerCase().endsWith('.xlsx')) throw new Error('Chỉ hỗ trợ file Excel .xlsx.')
  if (file.size > MAX_FILE_BYTES) throw new Error('File Excel không được lớn hơn 5 MB.')
  inspectXlsxArchive(await file.arrayBuffer())
  const { default: readXlsxFile } = await import('read-excel-file/browser')
  const sheets = await readXlsxFile(file)
  return buildTravelExcelPreview(file.name, sheets as WorkbookSheet[], trip, itinerary, expenses, people)
}

export const getImportDraft = (preview: TravelExcelPreview): TripImportDraft => ({
  itinerary: preview.itinerary.filter((row) => (row.action === 'create' || row.action === 'update') && !row.errors.length && row.data)
    .map((row) => ({ draft: row.data!, id: row.id, version: row.version })),
  expenses: preview.expenses.filter((row) => (row.action === 'create' || row.action === 'update') && !row.errors.length && row.data)
    .map((row) => ({ draft: row.data!, id: row.id, version: row.version })),
})

export const downloadTravelExcelTemplate = async () => {
  const { default: writeXlsxFile } = await import('write-excel-file/browser')
  const headerStyle = { backgroundColor: '#18392B', textColor: '#FFFDF7', fontWeight: 'bold' as const, align: 'center' as const, alignVertical: 'center' as const, height: 28 }
  const headerRow = (headers: string[]) => headers.map((value) => ({ value, ...headerStyle }))
  const workbook = writeXlsxFile([
    { sheet: 'LichTrinh', data: [headerRow(itinerarySheetHeaders)], stickyRowsCount: 1, columns: itineraryWidths },
    { sheet: 'ChiPhi', data: [headerRow([...expenseSheetHeaders, splitMethodHeader, splitDetailHeader])], stickyRowsCount: 1, columns: expenseWidths },
  ], { fontFamily: 'Arial', fontSize: 10 })
  await workbook.toFile('wander-plan-mau-import.xlsx')
}

const excelDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

const reportHeaderStyle = {
  backgroundColor: '#18392B', textColor: '#FFFDF7', fontWeight: 'bold' as const,
  align: 'center' as const, alignVertical: 'center' as const, height: 28,
}
const reportSectionStyle = {
  backgroundColor: '#DDECE2', textColor: '#18392B', fontWeight: 'bold' as const,
}
const reportLabelStyle = { textColor: '#18392B', fontWeight: 'bold' as const }
const reportMoneyCell = (value: number | null) => value === null
  ? null
  : { value, type: Number, format: '#,##0', align: 'right' as const }
const reportDateCell = (value: string) => ({ value: excelDate(value), type: Date, format: 'dd/mm/yyyy', align: 'center' as const })
const reportHeaderRow = (headers: string[]) => headers.map((value) => ({ value, ...reportHeaderStyle }))
const wrapCell = (value: string) => ({ value, wrap: true })

export const buildTravelExcelReportSheets = (workspace: WorkspaceData, exportedAt = new Date()) => {
  const total = totalExpenses(workspace.expenses)
  const categoryTotals = new Map<ExpenseCategory, number>()
  workspace.expenses.forEach((expense) => {
    categoryTotals.set(expense.category, (categoryTotals.get(expense.category) ?? 0) + actualOrEstimated(expense))
  })
  const peopleById = new Map(workspace.people.flatMap((person) => person.userId ? [[person.userId, person] as const] : []))
  const memberEmail = (userId: string) => peopleById.get(userId)?.email ?? ''
  const summaryData = [
    [],
    [{ value: `${workspace.trip.name} — Báo cáo chuyến đi`, fontSize: 14, fontWeight: 'bold' as const, textColor: '#18392B' }],
    [{ value: 'Thông tin chuyến đi', ...reportSectionStyle }],
    [{ value: 'Điểm đến', ...reportLabelStyle }, workspace.trip.destination],
    [{ value: 'Ngày bắt đầu', ...reportLabelStyle }, reportDateCell(workspace.trip.startDate)],
    [{ value: 'Ngày kết thúc', ...reportLabelStyle }, reportDateCell(workspace.trip.endDate)],
    [{ value: 'Số thành viên', ...reportLabelStyle }, workspace.memberCount],
    [{ value: 'Thời điểm xuất', ...reportLabelStyle }, { value: exportedAt, type: Date, format: 'dd/mm/yyyy hh:mm' }],
    [],
    [{ value: 'Ngân sách', ...reportSectionStyle }],
    [{ value: 'Ngân sách chuyến đi', ...reportLabelStyle }, reportMoneyCell(workspace.trip.budgetVnd)],
    [{ value: 'Chi phí đang tính', ...reportLabelStyle }, reportMoneyCell(total)],
    [{ value: 'Ngân sách còn lại', ...reportLabelStyle }, reportMoneyCell(workspace.trip.budgetVnd - total)],
    [{ value: 'Số khoản chi', ...reportLabelStyle }, workspace.expenses.length],
    [{ value: 'Số điểm lịch trình', ...reportLabelStyle }, workspace.itinerary.length],
    [],
    [{ value: 'Chi phí theo phân loại', ...reportSectionStyle }, { value: 'Số tiền (VND)', ...reportSectionStyle }],
    ...([...categoryTotals.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => [categoryLabels[category], reportMoneyCell(amount)])),
    [],
    [{ value: 'Chi phí đang tính sử dụng số thực tế nếu đã có, nếu chưa sẽ dùng số dự kiến.', textColor: '#68756E', fontStyle: 'italic' as const }],
    [{ value: 'Có thể sửa dữ liệu ở LichTrinh/ChiPhi rồi nhập lại. Không sửa cột ID hoặc Version; để trống hai cột này khi thêm dòng mới.', textColor: '#68756E', fontStyle: 'italic' as const }],
    [{ value: 'Xóa dòng trong Excel không xóa dữ liệu trên ứng dụng.', textColor: '#68756E', fontStyle: 'italic' as const }],
  ]

  const itineraryData = [
    reportHeaderRow([...itinerarySheetHeaders, idHeader, versionHeader]),
    ...[...workspace.itinerary]
      .sort((a, b) => `${a.visitDate}|${a.startTime}`.localeCompare(`${b.visitDate}|${b.startTime}`))
      .map((item) => [
        item.title, reportDateCell(item.visitDate), item.endDate ? reportDateCell(item.endDate) : null, item.startTime, item.endTime,
        reportMoneyCell(item.estimatedCostVnd), wrapCell(item.address), item.mapsUrl, wrapCell(item.notes), item.id, item.version,
      ]),
  ]
  const expenseData = [
    reportHeaderRow([...expenseSheetHeaders, splitMethodHeader, splitDetailHeader, 'Đang tính', 'Trạng thái', idHeader, versionHeader]),
    ...[...workspace.expenses]
      .sort((a, b) => a.expenseDate.localeCompare(b.expenseDate))
      .map((expense) => [
        expense.title, categoryLabels[expense.category], reportDateCell(expense.expenseDate),
        expense.endDate ? reportDateCell(expense.endDate) : null,
        reportMoneyCell(expense.estimatedAmountVnd), reportMoneyCell(expense.actualAmountVnd), memberEmail(expense.paidByUserId),
        expense.participantUserIds.map(memberEmail).filter(Boolean).join(', '), wrapCell(expense.notes),
        splitMethodLabels[expense.splitMethod ?? 'equal'], formatSplitDetail(expense, memberEmail),
        reportMoneyCell(actualOrEstimated(expense)), expense.actualAmountVnd === null ? 'Dự kiến' : 'Thực tế', expense.id, expense.version,
      ]),
  ]

  return [
    { sheet: 'TongQuan', data: summaryData, showGridLines: false, columns: [{ width: 30 }, { width: 24 }, { width: 3 }, { width: 22 }, { width: 20 }] },
    { sheet: 'LichTrinh', data: itineraryData, stickyRowsCount: 1, columns: [...itineraryWidths, { width: 38 }, { width: 12 }] },
    { sheet: 'ChiPhi', data: expenseData, stickyRowsCount: 1, columns: [...expenseWidths, { width: 18 }, { width: 14 }, { width: 38 }, { width: 12 }] },
  ]
}

const reportFileName = (workspace: WorkspaceData) => {
  const slug = workspace.trip.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd')
    .toLocaleLowerCase('vi').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'chuyen-di'
  const date = new Date().toISOString().slice(0, 10)
  return `wander-plan-${slug}-${date}.xlsx`
}

export const downloadTravelExcelReport = async (workspace: WorkspaceData) => {
  const { default: writeXlsxFile } = await import('write-excel-file/browser')
  const workbook = writeXlsxFile(buildTravelExcelReportSheets(workspace), { fontFamily: 'Arial', fontSize: 10 })
  await workbook.toFile(reportFileName(workspace))
}
