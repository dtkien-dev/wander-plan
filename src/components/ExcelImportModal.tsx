import { useMemo, useState, type ChangeEvent } from 'react'
import { Download, FileSpreadsheet, Upload } from 'lucide-react'
import { Modal } from './Modal'
import { downloadTravelExcelTemplate, getImportDraft, parseTravelExcel, type ExcelPreviewRow, type TravelExcelPreview } from '../lib/travelExcel'
import type { Expense, ExpenseDraft, ItineraryDraft, ItineraryItem, Trip, TripImportDraft, TripPerson } from '../types'
import styles from './ExcelImportModal.module.css'

interface ExcelImportModalProps {
  open: boolean
  trip: Trip
  itinerary: ItineraryItem[]
  expenses: Expense[]
  people: TripPerson[]
  pending: boolean
  onClose: () => void
  onSubmit: (draft: TripImportDraft) => Promise<void>
}

type PreviewRow = ExcelPreviewRow<ItineraryDraft> | ExcelPreviewRow<ExpenseDraft>
const rowStatus = (row: PreviewRow) => {
  const problems = [...row.errors]
  if (row.action === 'conflict' && row.statusMessage) problems.push(row.statusMessage)
  if (problems.length) return problems.join('; ')
  return row.statusMessage ?? (row.action === 'create' ? 'Tạo mới' : 'Cập nhật')
}

export function ExcelImportModal({ open, trip, itinerary, expenses, people, pending, onClose, onSubmit }: ExcelImportModalProps) {
  const [preview, setPreview] = useState<TravelExcelPreview | null>(null)
  const [error, setError] = useState('')
  const [reading, setReading] = useState(false)
  const rows = useMemo<PreviewRow[]>(() => preview ? [...preview.itinerary, ...preview.expenses] : [], [preview])
  const createCount = rows.filter((row) => !row.errors.length && row.action === 'create').length
  const updateCount = rows.filter((row) => !row.errors.length && row.action === 'update').length
  const skipCount = rows.filter((row) => row.action === 'skip').length
  const changeCount = createCount + updateCount
  const problemCount = rows.filter((row) => row.errors.length || row.action === 'conflict').length

  const chooseFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      setReading(true)
      setError('')
      setPreview(await parseTravelExcel(file, trip, itinerary, expenses, people))
    } catch (caught) {
      setPreview(null)
      setError(caught instanceof Error ? caught.message : 'Không thể đọc file Excel.')
    } finally {
      setReading(false)
    }
  }

  const submit = async () => {
    if (!preview || problemCount || !changeCount) return
    try {
      setError('')
      await onSubmit(getImportDraft(preview))
      setPreview(null)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Không thể nhập dữ liệu.')
    }
  }

  const downloadTemplate = async () => {
    try {
      setError('')
      await downloadTravelExcelTemplate()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Không thể tạo file Excel mẫu.')
    }
  }

  const close = () => {
    if (pending) return
    setPreview(null)
    setError('')
    onClose()
  }

  return (
    <Modal open={open} title="Nhập dữ liệu từ Excel" onClose={close}>
      <div className={styles.intro}>
        <p>Dùng file mẫu để tạo mới, hoặc sửa file đã xuất để cập nhật. Giữ nguyên cột <strong>ID</strong> và <strong>Version</strong>; dòng trùng hoặc không đổi sẽ được bỏ qua.</p>
        <button className="button button--ghost" type="button" onClick={() => void downloadTemplate()}>
          <Download size={18} /> Tải file mẫu
        </button>
      </div>
      <label className={styles.dropzone}>
        <FileSpreadsheet size={30} />
        <strong>{reading ? 'Đang đọc file…' : preview?.fileName ?? 'Chọn file Excel .xlsx'}</strong>
        <span>Tối đa 5 MB và 1.000 dòng</span>
        <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" disabled={reading || pending} onChange={(event) => void chooseFile(event)} />
      </label>
      {error && <div className="form-error-banner" role="alert">{error}</div>}
      {preview && (
        <>
          <div className={styles.summary} aria-label="Kết quả kiểm tra file">
            <span><strong>{createCount}</strong> tạo mới</span>
            <span><strong>{updateCount}</strong> cập nhật</span>
            <span><strong>{skipCount}</strong> bỏ qua</span>
            <span className={problemCount ? styles.invalid : undefined}><strong>{problemCount}</strong> lỗi/xung đột</span>
          </div>
          {rows.length ? (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead><tr><th>Sheet</th><th>Dòng</th><th>Nội dung</th><th>Trạng thái</th></tr></thead>
                <tbody>
                  {rows.slice(0, 100).map((row) => (
                    <tr key={`${row.sheet}-${row.rowNumber}`}>
                      <td>{row.sheet}</td><td>{row.rowNumber}</td><td>{row.label}</td>
                      <td className={row.errors.length || row.action === 'conflict' ? styles.invalid : row.action === 'skip' ? styles.duplicate : styles.valid}>
                        {rowStatus(row)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length > 100 && <p className={styles.more}>Đang hiển thị 100/{rows.length} dòng.</p>}
            </div>
          ) : <p className={styles.empty}>File đúng cấu trúc nhưng chưa có dòng dữ liệu.</p>}
        </>
      )}
      <div className={styles.actions}>
        <button className="button button--ghost" type="button" disabled={pending} onClick={close}>Hủy</button>
        <button className="button button--primary" type="button" disabled={!preview || Boolean(problemCount) || !changeCount || reading || pending} onClick={() => void submit()}>
          <Upload size={18} /> {pending ? 'Đang áp dụng…' : changeCount ? `Áp dụng ${changeCount} thay đổi` : 'Nhập dữ liệu'}
        </button>
      </div>
    </Modal>
  )
}
