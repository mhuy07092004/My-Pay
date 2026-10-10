import { useTranslation } from 'react-i18next'
import { Tabs } from '../tabs/tabs'

export type BillingPeriod = 'monthly' | 'yearly'

type BillingToggleProps = {
  value: BillingPeriod
  onChange: (value: BillingPeriod) => void
}

export function BillingToggle({ value, onChange }: BillingToggleProps) {
  const { t } = useTranslation()

  return (
    <Tabs<BillingPeriod>
      ariaLabel={t('pricing.billing.label')}
      value={value}
      onChange={onChange}
      items={[
        { value: 'monthly', label: t('pricing.billing.monthly') },
        { value: 'yearly', label: t('pricing.billing.yearly') },
      ]}
    />
  )
}
