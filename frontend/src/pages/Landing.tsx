import { Button } from '../../components/button/button'
import { LandingFooter } from '../../components/footer/landing_footer'
import { LandingNavbar } from '../../components/navbar/landing_navbar'
import { useTranslation } from 'react-i18next'

export function Landing() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-svh flex-col bg-[#18181B] text-[#F4F4F5]">
      <LandingNavbar />
      <main className="flex flex-1 flex-col">
        <section className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-6xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6 sm:py-20 lg:py-24">
          <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-[#F4F4F5] sm:text-5xl lg:text-7xl">
            {t('landing.hero.title')}
          </h1>
          <p className="mt-6 max-w-2xl text-base text-[#A1A1AA] sm:text-lg">
            {t('landing.hero.subtitle')}
          </p>
          <div className="mt-10">
            <Button variant="green" size="lg" to="/login?mode=signup">
              {t('landing.hero.cta')}
            </Button>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  )
}
