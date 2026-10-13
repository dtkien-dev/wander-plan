import { AlertTriangle, Compass, RefreshCw } from 'lucide-react'

interface StateViewProps {
  state: 'loading' | 'empty' | 'error'
  title?: string
  message?: string
  actionLabel?: string
  onAction?: () => void
  actionDisabled?: boolean
}

export function StateView({ state, title, message, actionLabel, onAction, actionDisabled = false }: StateViewProps) {
  if (state === 'loading') {
    return (
      <section className="state-view state-view--loading" aria-busy="true" aria-label="Đang tải dữ liệu">
        <div className="skeleton skeleton--title" />
        <div className="skeleton" />
        <div className="skeleton skeleton--short" />
      </section>
    )
  }

  const Icon = state === 'error' ? AlertTriangle : Compass
  return (
    <section className={`state-view state-view--${state}`} role={state === 'error' ? 'alert' : 'status'}>
      <span className="state-view__icon"><Icon size={32} strokeWidth={1.6} aria-hidden="true" /></span>
      <h2>{title ?? (state === 'error' ? 'Chưa thể tải dữ liệu' : 'Chưa có kế hoạch nào')}</h2>
      <p>{message ?? (state === 'error' ? 'Kết nối đang gặp sự cố. Bạn thử lại nhé.' : 'Bắt đầu bằng một điểm đến đầu tiên cho cả nhóm.')}</p>
      {onAction && (
        <button className="button button--primary" type="button" onClick={onAction} disabled={actionDisabled}>
          {state === 'error' && <RefreshCw size={18} aria-hidden="true" />}
          {actionLabel ?? (state === 'error' ? 'Thử lại' : 'Bắt đầu')}
        </button>
      )}
    </section>
  )
}
