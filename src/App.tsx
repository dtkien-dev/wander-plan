import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { StateView } from './components/StateView'
import { useAuth } from './providers/AuthProvider'
import { DashboardPage } from './pages/DashboardPage'
import { ExpensesPage } from './pages/ExpensesPage'
import { ItineraryPage } from './pages/ItineraryPage'
import { LoginPage } from './pages/LoginPage'

export function App() {
  const { isDemo, loading, session } = useAuth()
  if (loading) return <main className="boot-state"><StateView state="loading" /></main>
  if (!isDemo && !session) return <LoginPage />
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<DashboardPage />} />
        <Route path="itinerary" element={<ItineraryPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
