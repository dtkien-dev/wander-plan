import { useEffect, useRef, type PropsWithChildren } from 'react'
import { MoreHorizontal } from 'lucide-react'

/** "Thêm" disclosure for secondary page actions; closes on Escape, outside press or choosing an item. */
export function ActionsMenu({ children }: PropsWithChildren) {
  const menu = useRef<HTMLDetailsElement>(null)
  useEffect(() => {
    const close = (event: PointerEvent | KeyboardEvent) => {
      const element = menu.current
      if (!element?.open) return
      if (event instanceof KeyboardEvent) {
        if (event.key !== 'Escape') return
        element.open = false
        element.querySelector('summary')?.focus()
      } else if (!element.contains(event.target as Node)) element.open = false
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', close)
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', close) }
  }, [])
  return (
    <details className="menu" ref={menu}>
      <summary className="button button--ghost"><MoreHorizontal size={18} aria-hidden="true" /> Thêm</summary>
      <div className="menu__panel" onClick={(event) => { if ((event.target as Element).closest('button')) menu.current!.open = false }}>{children}</div>
    </details>
  )
}
