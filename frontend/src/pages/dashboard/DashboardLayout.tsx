import { Outlet } from 'react-router-dom'
import { DashboardNavbar } from '../../../components/navbar/dashboard_navbar'

export function DashboardLayout() {
  return (
    <div className="flex min-h-svh bg-[#18181B] text-[#F4F4F5]">
      <DashboardNavbar />
      <main className="flex-1 px-4 pt-20 md:px-8 md:pt-8">
        <Outlet />
      </main>
    </div>
  )
}

export default DashboardLayout
