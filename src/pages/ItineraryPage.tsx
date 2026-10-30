import { lazy, Suspense, useRef, useState } from 'react'
import { CheckSquare, Download, ExternalLink, FileUp, MapPin, Pencil, Plus, Trash2, X } from 'lucide-react'
import { ActionsMenu } from '../components/ActionsMenu'
import { ItineraryForm } from '../components/ItineraryForm'
import { Modal } from '../components/Modal'
import { StateView } from '../components/StateView'
import { addDays, countNights, formatCurrency, formatDate } from '../lib/format'
import { findOverlaps } from '../lib/itineraryOverlap'
import { downloadTravelExcelReport } from '../lib/travelExcel'
import { useWorkspace } from '../hooks/useWorkspace'
import { useWorkspaceMutations } from '../hooks/useWorkspaceMutations'
import { useSeenItinerary } from '../hooks/useSeenItinerary'
import { useNotify } from '../providers/NotificationProvider'
import type { ItineraryDraft, ItineraryItem, TripImportDraft } from '../types'
import styles from './ItineraryPage.module.css'

const ExcelImportModal = lazy(() => import('../components/ExcelImportModal').then((module) => ({ default: module.ExcelImportModal })))

export function ItineraryPage() {
  const workspace = useWorkspace()
  const mutations = useWorkspaceMutations()
  const [editing, setEditing] = useState<ItineraryItem | null | undefined>()
  const notify = useNotify()
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState<ItineraryItem[]>([])
  const [confirming, setConfirming] = useState<ItineraryItem[] | null>(null)
  const [removing, setRemoving] = useState<ItineraryItem | null>(null)
  const [removeError, setRemoveError] = useState('')
  const [showTrash, setShowTrash] = useState(false)
  const [trashError, setTrashError] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [formError, setFormError] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const exportPending = useRef(false)
  const changed = useSeenItinerary(workspace.data)
  if (workspace.isLoading) return <StateView state="loading" />
  if (workspace.isError) return <StateView state="error" onAction={() => void workspace.refetch()} />
  if (!workspace.data) return <StateView state="empty" title="Chưa có chuyến đang hoạt động" />
  const data = workspace.data
  const { trip, itinerary } = data
  const trash = (data.itineraryTrash ?? []).filter((item) => Date.parse(item.expiresAt) > Date.now())
  const isOwner = data.currentRole === 'owner'
  const selectedItems = selected.filter((item) => item.tripId === trip.id && itinerary.some((current) => current.id === item.id))
  const bulkPending = mutations.deleteItineraries.isPending
  const showSelection = isOwner && selecting && itinerary.length > 0
  const toggleItem = (item: ItineraryItem) => setSelected((current) => current.some((entry) => entry.id === item.id)
    ? current.filter((entry) => entry.id !== item.id) : [...current, item])
  const removeSelected = async () => {
    if (!confirming || !isOwner) return
    setDeleteError('')
    try {
      await mutations.deleteItineraries.mutateAsync({ tripId: trip.id, items: confirming })
      setSelected([])
      setConfirming(null)
      notify.success(`Đã xóa ${confirming.length} mục lịch trình.`)
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Không thể xóa các mục lịch trình.')
    }
  }
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
    try {
      setRemoveError('')
      await mutations.deleteItinerary.mutateAsync(item)
      setRemoving(null)
      notify.success('Đã chuyển địa điểm vào thùng rác trong 7 ngày.')
    } catch (error) {
      setRemoveError(error instanceof Error ? error.message : 'Không thể xóa địa điểm.')
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
      <header className="section-header section-header--page">
        <div><h1>Lịch trình</h1><p>Giờ, điểm dừng và trạng thái của từng ngày.</p></div>
        <div className="section-header__actions">
          <button className="button button--primary" type="button" onClick={() => { setFormError(''); setEditing(null) }}><Plus size={18} aria-hidden="true" /> Thêm địa điểm</button>
          {isOwner && itinerary.length > 0 && <button className="button button--ghost" type="button" aria-pressed={selecting} onClick={() => { setSelecting(!selecting); setSelected([]) }}>
            {selecting ? <><X size={18} aria-hidden="true" /> Xong chọn</> : <><CheckSquare size={18} aria-hidden="true" /> Chọn</>}
          </button>}
          <ActionsMenu>
              <button type="button" onClick={() => setImportOpen(true)}><FileUp size={18} aria-hidden="true" /> Nhập Excel</button>
              <button type="button" disabled={exporting} onClick={() => void exportData()}><Download size={18} aria-hidden="true" /> {exporting ? 'Đang xuất…' : 'Xuất Excel'}</button>
              {isOwner && <button type="button" onClick={() => { setTrashError(''); setShowTrash(true) }}><Trash2 size={18} aria-hidden="true" /> Thùng rác ({trash.length})</button>}
          </ActionsMenu>
        </div>
      </header>
      {showSelection && <div className={styles.selection}>
        <label><input type="checkbox" checked={selectedItems.length === itinerary.length} disabled={bulkPending} onChange={(event) => setSelected(event.target.checked ? [...itinerary] : [])} /> Chọn tất cả ({itinerary.length})</label>
        <button className="button button--danger" type="button" disabled={!selectedItems.length || bulkPending || mutations.deleteItinerary.isPending} onClick={() => { setDeleteError(''); setConfirming([...selectedItems]) }}><Trash2 size={18} aria-hidden="true" /> Xóa mục đã chọn ({selectedItems.length})</button>
      </div>}
      {itinerary.length === 0 ? <StateView state="empty" actionLabel="Thêm địa điểm đầu tiên" onAction={() => { setFormError(''); setEditing(null) }} /> : (
        <div className={styles.days}>
          {groups.map(([date, items]) => (
            <section className={styles.day} key={date} aria-labelledby={`day-${date}`}>
              <header><h2 id={`day-${date}`}><time dateTime={date}>{formatDate(date)}</time></h2><span>{items.length} điểm dừng</span></header>
              <ol>
                {items.map(({ item, day, days }) => {
                  const isChanged = changed.has(item.id)
                  const clashes = findOverlaps(item, itinerary).length > 0
                  return (
                  <li className={`${styles.item} ${showSelection ? styles.itemSelecting : ''} ${isChanged ? styles.itemChanged : ''}`} key={`${item.id}-${day}`}>
                    {showSelection && <label className={styles.selectItem}><input type="checkbox" checked={selectedItems.some((entry) => entry.id === item.id)} disabled={bulkPending} onChange={() => toggleItem(item)} aria-label={`Chọn ${item.title} ngày ${formatDate(date)}`} /></label>}
                    <div className={styles.time}>
                      <strong>{days === 1 || day === 0 ? item.startTime : day === days - 1 ? `→ ${item.endTime}` : 'Cả ngày'}</strong>
                      <span>{days === 1 ? `đến ${item.endTime}` : `Ngày ${day + 1}/${days}`}</span>
                      {days > 1 && <span className={styles.span} aria-hidden="true">{Array.from({ length: days }, (_, index) => <i key={index} className={index === day ? styles.spanOn : ''} />)}</span>}
                    </div>
                    <div className={styles.body}>
                      <div className={styles.itemTitle}><h3>{item.title}</h3><data value={item.estimatedCostVnd}>{formatCurrency(item.estimatedCostVnd)}</data></div>
                      {(isChanged || clashes) && <p className={styles.tags}>
                        {isChanged && <span className="status-tag status-tag--changed">Đã đổi</span>}
                        {clashes && <span className={styles.clash}>Trùng giờ</span>}
                      </p>}
                      <p className={styles.address}><MapPin size={16} aria-hidden="true" /> {item.address}</p>
                      {item.notes && <p className={styles.note}>{item.notes}</p>}
                    </div>
                    <div className={styles.actions}>
                      {item.mapsUrl && <a className={`button button--soft ${styles.directions}`} href={item.mapsUrl} target="_blank" rel="noreferrer" aria-label={`Chỉ đường đến ${item.title}`}><ExternalLink size={16} aria-hidden="true" /><span>Chỉ đường</span></a>}
                      <button className="icon-button" type="button" onClick={() => { setFormError(''); setEditing(item) }} aria-label={`Sửa ${item.title}`}><Pencil size={18} /></button>
                      <button className="icon-button icon-button--danger" type="button" disabled={mutations.deleteItinerary.isPending || bulkPending} onClick={() => { setRemoveError(''); setRemoving(item) }} aria-label={`Xóa ${item.title}`}><Trash2 size={18} /></button>
                    </div>
                  </li>
                  )
                })}
              </ol>
            </section>
          ))}
        </div>
      )}
      <Modal open={editing !== undefined} title={editing ? 'Chỉnh sửa địa điểm' : 'Thêm địa điểm'} onClose={() => setEditing(undefined)}>
        {formError && <div className="form-error-banner" role="alert">{formError}</div>}
        <ItineraryForm item={editing ?? undefined} tripStart={trip.startDate} tripEnd={trip.endDate} itinerary={itinerary} pending={mutations.itinerary.isPending} onSubmit={save} onCancel={() => setEditing(undefined)} />
      </Modal>
      <Modal open={removing !== null} title="Xóa địa điểm?" onClose={() => { if (!mutations.deleteItinerary.isPending) setRemoving(null) }}>
        <p>“{removing?.title}” sẽ được chuyển vào thùng rác. Chủ nhóm có thể khôi phục trong 7 ngày.</p>
        {removeError && <p className="form-error-banner" role="alert">{removeError}</p>}
        <div className="form__actions"><button className="button button--ghost" type="button" disabled={mutations.deleteItinerary.isPending} onClick={() => setRemoving(null)}>Hủy</button><button className="button button--danger" type="button" disabled={mutations.deleteItinerary.isPending} onClick={() => removing && void remove(removing)}>{mutations.deleteItinerary.isPending ? 'Đang xóa…' : 'Xóa địa điểm'}</button></div>
      </Modal>
      <Modal open={confirming !== null} title="Xóa lịch trình đã chọn?" onClose={() => { if (!bulkPending) setConfirming(null) }}>
        <p>Bạn sắp xóa {confirming?.length ?? 0} mục lịch trình. Chủ chuyến có thể khôi phục trong 7 ngày. Chi phí và thành viên được giữ nguyên.</p>
        <p>Nếu chi phí vẫn nằm ngoài khoảng ngày mới, bạn vẫn chưa thể đổi ngày chuyến đi.</p>
        {deleteError && <p className="form-error-banner" role="alert">{deleteError}</p>}
        <div className="form__actions"><button className="button button--ghost" type="button" disabled={bulkPending} onClick={() => setConfirming(null)}>Hủy</button><button className="button button--danger" type="button" disabled={bulkPending} onClick={() => void removeSelected()}>{bulkPending ? 'Đang xóa…' : `Xác nhận xóa ${confirming?.length ?? 0} mục`}</button></div>
      </Modal>
      {showTrash && isOwner && <Modal open title="Thùng rác lịch trình" onClose={() => { if (!mutations.restoreItinerary.isPending) setShowTrash(false) }}>
        <p>Khôi phục trong 7 ngày kể từ lúc xóa. Ngày hoạt động phải nằm trong chuyến hiện tại; sau 7 ngày mục sẽ hết hạn và được dọn tự động.</p>
        {trashError && <p className="form-error-banner" role="alert">{trashError}</p>}
        {trash.length === 0 ? <p>Thùng rác đang trống.</p> : <ul className={styles.trash}>{trash.map((item) => <li key={item.id}>
          <div><strong>{item.title}</strong><p>{formatDate(item.visitDate)}{item.endDate && ` — ${formatDate(item.endDate)}`}</p><small>Khôi phục trước {new Date(item.expiresAt).toLocaleString('vi-VN')}</small></div>
          <button className="button button--soft" type="button" disabled={mutations.restoreItinerary.isPending} aria-label={`Khôi phục ${item.title}`} onClick={async () => {
            setTrashError('')
            try { await mutations.restoreItinerary.mutateAsync(item); notify.success('Đã khôi phục lịch trình.') }
            catch (error) { setTrashError(error instanceof Error ? error.message : 'Chưa thể khôi phục lịch trình.') }
          }}>Khôi phục</button>
        </li>)}</ul>}
      </Modal>}
      {importOpen && <Suspense fallback={<StateView state="loading" />}><ExcelImportModal open={importOpen} trip={trip} itinerary={itinerary} expenses={data.expenses} people={data.people} pending={mutations.importTripData.isPending} onClose={() => setImportOpen(false)} onSubmit={importData} /></Suspense>}
    </div>
  )
}
