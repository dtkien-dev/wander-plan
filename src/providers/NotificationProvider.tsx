import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

export type NotificationKind = 'success' | 'error'
export interface NotificationEntry { id: string, message: string, kind: NotificationKind, at: string }

const HISTORY_LIMIT = 50
const TOAST_MS = 3000
const storageKey = (accountKey: string) => `wander-plan-notifications:${accountKey}`

// History is a per-browser convenience: storage can be blocked or cleared, so failures fall back to memory only.
const readHistory = (accountKey: string): NotificationEntry[] => {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(storageKey(accountKey)) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((entry): entry is NotificationEntry =>
      typeof entry?.id === 'string' && typeof entry?.message === 'string' && (entry?.kind === 'success' || entry?.kind === 'error') && typeof entry?.at === 'string',
    ).slice(0, HISTORY_LIMIT) : []
  } catch {
    return []
  }
}
const writeHistory = (accountKey: string, history: NotificationEntry[]) => {
  try { localStorage.setItem(storageKey(accountKey), JSON.stringify(history)) } catch { /* keep in memory */ }
}

interface NotificationContextValue {
  notify: { success: (message: string) => void, error: (message: string) => void }
  history: NotificationEntry[]
  remove: (id: string) => void
  clear: () => void
}
const NotificationContext = createContext<NotificationContextValue | null>(null)

function Toast({ entry, onClose }: { entry: NotificationEntry, onClose: (id: string) => void }) {
  const timer = useRef<number | undefined>(undefined)
  // Errors stay until closed; other toasts hide after 3 s and pause while hovered or focused.
  const start = useCallback(() => {
    if (entry.kind === 'error') return
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => onClose(entry.id), TOAST_MS)
  }, [entry, onClose])
  const pause = () => window.clearTimeout(timer.current)
  useEffect(() => {
    start()
    return () => window.clearTimeout(timer.current)
  }, [start])
  return (
    <div className={`toast toast--${entry.kind}`} role={entry.kind === 'error' ? 'alert' : 'status'}
      onMouseEnter={pause} onMouseLeave={start} onFocus={pause} onBlur={start}>
      <span>{entry.message}</span>
      <button type="button" onClick={() => onClose(entry.id)} aria-label="Đóng thông báo">Đóng</button>
    </div>
  )
}

export function NotificationProvider({ accountKey, children }: { accountKey: string, children: ReactNode }) {
  const [history, setHistory] = useState(() => readHistory(accountKey))
  const [toasts, setToasts] = useState<NotificationEntry[]>([])
  const update = useCallback((change: (current: NotificationEntry[]) => NotificationEntry[]) => {
    setHistory((current) => {
      const next = change(current)
      writeHistory(accountKey, next)
      return next
    })
  }, [accountKey])
  const push = useCallback((kind: NotificationKind, message: string) => {
    const entry = { id: crypto.randomUUID(), message, kind, at: new Date().toISOString() }
    setToasts((current) => [...current, entry])
    update((current) => [entry, ...current].slice(0, HISTORY_LIMIT))
  }, [update])
  const closeToast = useCallback((id: string) => setToasts((current) => current.filter((entry) => entry.id !== id)), [])
  const value = useMemo<NotificationContextValue>(() => ({
    notify: { success: (message) => push('success', message), error: (message) => push('error', message) },
    history,
    remove: (id) => update((current) => current.filter((entry) => entry.id !== id)),
    clear: () => update(() => []),
  }), [history, push, update])
  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="toast-region" aria-label="Thông báo">
        {toasts.map((entry) => <Toast key={entry.id} entry={entry} onClose={closeToast} />)}
      </div>
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('NotificationProvider is required')
  return context
}

export const useNotify = () => useNotifications().notify
