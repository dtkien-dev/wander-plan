import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { StateView } from './components/StateView'
import { useAuth } from './providers/AuthProvider'
import { LoginPage } from './pages/LoginPage'
import { WorkspaceProvider } from './providers/WorkspaceProvider'

const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const ExpensesPage = lazy(() => import('./pages/ExpensesPage').then((module) => ({ default: module.ExpensesPage })))
const ItineraryPage = lazy(() => import('./pages/ItineraryPage').then((module) => ({ default: module.ItineraryPage })))
const GroupPage = lazy(() => import('./pages/GroupPage').then((module) => ({ default: module.GroupPage })))

export function App() {
  const { configurationError, isDemo, loading, session } = useAuth()
  if (loading) return <main className="boot-state"><StateView state="loading" /></main>
  if (configurationError) return <main className="boot-state"><StateView state="error" title="Thiếu cấu hình hệ thống" message={configurationError} /></main>
  if (!isDemo && !session) return <LoginPage />
  return (
    <WorkspaceProvider key={session?.user.id ?? 'demo'}><Suspense fallback={<StateView state="loading" />}><Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="itinerary" element={<ItineraryPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="group" element={<GroupPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes></Suspense></WorkspaceProvider>
  )
}
