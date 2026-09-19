import { Card } from '../../../components/card/card'
import { DashboardNavbar } from '../../../components/navbar/dashboard_navbar'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'

export function Dashboard() {
  const { user } = useAuth()
  const { t } = useTranslation()

  return (
    <div className="flex min-h-svh bg-[#18181B] text-[#F4F4F5]">
      <DashboardNavbar />
      <main className="flex-1 px-4 pt-20 md:px-8 md:pt-8">
        <h1 className="text-2xl font-semibold tracking-tight">{t('dashboard.title')}</h1>
        <p className="mt-2 text-[#A1A1AA]">
          {t('dashboard.welcome', { name: user?.firstName })}
        </p>
        <div className="mt-6">
          <Card label={t('dashboard.totalEarning')} value="12,345" prefix="$" />
        </div>
      </main>
    </div>
  )
}

export default Dashboard
