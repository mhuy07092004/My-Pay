import { useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/button/button'
import { ActualCompare } from '../../components/feature/actual_compare'
import { FeatureBlock } from '../../components/feature/feature_block'
import { StepsTimeline } from '../../components/feature/steps_timeline'
import { ClosingCta } from '../../components/landing/closing_cta'
import { PageFade } from '../../components/motion/page_fade'
import { Reveal, RevealItem, RevealList } from '../../components/motion/reveal'
import { LandingFooter } from '../../components/footer/landing_footer'
import { LandingNavbar } from '../../components/navbar/landing_navbar'
import { buildFeatureSample } from '../lib/featureSample'
import { periodTotals, startOfDay } from '../lib/timesheet'

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  )
}

const ICONS = {
  simple: (
    <Icon>
      <path d="M5 12h14M5 6h14M5 18h8" />
    </Icon>
  ),
  private: (
    <Icon>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </Icon>
  ),
  accurate: (
    <Icon>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </Icon>
  ),
  bilingual: (
    <Icon>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
    </Icon>
  ),
}

export function About() {
  const { t } = useTranslation()
  const today = useMemo(() => startOfDay(new Date()), [])
  const sample = useMemo(() => buildFeatureSample(today), [today])
  const totals = periodTotals(sample.featured, () => sample.hourlyRate, sample.taxRate)

  const steps = [1, 2, 3].map((n) => ({
    title: t(`about.solution.steps.${n}.title` as 'about.solution.steps.1.title'),
    body: t(`about.solution.steps.${n}.body` as 'about.solution.steps.1.body'),
  }))
  const principles = [
    { key: 'simple', icon: ICONS.simple },
    { key: 'private', icon: ICONS.private },
    { key: 'accurate', icon: ICONS.accurate },
    { key: 'bilingual', icon: ICONS.bilingual },
  ] as const

  return (
    <div className="flex min-h-svh flex-col bg-[#09090B] text-[#F4F4F5]">
      <LandingNavbar />
      <PageFade className="flex-1">
      <main>
        <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <header className="max-w-3xl">
            <Reveal immediate>
              <h1 className="text-balance bg-gradient-to-b from-white to-[#A1A1AA] bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl lg:text-6xl">
                {t('about.title')}
              </h1>
            </Reveal>
            <Reveal immediate delay={0.08}>
              <p className="mt-5 max-w-[60ch] text-balance text-base/7 text-[#A1A1AA] sm:text-lg/8">
                {t('about.subtitle')}
              </p>
            </Reveal>
            <Reveal immediate delay={0.16}>
              <div className="mt-8">
                <Button variant="green" size="lg" to="/login?mode=signup">
                  {t('landing.hero.cta')}
                </Button>
              </div>
            </Reveal>
          </header>

          <FeatureBlock
            eyebrow={t('about.problem.eyebrow')}
            title={t('about.problem.title')}
            description={t('about.problem.body')}
          >
            <ActualCompare
              estimated={totals.income}
              actual={sample.featured.actual}
              estimatedLabel={t('features.actual.estimated')}
              actualLabel={t('features.actual.received')}
              differenceLabel={t('features.difference')}
              hint={t('features.differenceHint')}
              notRecorded={t('features.notRecorded')}
            />
          </FeatureBlock>

          <FeatureBlock
            reverse
            eyebrow={t('about.solution.eyebrow')}
            title={t('about.solution.title')}
            description={t('about.solution.body')}
          >
            <StepsTimeline steps={steps} />
          </FeatureBlock>

          <section className="mt-28">
            <Reveal>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {t('about.principles.title')}
              </h2>
            </Reveal>
            <RevealList className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {principles.map((item) => (
                <RevealItem
                  key={item.key}
                  className="flex flex-col gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 transition-colors duration-300 hover:border-white/20"
                >
                  <span className="text-[#C8E664]">{item.icon}</span>
                  <p className="text-sm font-medium">{t(`about.principles.${item.key}.title`)}</p>
                  <p className="text-sm text-[#A1A1AA]">{t(`about.principles.${item.key}.body`)}</p>
                </RevealItem>
              ))}
            </RevealList>
          </section>
        </div>
        <div className="pt-4">
          <ClosingCta />
        </div>
      </main>
      </PageFade>
      <LandingFooter />
    </div>
  )
}
