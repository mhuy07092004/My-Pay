import { useTranslation } from 'react-i18next'
import { PersonalInfoCard } from '../../../components/settings/personal_info_card'
import { RatesCard } from '../../../components/settings/rates_card'

export function Settings() {
  const { t } = useTranslation()
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">
        {t('settings.title')}
      </h1>
      <div className="mt-6 max-w-3xl space-y-6 pb-8">
        <PersonalInfoCard />
        <RatesCard />
      </div>
    </>
  )
}

export default Settings
