import { useState } from 'react'
import { Archive } from 'lucide-react'
import { Modal } from './Modal'
import styles from './ArchiveTripControl.module.css'

export function ArchiveTripControl({ name, busy, onArchive }: { name: string; busy: boolean; onArchive: () => Promise<unknown> }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const archive = async () => {
    setError('')
    try { await onArchive(); setOpen(false) }
    catch (error) { setError(error instanceof Error ? error.message : 'Chưa thể lưu trữ. Hãy thử lại.') }
  }
  return <section className={styles.control} aria-labelledby="archive-trip-title">
    <div><h2 id="archive-trip-title">Lưu trữ chuyến đi</h2><p>Ẩn nội dung khỏi cả nhóm và giữ nguyên dữ liệu. Chỉ chủ nhóm có thể khôi phục.</p></div>
    <button type="button" className="button button--ghost" disabled={busy} onClick={() => { setError(''); setOpen(true) }}><Archive size={18} />Lưu trữ chuyến này</button>
    <Modal open={open} title="Xác nhận lưu trữ chuyến đi" onClose={() => { if (!busy) setOpen(false) }}>
      <p className={styles.confirm}>Lưu trữ <strong>{name}</strong>? Lịch trình, chi phí và checklist sẽ bị ẩn với mọi người cho đến khi chủ nhóm khôi phục trong mục “Đã lưu trữ”. Thành viên và dữ liệu vẫn được giữ nguyên.</p>
      {error && <p className="form-error-banner" role="alert">{error}</p>}
      <div className="form__actions"><button type="button" className="button button--ghost" disabled={busy} onClick={() => setOpen(false)}>Giữ chuyến đang hoạt động</button><button type="button" className="button button--primary" disabled={busy} onClick={() => void archive()}>{busy ? 'Đang lưu trữ…' : 'Lưu trữ chuyến đi'}</button></div>
    </Modal>
  </section>
}
