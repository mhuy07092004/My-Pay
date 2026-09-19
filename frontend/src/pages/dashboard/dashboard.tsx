import { DashboardNavbar } from '../../../components/navbar/dashboard_navbar'
import { useAuth } from '../../context/AuthContext'

export function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="flex min-h-svh bg-[#18181B] text-[#F4F4F5]">
      <DashboardNavbar />
      <main className="flex-1 px-4 pt-20 md:px-8 md:pt-8">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-[#A1A1AA]">
          Welcome back, {user?.firstName}.
        </p>
      </main>
    </div>
  )
}

export default Dashboard
