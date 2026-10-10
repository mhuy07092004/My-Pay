import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LandingFooter } from '../../components/footer/landing_footer'
import { PageFade } from '../../components/motion/page_fade'
import { Reveal } from '../../components/motion/reveal'
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
    <div className="flex min-h-svh flex-col bg-[#09090B] text-[#F4F4F5]">
      <LandingNavbar />
      <PageFade className="flex-1">
        <main className="relative isolate overflow-hidden">
          <div className="landing-glow pointer-events-none absolute inset-0 -z-10" aria-hidden />
          <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <header className="text-center">
              <Reveal immediate>
                <h1 className="text-balance bg-gradient-to-b from-white to-[#A1A1AA] bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl">
                  {t('pricing.title')}
                </h1>
              </Reveal>
              <Reveal immediate delay={0.08}>
                <p className="mx-auto mt-4 max-w-[55ch] text-balance text-sm/6 text-[#A1A1AA] sm:text-base/7">
                  {t('pricing.subtitle')}
                </p>
              </Reveal>
              <Reveal immediate delay={0.16}>
                <div className="mt-8 flex justify-center">
                  <BillingToggle value={period} onChange={setPeriod} />
                </div>
              </Reveal>
            </header>

            <div className="mx-auto mt-10 grid max-w-lg grid-cols-1 gap-4 sm:mt-14 lg:max-w-4xl lg:grid-cols-2">
              {plans.map((plan, index) => {
                const base = `pricing.plans.${plan.id}` as const
                return (
                  <PlanCard
                    key={plan.id}
                    delay={0.2 + index * 0.1}
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
      </PageFade>
      <LandingFooter />
    </div>
  )
}
