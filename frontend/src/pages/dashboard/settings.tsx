import { useTranslation } from 'react-i18next'
import { PageHeader } from '../../../components/layout/page_header'
import { PersonalInfoCard } from '../../../components/settings/personal_info_card'
import { RatesCard } from '../../../components/settings/rates_card'
import { TaxProfileCard } from '../../../components/settings/tax_profile_card'
import { usePayData } from '../../context/PayDataContext'

export function Settings() {
  const { t } = useTranslation()
  const { loading } = usePayData()
  return (
    <>
      <PageHeader title={t('settings.title')} />
      <div className="max-w-4xl space-y-6">
        <PersonalInfoCard />
        {loading ? null : (
          <>
            <RatesCard />
            <TaxProfileCard />
          </>
        )}
      </div>
    </>
  )
}

export default Settings
