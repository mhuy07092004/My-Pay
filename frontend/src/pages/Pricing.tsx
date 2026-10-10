import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LandingFooter } from '../../components/footer/landing_footer'
import { LandingNavbar } from '../../components/navbar/landing_navbar'
import { BillingToggle, type BillingPeriod } from '../../components/pricing/billing_toggle'
import { PlanCard, type PlanPrice } from '../../components/pricing/plan_card'

type PlanId = 'free' | 'premium'

type PlanConfig = {
  id: PlanId
  price?: PlanPrice
  featured?: boolean
  comingSoon?: boolean
  ctaTo?: string
  includesFrom?: PlanId
}

// Placeholder prices (USD) until pricing is confirmed.
const plans: PlanConfig[] = [
  { id: 'free', ctaTo: '/login?mode=signup' },
  {
    id: 'premium',
    price: { monthly: 9, yearly: 90 },
    comingSoon: true,
    includesFrom: 'free',
  },
]

export function Pricing() {
  const { t } = useTranslation()
  const [period, setPeriod] = useState<BillingPeriod>('monthly')

  return (
    <div className="flex min-h-svh flex-col bg-[#18181B] text-[#F4F4F5]">
      <LandingNavbar />
      <main className="flex-1">
        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <header className="text-center">
            <h1 className="text-balance text-2xl font-bold sm:text-3xl">{t('pricing.title')}</h1>
            <p className="mx-auto mt-3 max-w-[55ch] text-balance text-sm/6 text-[#A1A1AA] sm:text-base/7">
              {t('pricing.subtitle')}
            </p>
            <div className="mt-8 flex justify-center">
              <BillingToggle value={period} onChange={setPeriod} />
            </div>
          </header>

          <div className="mx-auto mt-8 grid max-w-lg grid-cols-1 gap-4 sm:mt-12 lg:max-w-4xl lg:grid-cols-2">
            {plans.map((plan) => {
              const base = `pricing.plans.${plan.id}` as const
              return (
                <PlanCard
                  key={plan.id}
                  name={t(`${base}.name`)}
                  description={t(`${base}.description`)}
                  features={t(`${base}.features`, { returnObjects: true }) as string[]}
                  featuresTitle={
                    plan.includesFrom
                      ? t('pricing.everythingIn', {
                          plan: t(`pricing.plans.${plan.includesFrom}.name`),
                        })
                      : t('pricing.includes')
                  }
                  cta={t(`${base}.cta`)}
                  price={plan.price}
                  freeLabel={t('pricing.plans.free.price')}
                  period={period}
                  featured={plan.featured}
                  comingSoon={plan.comingSoon}
                  ctaTo={plan.ctaTo}
                />
              )
            })}
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  )
}
