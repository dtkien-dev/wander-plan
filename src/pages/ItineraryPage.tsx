import { lazy, Suspense, useRef, useState } from 'react'
import { Clock3, Download, ExternalLink, FileUp, MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
import { ItineraryForm } from '../components/ItineraryForm'
import { Modal } from '../components/Modal'
import { StateView } from '../components/StateView'
import { addDays, countNights, formatCurrency, formatDate } from '../lib/format'
import { findOverlaps } from '../lib/itineraryOverlap'
import { downloadTravelExcelReport } from '../lib/travelExcel'
import { useWorkspace, useWorkspaceMutations } from '../hooks/useWorkspace'
import { useNotify } from '../providers/NotificationProvider'
import type { ItineraryDraft, ItineraryItem, TripImportDraft } from '../types'
import styles from './ItineraryPage.module.css'

const ExcelImportModal = lazy(() => import('../components/ExcelImportModal').then((module) => ({ default: module.ExcelImportModal })))

export function ItineraryPage() {
  const workspace = useWorkspace()
  const mutations = useWorkspaceMutations()
  const [editing, setEditing] = useState<ItineraryItem | null | undefined>()
  const notify = useNotify()
  const [formError, setFormError] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const exportPending = useRef(false)
  if (workspace.isLoading) return <StateView state="loading" />
  if (workspace.isError) return <StateView state="error" onAction={() => void workspace.refetch()} />
  if (!workspace.data) return <StateView state="empty" title="Chưa có chuyến đang hoạt động" />
  const data = workspace.data
  const { trip, itinerary } = data
  // A multi-day activity appears under every day of its range; days continuing an earlier start sort first.
  const groups = [...itinerary.reduce((result, item) => {
    const days = item.endDate ? countNights(item.visitDate, item.endDate) + 1 : 1
    for (let day = 0; day < days; day += 1) {
      const date = addDays(item.visitDate, day)
      result.set(date, [...result.get(date) ?? [], { item, day, days }])
    }
    return result
  }, new Map<string, { item: ItineraryItem, day: number, days: number }[]>()).entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, entries]) => [date, entries.sort((a, b) => (a.day ? '' : a.item.startTime).localeCompare(b.day ? '' : b.item.startTime))] as const)

  const save = async (draft: ItineraryDraft) => {
    try {
      setFormError('')
      await mutations.itinerary.mutateAsync({ draft, tripId: trip.id, existing: editing ?? undefined })
      setEditing(undefined)
      notify.success('Đã lưu lịch trình.')
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Không thể lưu lịch trình.')
    }
  }

  const remove = async (item: ItineraryItem) => {
    if (!window.confirm(`Xóa “${item.title}”?`)) return
    try {
      await mutations.deleteItinerary.mutateAsync(item)
      notify.success('Đã xóa địa điểm khỏi lịch trình.')
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Không thể xóa địa điểm.')
    }
  }

  const importData = async (draft: TripImportDraft) => {
    const result = await mutations.importTripData.mutateAsync({ draft, tripId: trip.id })
    setImportOpen(false)
    notify.success(`Đã tạo mới ${result.createdCount} và cập nhật ${result.updatedCount} dòng.`)
  }

  const exportData = async () => {
    if (exportPending.current) return
    exportPending.current = true
    try {
      setExporting(true)
      await downloadTravelExcelReport(data)
      notify.success('Đã xuất báo cáo Excel của chuyến đi.')
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Không thể xuất báo cáo Excel.')
    } finally {
      exportPending.current = false
      setExporting(false)
    }
  }

  return (
    <div className={styles.page} data-ai-id="itinerary-page">
      <header className="section-header section-header--page"><div><p className="eyebrow">Từng ngày một</p><h1>Lịch trình chuyến đi</h1><p>Sắp xếp theo giờ để cả nhóm không bỏ lỡ điều hay.</p></div><div className="section-header__actions"><button className="button button--ghost" type="button" onClick={() => setImportOpen(true)}><FileUp size={19} /> Nhập Excel</button><button className="button button--soft" type="button" disabled={exporting} onClick={() => void exportData()}><Download size={19} /> {exporting ? 'Đang xuất…' : 'Xuất Excel'}</button><button className="button button--primary" type="button" onClick={() => { setFormError(''); setEditing(null) }}><Plus size={19} /> Thêm địa điểm</button></div></header>
      {itinerary.length === 0 ? <StateView state="empty" actionLabel="Thêm địa điểm đầu tiên" onAction={() => { setFormError(''); setEditing(null) }} /> : (
        <div className={styles.days}>
          {groups.map(([date, items]) => (
            <section className={styles.day} key={date}>
              <header><time>{formatDate(date)}</time><span>{items.length} điểm dừng</span></header>
              <ol>
                {items.map(({ item, day, days }) => (
                  <li className={styles.item} key={`${item.id}-${day}`}>
                    <div className={styles.time}><Clock3 size={18} /><strong>{days === 1 || day === 0 ? item.startTime : day === days - 1 ? `Đến ${item.endTime}` : 'Cả ngày'}</strong><span>{days === 1 ? item.endTime : `Ngày ${day + 1}/${days}`}</span></div>
                    <article><div className={styles.itemTitle}><h2>{item.title}</h2><strong>{formatCurrency(item.estimatedCostVnd)}</strong></div>{findOverlaps(item, itinerary).length > 0 && <span className={styles.clash}>Trùng giờ</span>}<p><MapPin size={17} /> {item.address}</p>{item.notes && <p className={styles.note}>{item.notes}</p>}<div className={styles.actions}>{item.mapsUrl && <a className="button button--soft" href={item.mapsUrl} target="_blank" rel="noreferrer"><ExternalLink size={17} /> Chỉ đường</a>}<button className="icon-button" type="button" onClick={() => { setFormError(''); setEditing(item) }} aria-label={`Sửa ${item.title}`}><Pencil size={18} /></button><button className="icon-button icon-button--danger" type="button" disabled={mutations.deleteItinerary.isPending} onClick={() => void remove(item)} aria-label={`Xóa ${item.title}`}><Trash2 size={18} /></button></div></article>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
      <Modal open={editing !== undefined} title={editing ? 'Chỉnh sửa địa điểm' : 'Thêm địa điểm'} onClose={() => setEditing(undefined)}>
        {formError && <div className="form-error-banner" role="alert">{formError}</div>}
        <ItineraryForm item={editing ?? undefined} tripStart={trip.startDate} tripEnd={trip.endDate} itinerary={itinerary} pending={mutations.itinerary.isPending} onSubmit={save} onCancel={() => setEditing(undefined)} />
      </Modal>
      {importOpen && <Suspense fallback={<StateView state="loading" />}><ExcelImportModal open={importOpen} trip={trip} itinerary={itinerary} expenses={data.expenses} people={data.people} pending={mutations.importTripData.isPending} onClose={() => setImportOpen(false)} onSubmit={importData} /></Suspense>}
    </div>
  )
}
