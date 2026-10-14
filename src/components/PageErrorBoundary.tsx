import { Component, type PropsWithChildren } from 'react'
import { StateView } from './StateView'

export class PageErrorBoundary extends Component<PropsWithChildren, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() { return { failed: true } }

  render() {
    if (this.state.failed) return <StateView state="error" title="Chưa thể mở trang" message="Kiểm tra kết nối rồi tải lại trang. Nếu ứng dụng vừa được cập nhật, tải lại sẽ lấy bản mới." actionLabel="Tải lại trang" onAction={() => window.location.reload()} />
    return this.props.children
  }
}
