import { useTranslation } from 'react-i18next'
import { PageHeader } from '../../../components/layout/page_header'
import { PersonalInfoCard } from '../../../components/settings/personal_info_card'
import { RatesCard } from '../../../components/settings/rates_card'
import { TaxProfileCard } from '../../../components/settings/tax_profile_card'
import { LoadError } from '../../../components/skeleton/load_error'
import { LoadingRegion, Skeleton } from '../../../components/skeleton/skeleton'
import { usePayData } from '../../context/PayDataContext'

export function Settings() {
  const { t } = useTranslation()
  const { loading, error, retry } = usePayData()
  return (
    <>
      <PageHeader title={t('settings.title')} />
      <div className="max-w-4xl space-y-6">
        <PersonalInfoCard />
        {loading ? (
          <LoadingRegion label={t('common.loading')}>
            <div className="space-y-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          </LoadingRegion>
        ) : error ? (
          <LoadError onRetry={retry} />
        ) : (
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
