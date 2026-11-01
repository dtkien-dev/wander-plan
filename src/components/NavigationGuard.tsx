import { useEffect, type PropsWithChildren } from 'react'
import { useBlocker } from 'react-router-dom'
import { Modal } from './Modal'

// Modal forms expose their current RHF/controlled state, never a copy of their data.
const editing = () => Boolean(document.querySelector('[data-unsaved="true"], [data-pending="true"]'))

export function NavigationGuard({ children }: PropsWithChildren) {
  const blocker = useBlocker(editing)
  const pending = Boolean(document.querySelector('[data-pending="true"]'))
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!editing()) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [])
  return <><div inert={blocker.state === 'blocked'}>{children}</div><Modal open={blocker.state === 'blocked'} title={pending ? 'Đang lưu thay đổi' : 'Rời trang và bỏ thay đổi?'} onClose={() => blocker.state === 'blocked' && blocker.reset()}>
    <p>{pending ? 'Hãy chờ lưu xong trước khi rời trang.' : 'Nội dung đang nhập chưa được lưu. Bạn có thể tiếp tục chỉnh sửa hoặc bỏ thay đổi để rời trang.'}</p>
    <div className="form__actions">
      <button className="button button--ghost" type="button" onClick={() => blocker.state === 'blocked' && blocker.reset()}>Tiếp tục chỉnh sửa</button>
      {!pending && <button className="button button--danger" type="button" onClick={() => {
        if (blocker.state !== 'blocked' || document.querySelector('[data-pending="true"]')) return
        // Shell editors (such as trip creation) survive route changes unless explicitly closed.
        window.dispatchEvent(new Event('wanderplan:discard-editors'))
        blocker.proceed()
      }}>Bỏ thay đổi và rời trang</button>}
    </div>
  </Modal></>
}
