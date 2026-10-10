import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { HTML_LANG, isAppLanguage } from '../../src/i18n/config'
import { buildFeatureSample } from '../../src/lib/featureSample'
import { eachDayInRange, periodRange, periodTotals, startOfDay } from '../../src/lib/timesheet'
import { ShiftCalendar } from '../feature/shift_calendar'
import { TaxSplitBar } from '../feature/tax_split_bar'
import { Reveal } from '../motion/reveal'
import { FortnightEstimate } from '../shift/fortnight_estimate'

export function ProductPreview() {
  const { t, i18n } = useTranslation()
  const today = useMemo(() => startOfDay(new Date()), [])
  const sample = useMemo(() => buildFeatureSample(today), [today])
  const locale = isAppLanguage(i18n.language) ? HTML_LANG[i18n.language] : 'en'
  const rateOf = () => sample.hourlyRate
  const totals = periodTotals(sample.featured, rateOf, sample.taxRate)
  const days = eachDayInRange(periodRange(sample.featured))

  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">
      <Reveal y={28}>
        <div className="relative rounded-2xl border border-white/10 bg-white/[0.02] p-2 shadow-[0_0_80px_-20px_rgb(200_230_100/0.15)]">
          <div className="flex items-center gap-1.5 px-3 py-2" aria-hidden>
            <span className="size-2.5 rounded-full bg-white/10" />
            <span className="size-2.5 rounded-full bg-white/10" />
            <span className="size-2.5 rounded-full bg-white/10" />
          </div>
          <div className="grid gap-4 rounded-xl border border-white/[0.06] bg-[#09090B] p-4 sm:p-6 lg:grid-cols-2 lg:gap-8">
            <div className="min-w-0">
              <ShiftCalendar
                days={days}
                shifts={sample.featured.shifts}
                rateOf={rateOf}
                locale={locale}
                noShiftLabel={t('timesheet.noShift')}
                breakLabel={(count) => t('timesheet.break.minutes', { count })}
              />
            </div>
            <div className="min-w-0 space-y-4">
              <FortnightEstimate
                beforeTax={totals.income}
                tax={totals.tax}
                afterTax={totals.afterTax}
                showLive={false}
                showNote={false}
              />
              <TaxSplitBar
                afterTax={totals.afterTax}
                tax={totals.tax}
                afterTaxLabel={t('timesheet.estimate.afterTax')}
                taxLabel={t('timesheet.estimate.tax')}
              />
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
