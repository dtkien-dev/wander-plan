import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { useNotifications } from '../providers/NotificationProvider'

const timeFormatter = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

export function NotificationBell() {
  const { history, remove, clear } = useNotifications()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === 'Escape' : !root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])
  return (
    <div className="notification-bell" ref={root}>
      <button className="icon-button" type="button" aria-label={`Lịch sử thông báo (${history.length})`} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <Bell size={20} strokeWidth={1.8} />
        {history.length > 0 && <span className="notification-bell__count" aria-hidden="true">{history.length}</span>}
      </button>
      {open && (
        <section className="notification-panel" aria-label="Lịch sử thông báo">
          <header><h2>Thông báo</h2>{history.length > 0 && <button className="text-link" type="button" onClick={clear}>Xoá tất cả</button>}</header>
          {history.length === 0 ? <p className="notification-panel__empty">Chưa có thông báo nào trên thiết bị này.</p> : (
            <ul>
              {history.map((entry) => (
                <li key={entry.id} className={entry.kind === 'error' ? 'is-error' : undefined}>
                  <div><time dateTime={entry.at}>{timeFormatter.format(new Date(entry.at))}</time><p>{entry.message}</p></div>
                  <button className="notification-panel__remove" type="button" onClick={() => remove(entry.id)} aria-label={`Xoá thông báo: ${entry.message}`}>Xoá</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
