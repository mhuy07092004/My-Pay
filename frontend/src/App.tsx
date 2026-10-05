import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Dashboard } from './pages/dashboard/dashboard'
import { DashboardLayout } from './pages/dashboard/DashboardLayout'
import { History } from './pages/dashboard/history'
import { NewShifts } from './pages/dashboard/new_shifts'
import { PeriodDetail } from './pages/dashboard/period_detail'
import { Settings } from './pages/dashboard/settings'
import { Timesheet } from './pages/dashboard/timesheet'

function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return children
}

function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (user) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/login"
        element={
          <RedirectIfAuthenticated>
            <Login />
          </RedirectIfAuthenticated>
        }
      />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="timesheet" element={<Timesheet />} />
        <Route path="timesheet/newshifts" element={<NewShifts />} />
        <Route path="timesheet/:periodId" element={<PeriodDetail />} />
        <Route path="history" element={<History />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default App
