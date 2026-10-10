import { useTranslation } from 'react-i18next'
import { Button } from '../button/button'
import { Reveal } from '../motion/reveal'

export function ClosingCta() {
  const { t } = useTranslation()

  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">
      <Reveal>
        <div className="relative isolate overflow-hidden rounded-2xl border border-white/[0.08] px-6 py-16 text-center sm:px-10">
          <div className="landing-glow absolute inset-0 -z-10 opacity-70" aria-hidden />
          <h2 className="mx-auto max-w-xl text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            {t('about.cta.title')}
          </h2>
          <p className="mx-auto mt-3 max-w-[48ch] text-sm/6 text-[#A1A1AA] sm:text-base/7">
            {t('about.cta.body')}
          </p>
          <div className="mt-8">
            <Button variant="green" size="lg" to="/login?mode=signup">
              {t('landing.hero.cta')}
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
