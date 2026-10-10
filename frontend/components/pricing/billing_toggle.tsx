import { motion } from 'framer-motion'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'

export type BillingPeriod = 'monthly' | 'yearly'

type BillingToggleProps = {
  value: BillingPeriod
  onChange: (value: BillingPeriod) => void
}

export function BillingToggle({ value, onChange }: BillingToggleProps) {
  const { t } = useTranslation()
  const id = useId()
  const items: { value: BillingPeriod; label: string }[] = [
    { value: 'monthly', label: t('pricing.billing.monthly') },
    { value: 'yearly', label: t('pricing.billing.yearly') },
  ]

  return (
    <div
      role="radiogroup"
      aria-label={t('pricing.billing.label')}
      className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1"
    >
      {items.map((item) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(item.value)}
            className={`relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-200 ${
              active ? 'text-[#09090B]' : 'text-[#A1A1AA] hover:text-[#F4F4F5]'
            }`}
          >
            {active ? (
              <motion.span
                layoutId={`billing-pill-${id}`}
                className="absolute inset-0 rounded-full bg-[#F4F4F5]"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            ) : null}
            <span className="relative">{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
