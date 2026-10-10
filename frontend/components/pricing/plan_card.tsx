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
}: PlanCardProps) {
  const { t } = useTranslation()

  const useFeatured = featured && !comingSoon
  const surface = useFeatured
    ? 'border-[#F4F4F5] bg-[#F4F4F5] text-[#09090B]'
    : 'border-[#27272A] bg-[#121212] text-[#F4F4F5]'
  const muted = useFeatured ? 'text-[#09090B]/70' : 'text-[#A1A1AA]'
  const divider = useFeatured ? 'border-[#09090B]/15' : 'border-[#3F3F46]'

  const amount = price ? (period === 'yearly' ? price.yearly / 12 : price.monthly) : 0
  const note = !price
    ? ''
    : period === 'yearly'
      ? t('pricing.billedYearly', { amount: usd(price.yearly) })
      : t('pricing.billedMonthly')

  return (
    <article
      className={`row-span-7 grid grid-rows-subgrid gap-y-0 rounded-2xl border py-7 *:px-7 ${surface} ${
        comingSoon ? 'opacity-55 saturate-50' : ''
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
            <span className="text-3xl font-bold tabular-nums">
              {usd(Number.isInteger(amount) ? amount : Number(amount.toFixed(2)))}
            </span>
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
    </article>
  )
}
