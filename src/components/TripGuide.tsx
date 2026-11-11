import { useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './TripGuide.module.css'

export function TripGuide({ storageKey }: { storageKey: string }) {
  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem(storageKey) !== 'closed' }
    catch { return true }
  })

  function toggle() {
    setOpen(!open)
    try {
      if (open) localStorage.setItem(storageKey, 'closed')
      else localStorage.removeItem(storageKey)
    } catch { /* The guide can still be toggled while storage is unavailable. */ }
  }

  return <section className={styles.guide} aria-label="Hướng dẫn nhanh">
    <button className="button button--ghost" type="button" aria-expanded={open} aria-controls="trip-guide" onClick={toggle}>
      {open ? 'Đóng hướng dẫn' : 'Hướng dẫn'}
    </button>
    <div id="trip-guide" hidden={!open}>
      <h2>Bắt đầu với chuyến đi</h2>
      <ul>
        <li><Link className="text-link" to="/itinerary">Lịch trình</Link> · Xem kế hoạch từng ngày.</li>
        <li><Link className="text-link" to="/expenses">Chi phí</Link> · Xem chi phí chung hoặc ghi khoản bạn đã trả.</li>
        <li><Link className="text-link" to="/group">Nhóm</Link> · Đặt tên hiển thị và xem danh sách việc cần làm.</li>
      </ul>
    </div>
  </section>
}
