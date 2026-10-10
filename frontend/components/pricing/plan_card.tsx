import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Button } from '../button/button'
import type { BillingPeriod } from './billing_toggle'

export type PlanPrice = { monthly: number; yearly: number }

export type PlanCardProps = {
  name: string
  description: string
  features: string[]
  featuresTitle: string
  cta: string
  /** Undefined = free plan. */
  price?: PlanPrice
  freeLabel?: string
  period: BillingPeriod
  featured?: boolean
  comingSoon?: boolean
  ctaTo?: string
  delay?: number
}

const usd = (amount: number) => `$${amount}`

function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`mt-0.5 shrink-0 ${className}`}
    >
      <path
        d="M5 12.5l4.5 4.5L19 7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function PlanCard({
  name,
  description,
  features,
  featuresTitle,
  cta,
  price,
  freeLabel,
  period,
  featured = false,
  comingSoon = false,
  ctaTo,
  delay = 0,
}: PlanCardProps) {
  const { t } = useTranslation()

  const useFeatured = featured && !comingSoon
  const surface = useFeatured
    ? 'border-[#F4F4F5] bg-[#F4F4F5] text-[#09090B]'
    : 'border-white/[0.08] bg-white/[0.02] text-[#F4F4F5] transition-colors duration-300 hover:border-white/20'
  const muted = useFeatured ? 'text-[#09090B]/70' : 'text-[#A1A1AA]'
  const divider = useFeatured ? 'border-[#09090B]/15' : 'border-[#3F3F46]'

  const amount = price ? (period === 'yearly' ? price.yearly / 12 : price.monthly) : 0
  const note = !price
    ? ''
    : period === 'yearly'
      ? t('pricing.billedYearly', { amount: usd(price.yearly) })
      : t('pricing.billedMonthly')

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: comingSoon ? 0.55 : 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
      className={`row-span-7 grid grid-rows-subgrid gap-y-0 rounded-2xl border py-7 *:px-7 ${surface} ${
        comingSoon ? 'saturate-50' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{name}</h2>
        {comingSoon ? (
          <span
            className="rounded-full bg-[#F4F4F5]/10 px-2.5 py-1 text-xs font-medium text-[#A1A1AA]"
          >
            {t('pricing.comingSoon')}
          </span>
        ) : null}
      </div>

      <p className={`mt-2 text-sm/6 ${muted}`}>{description}</p>

      <div className="mt-6 flex items-baseline gap-1">
        {price ? (
          <>
            <motion.span
              key={period}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="text-3xl font-semibold tabular-nums"
            >
              {usd(Number.isInteger(amount) ? amount : Number(amount.toFixed(2)))}
            </motion.span>
            <span className={`text-sm ${muted}`}>{t('pricing.perMonth')}</span>
          </>
        ) : (
          <span className="text-3xl font-bold">{freeLabel}</span>
        )}
      </div>

      <p className={`mt-1 mb-6 min-h-5 text-sm ${muted}`}>{note}</p>

      <p className={`border-t pt-6 text-sm ${divider} ${muted}`}>{featuresTitle}</p>

      <ul className="mt-4 flex flex-col gap-3">
        {features.map((feature) => (
          <li key={feature} className="flex gap-3 text-sm">
            <CheckIcon />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex items-end">
        {comingSoon ? (
          <button
            type="button"
            disabled
            className="h-12 w-full cursor-not-allowed rounded-xl bg-[#27272A] text-sm font-medium text-[#52525B]"
          >
            {cta}
          </button>
        ) : (
          <Button
            variant={featured ? 'green' : 'white'}
            to={ctaTo}
            className="h-12 w-full rounded-xl text-sm"
          >
            {cta}
          </Button>
        )}
      </div>
    </motion.article>
  )
}
