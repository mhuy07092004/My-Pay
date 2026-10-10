import { useTranslation } from 'react-i18next'
import { Button } from '../button/button'
import { Reveal } from '../motion/reveal'

export function Hero() {
  const { t } = useTranslation()

  return (
    <section className="relative isolate overflow-hidden">
      <div className="landing-glow pointer-events-none absolute inset-0 -z-10" aria-hidden />
      <div className="landing-grid pointer-events-none absolute inset-0 -z-10" aria-hidden />

      <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 pt-24 pb-16 text-center sm:px-6 sm:pt-32 lg:pt-36">
        <Reveal immediate>
          <h1 className="max-w-4xl text-balance bg-gradient-to-b from-white to-[#A1A1AA] bg-clip-text text-4xl font-semibold tracking-tight text-transparent sm:text-5xl lg:text-7xl lg:leading-[1.05]">
            {t('landing.hero.title')}
          </h1>
        </Reveal>
        <Reveal immediate delay={0.1}>
          <p className="mt-6 max-w-2xl text-pretty text-base text-[#A1A1AA] sm:text-lg">
            {t('landing.hero.subtitle')}
          </p>
        </Reveal>
        <Reveal immediate delay={0.2}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button variant="green" size="lg" to="/login?mode=signup">
              {t('landing.hero.cta')}
            </Button>
            <Button variant="ghost" size="lg" to="/features">
              {t('nav.features')}
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
