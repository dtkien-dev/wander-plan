import { useState } from 'react'
import { Clock3, ExternalLink, MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
import { ItineraryForm } from '../components/ItineraryForm'
import { Modal } from '../components/Modal'
import { StateView } from '../components/StateView'
import { formatCurrency, formatDate } from '../lib/format'
import { useWorkspace, useWorkspaceMutations } from '../hooks/useWorkspace'
import type { ItineraryDraft, ItineraryItem } from '../types'
import styles from './ItineraryPage.module.css'

export function ItineraryPage() {
  const workspace = useWorkspace()
  const mutations = useWorkspaceMutations()
  const [editing, setEditing] = useState<ItineraryItem | null | undefined>()
  const [feedback, setFeedback] = useState('')
  const [formError, setFormError] = useState('')
  if (workspace.isLoading) return <StateView state="loading" />
  if (workspace.isError) return <StateView state="error" onAction={() => void workspace.refetch()} />
  if (!workspace.data) return <StateView state="empty" title="Chưa có chuyến đi" />
  const { trip, itinerary } = workspace.data
  const groups = [...itinerary.reduce((result, item) => {
    const current = result.get(item.visitDate) ?? []
    current.push(item)
    result.set(item.visitDate, current)
    return result
  }, new Map<string, ItineraryItem[]>()).entries()].sort(([a], [b]) => a.localeCompare(b))

  const save = async (draft: ItineraryDraft) => {
    try {
      setFormError('')
      await mutations.itinerary.mutateAsync({ draft, tripId: trip.id, existing: editing ?? undefined })
      setEditing(undefined)
      setFeedback('Đã lưu lịch trình.')
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Không thể lưu lịch trình.')
    }
  }

  const remove = async (item: ItineraryItem) => {
    if (!window.confirm(`Xóa “${item.title}”?`)) return
    try {
      await mutations.deleteItinerary.mutateAsync(item)
      setFeedback('Đã xóa địa điểm khỏi lịch trình.')
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Không thể xóa địa điểm.')
    }
  }

  return (
    <div className={styles.page} data-ai-id="itinerary-page">
      <header className="section-header section-header--page"><div><p className="eyebrow">Từng ngày một</p><h1>Lịch trình Đà Lạt</h1><p>Sắp xếp theo giờ để cả nhóm không bỏ lỡ điều hay.</p></div><button className="button button--primary" type="button" onClick={() => { setFormError(''); setEditing(null) }}><Plus size={19} /> Thêm địa điểm</button></header>
      {feedback && <div className="feedback" role="status">{feedback}<button type="button" onClick={() => setFeedback('')}>Đóng</button></div>}
      {itinerary.length === 0 ? <StateView state="empty" actionLabel="Thêm địa điểm đầu tiên" onAction={() => { setFormError(''); setEditing(null) }} /> : (
        <div className={styles.days}>
          {groups.map(([date, items]) => (
            <section className={styles.day} key={date}>
              <header><time>{formatDate(date)}</time><span>{items.length} điểm dừng</span></header>
              <ol>
                {items.map((item) => (
                  <li className={styles.item} key={item.id}>
                    <div className={styles.time}><Clock3 size={18} /><strong>{item.startTime}</strong><span>{item.endTime}</span></div>
                    <article><div className={styles.itemTitle}><h2>{item.title}</h2><strong>{formatCurrency(item.estimatedCostVnd)}</strong></div><p><MapPin size={17} /> {item.address}</p>{item.notes && <p className={styles.note}>{item.notes}</p>}<div className={styles.actions}>{item.mapsUrl && <a className="button button--soft" href={item.mapsUrl} target="_blank" rel="noreferrer"><ExternalLink size={17} /> Chỉ đường</a>}<button className="icon-button" type="button" onClick={() => { setFormError(''); setEditing(item) }} aria-label={`Sửa ${item.title}`}><Pencil size={18} /></button><button className="icon-button icon-button--danger" type="button" disabled={mutations.deleteItinerary.isPending} onClick={() => void remove(item)} aria-label={`Xóa ${item.title}`}><Trash2 size={18} /></button></div></article>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
      <Modal open={editing !== undefined} title={editing ? 'Chỉnh sửa địa điểm' : 'Thêm địa điểm'} onClose={() => setEditing(undefined)}>
        {formError && <div className="form-error-banner" role="alert">{formError}</div>}
        <ItineraryForm item={editing ?? undefined} tripStart={trip.startDate} tripEnd={trip.endDate} pending={mutations.itinerary.isPending} onSubmit={save} onCancel={() => setEditing(undefined)} />
      </Modal>
    </div>
  )
}
