import { useEffect, useId, useRef, useState, type PropsWithChildren } from 'react'
import { X } from 'lucide-react'

let openModals = 0
let bodyOverflow = ''

interface ModalProps extends PropsWithChildren {
  title: string
  open: boolean
  onClose: () => void
  dirty?: boolean
  pending?: boolean
}

export function Modal({ title, open, onClose, children, dirty = false, pending = false }: ModalProps) {
  const titleId = useId()
  const [discarding, setDiscarding] = useState(false)
  const continueRef = useRef<HTMLButtonElement>(null)
  const editingFocus = useRef<HTMLElement | null>(null)
  const dialogRef = useRef<HTMLElement>(null)
  const requestClose = () => {
    if (discarding) { setDiscarding(false); return }
    if (pending || dialogRef.current?.querySelector('[data-pending="true"]')) return
    if (dirty || dialogRef.current?.querySelector('[data-unsaved="true"]')) {
      editingFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      setDiscarding(true)
      return
    }
    onClose()
  }
  const onCloseRef = useRef(requestClose)
  const discardRef = useRef(() => {})

  useEffect(() => {
    onCloseRef.current = requestClose
    discardRef.current = () => {
      if (dirty || dialogRef.current?.querySelector('[data-unsaved="true"]')) { setDiscarding(false); onClose() }
    }
  })
  useEffect(() => {
    if (discarding) continueRef.current?.focus()
    else { editingFocus.current?.focus(); editingFocus.current = null }
  }, [discarding])

  useEffect(() => {
    if (!open) return
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    if (openModals === 0) bodyOverflow = document.body.style.overflow
    openModals += 1
    document.body.style.overflow = 'hidden'
    const focusableSelector = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], summary, [tabindex]:not([tabindex="-1"])'
    const focusFirst = window.requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLElement>(focusableSelector)?.focus()
    })
    const handleKeyDown = (event: KeyboardEvent) => {
      const dialogs = document.querySelectorAll('[aria-modal="true"]')
      if (dialogs[dialogs.length - 1] !== dialogRef.current) return
      if (event.key === 'Escape') { event.preventDefault(); onCloseRef.current() }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector)].filter((element) => !element.closest('[inert]'))
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', handleKeyDown)
    const discard = () => discardRef.current()
    window.addEventListener('wanderplan:discard-editors', discard)
    return () => {
      window.cancelAnimationFrame(focusFirst)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('wanderplan:discard-editors', discard)
      openModals -= 1
      if (openModals === 0) document.body.style.overflow = bodyOverflow
      if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [open])

  if (!open) return null
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && requestClose()}>
      <section ref={dialogRef} className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} data-unsaved={dirty} data-pending={pending} data-ai-id="edit-dialog" onClickCapture={(event) => {
        if ((event.target as HTMLElement).closest('[data-dismiss]')) { event.preventDefault(); event.stopPropagation(); requestClose() }
      }}>
        <header className="modal__header">
          <h2 id={titleId}>{discarding ? 'Bỏ thay đổi chưa lưu?' : title}</h2>
          <button className="icon-button" type="button" onClick={requestClose} aria-label="Đóng" disabled={pending}>
            <X size={22} />
          </button>
        </header>
        {discarding && <div>
          <p>Nội dung đang nhập chưa được lưu. Bỏ thay đổi sẽ không thể khôi phục.</p>
          <div className="form__actions">
            <button ref={continueRef} className="button button--ghost" type="button" onClick={() => setDiscarding(false)}>Tiếp tục chỉnh sửa</button>
            <button className="button button--danger" type="button" onClick={() => { setDiscarding(false); onClose() }}>Bỏ thay đổi</button>
          </div>
        </div>}
        <div className="modal__body" hidden={discarding} inert={discarding}>{children}</div>
      </section>
    </div>
  )
}
