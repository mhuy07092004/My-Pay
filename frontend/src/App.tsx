import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { USE_MOCK } from './lib/mock/flag'
import { About } from './pages/About'
import { Feature } from './pages/Feature'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Pricing } from './pages/Pricing'
import { Dashboard } from './pages/dashboard/dashboard'
import { DashboardLayout } from './pages/dashboard/DashboardLayout'
import { NewShifts } from './pages/dashboard/new_shifts'
import { PeriodDetail } from './pages/dashboard/period_detail'
import { Report } from './pages/dashboard/report'
import { Calendar } from './pages/dashboard/calendar'
import { Settings } from './pages/dashboard/settings'
import { Timesheet } from './pages/dashboard/timesheet'

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return children
}

function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

function MockDataBadge() {
  if (!USE_MOCK) return null
  return (
    <div className="pointer-events-none fixed top-2 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-[#C8E664] px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-[#18181B]">
      MOCK DATA
    </div>
  )
}

function App() {
  return (
    <>
      <MockDataBadge />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/features" element={<Feature />} />
        <Route path="/about" element={<About />} />
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
          <Route path="calendar" element={<Calendar />} />
          <Route path="timesheet" element={<Timesheet />} />
          <Route path="timesheet/newshifts" element={<NewShifts />} />
          <Route path="timesheet/:periodId" element={<PeriodDetail />} />
          <Route path="report" element={<Report />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </>
  )
}

export default App
