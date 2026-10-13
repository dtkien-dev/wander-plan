import { CalendarDays, LayoutDashboard, ReceiptText, LogOut } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { Brand } from './Brand'
import { useAuth } from '../providers/AuthProvider'

const navItems = [
  { to: '/', label: 'Tổng quan', icon: LayoutDashboard },
  { to: '/itinerary', label: 'Lịch trình', icon: CalendarDays },
  { to: '/expenses', label: 'Chi phí', icon: ReceiptText },
]

export function AppShell() {
  const { isDemo, session, signOut } = useAuth()
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
          <span className={`mode-badge ${isDemo ? 'mode-badge--demo' : ''}`}>{isDemo ? 'Bản xem thử' : 'Đã đồng bộ'}</span>
          {session && (
            <button className="icon-button" type="button" onClick={() => void signOut()} aria-label="Đăng xuất">
              <LogOut size={20} strokeWidth={1.8} />
            </button>
          )}
        </div>
      </header>
      <main className="page" data-ai-id="page-content">
        <Outlet />
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
