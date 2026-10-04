import { Card } from '../../../components/card/card'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'

export function Dashboard() {
  const { user } = useAuth()
  const { t } = useTranslation()

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">{t('dashboard.title')}</h1>
      <p className="mt-2 text-[#A1A1AA]">
        {t('dashboard.welcome', { name: user?.firstName })}
      </p>
      <div className="mt-6">
        <Card label={t('dashboard.totalEarning')} value="12,345" prefix="$" />
      </div>
    </>
  )
}

export default Dashboard
