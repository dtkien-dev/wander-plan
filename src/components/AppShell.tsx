import { useState } from 'react'
import { CalendarDays, LayoutDashboard, ReceiptText, LogOut, UsersRound } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { Brand } from './Brand'
import { useAuth } from '../providers/AuthProvider'
import { useWorkspaceContext } from '../providers/WorkspaceProvider'
import { TripManager } from './TripManager'
import { version } from '../../package.json'

const navItems = [
  { to: '/', label: 'Tổng quan', icon: LayoutDashboard },
  { to: '/itinerary', label: 'Lịch trình', icon: CalendarDays },
  { to: '/expenses', label: 'Chi phí', icon: ReceiptText },
  { to: '/group', label: 'Nhóm', icon: UsersRound },
]

export function AppShell() {
  const { isDemo, session, signOut } = useAuth()
  const { identity, tripId } = useWorkspaceContext()
  const [signOutError, setSignOutError] = useState('')
  const [signingOut, setSigningOut] = useState(false)
  const logout = async () => {
    if (signingOut) return
    setSigningOut(true)
    setSignOutError('')
    try { await signOut() } catch { setSignOutError('Chưa thể đăng xuất. Hãy kiểm tra kết nối và thử lại.') }
    finally { setSigningOut(false) }
  }
  return (
    <div className="app-shell" data-ai-id="app-shell">
      <header className="topbar" data-ai-id="desktop-navigation">
        <Brand />
        <nav className="desktop-nav" aria-label="Điều hướng chính">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}>
              <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="user-area">
          <span className="version-badge" aria-label="Phiên bản website">v{version}</span>
          {isDemo && <span className="mode-badge mode-badge--demo" title="Dữ liệu chỉ được lưu trên trình duyệt này, không chia sẻ với người khác.">Bản xem thử</span>}
          {session && (
            <button className="icon-button" type="button" disabled={signingOut} onClick={() => void logout()} aria-label="Đăng xuất">
              <LogOut size={20} strokeWidth={1.8} />
            </button>
          )}
        </div>
      </header>
      {signOutError && <div className="shell-alert" role="alert">{signOutError}<button type="button" onClick={() => setSignOutError('')}>Đóng</button></div>}
      <main className="page" data-ai-id="page-content">
        <TripManager />
        <div key={`${identity}-${tripId ?? 'none'}`}><Outlet /></div>
      </main>
      <nav className="mobile-nav" aria-label="Điều hướng chính trên điện thoại" data-ai-id="mobile-navigation">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `mobile-nav__link ${isActive ? 'is-active' : ''}`}>
            <Icon size={23} strokeWidth={1.8} aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
