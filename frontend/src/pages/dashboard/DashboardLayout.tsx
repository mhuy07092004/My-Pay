import { Outlet } from 'react-router-dom'
import { DashboardNavbar } from '../../../components/navbar/dashboard_navbar'

export function DashboardLayout() {
  return (
    <div className="flex min-h-svh bg-[#18181B] text-[#F4F4F5]">
      <DashboardNavbar />
      <main className="min-w-0 flex-1 px-4 pt-[calc(4.5rem+env(safe-area-inset-top))] pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6 md:pt-8 md:pb-10 lg:px-10 lg:pt-10">
        <div className="mx-auto w-full max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default DashboardLayout
