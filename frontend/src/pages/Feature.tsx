import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '../../components/card/card'
import { ActualCompare } from '../../components/feature/actual_compare'
import { FeatureBlock } from '../../components/feature/feature_block'
import { ShiftCalendar } from '../../components/feature/shift_calendar'
import { TaxSplitBar } from '../../components/feature/tax_split_bar'
import { LandingFooter } from '../../components/footer/landing_footer'
import { LandingNavbar } from '../../components/navbar/landing_navbar'
import { IncomeChart } from '../../components/report/income_chart'
import { FortnightEstimate } from '../../components/shift/fortnight_estimate'
import { Tabs } from '../../components/tabs/tabs'
import { HTML_LANG, isAppLanguage } from '../i18n/config'
import { buildFeatureSample } from '../lib/featureSample'
import {
  buildIncomeSeries,
  buildReportStats,
  REPORT_RANGES,
  type DateSpan,
  type ReportRange,
} from '../lib/report'
import {
  eachDayInRange,
  formatMoney,
  periodRange,
  periodTotals,
  startOfDay,
} from '../lib/timesheet'

const LIME = 'text-[#C8E664]'
const NEUTRAL = 'text-[#F4F4F5]'
const SOFT_RED = 'text-[#F0A8A8]'

function formatHours(minutes: number): string {
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`
}

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
  calendar: (
    <Icon>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </Icon>
  ),
  tax: (
    <Icon>
      <path d="M19 5 5 19" />
      <circle cx="7" cy="7" r="2.5" />
      <circle cx="17" cy="17" r="2.5" />
    </Icon>
  ),
  report: (
    <Icon>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </Icon>
  ),
  rates: (
    <Icon>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.4 0-2.5.8-2.5 2s1.1 1.7 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1 0-2-.5-2.5-1.5" />
    </Icon>
  ),
  languages: (
    <Icon>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
    </Icon>
  ),
  split: (
    <Icon>
      <path d="M12 3a9 9 0 1 0 9 9" />
      <path d="M12 7v5l3 2" />
    </Icon>
  ),
}

export function Feature() {
  const { t, i18n } = useTranslation()
  const today = useMemo(() => startOfDay(new Date()), [])
  const sample = useMemo(() => buildFeatureSample(today), [today])
  const [range, setRange] = useState<ReportRange>('year')
  const locale = isAppLanguage(i18n.language) ? HTML_LANG[i18n.language] : 'en'

  const rateOf = () => sample.hourlyRate
  const totals = periodTotals(sample.featured, rateOf, sample.taxRate)
  const series = buildIncomeSeries(sample.periods, range, today, rateOf)
  const stats = buildReportStats(sample.periods, today, rateOf, sample.taxRate)
  const days = eachDayInRange(periodRange(sample.featured))
  const dayFmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' })
  const span = (value: DateSpan) => `${dayFmt.format(value.start)} – ${dayFmt.format(value.end)}`
  const none = '—'
  const varianceSign = stats.variance > 0 ? '+' : stats.variance < 0 ? '−' : ''

  const chips = [
    { key: 'calendar', label: t('features.chips.calendar'), icon: ICONS.calendar },
    { key: 'tax', label: t('features.chips.tax'), icon: ICONS.tax },
    { key: 'report', label: t('features.chips.report'), icon: ICONS.report },
  ]
  const extras = [
    { key: 'rates', label: t('features.extras.rates'), icon: ICONS.rates },
    { key: 'languages', label: t('features.extras.languages'), icon: ICONS.languages },
    { key: 'tax', label: t('features.extras.tax'), icon: ICONS.tax },
    { key: 'split', label: t('features.extras.split'), icon: ICONS.split },
  ]

  return (
    <div className="flex min-h-svh flex-col bg-[#18181B] text-[#F4F4F5]">
      <LandingNavbar />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <header>
            <h1 className="text-balance text-2xl font-bold sm:text-3xl">{t('features.title')}</h1>
            <p className="mt-3 max-w-[62ch] text-balance text-sm/6 text-[#A1A1AA] sm:text-base/7">
              {t('features.subtitle')}
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {chips.map((chip) => (
                <li
                  key={chip.key}
                  className="flex items-center gap-2 rounded-full border border-[#27272A] px-3 py-1.5 text-sm text-[#A1A1AA]"
                >
                  <span className="text-[#C8E664]">{chip.icon}</span>
                  {chip.label}
                </li>
              ))}
            </ul>
          </header>

          <FeatureBlock
            eyebrow={t('features.calendar.eyebrow')}
            title={t('features.calendar.title')}
            description={t('features.calendar.body')}
          >
            <ShiftCalendar
              days={days}
              shifts={sample.featured.shifts}
              rateOf={rateOf}
              locale={locale}
              noShiftLabel={t('timesheet.noShift')}
              breakLabel={(count) => t('timesheet.break.minutes', { count })}
            />
          </FeatureBlock>

          <FeatureBlock
            reverse
            eyebrow={t('features.estimate.eyebrow')}
            title={t('features.estimate.title')}
            description={t('features.estimate.body')}
          >
            <div className="space-y-4">
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
          </FeatureBlock>

          <FeatureBlock
            eyebrow={t('features.actual.eyebrow')}
            title={t('features.actual.title')}
            description={t('features.actual.body')}
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

          <section className="feature-reveal mt-20">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#C8E664]">
                  {t('features.report.eyebrow')}
                </p>
                <h2 className="mt-3 text-balance text-xl font-bold sm:text-2xl">
                  {t('features.report.title')}
                </h2>
                <p className="mt-3 max-w-[48ch] text-sm/6 text-[#A1A1AA] sm:text-base/7">
                  {t('features.report.body')}
                </p>
              </div>
              <Tabs
                ariaLabel={t('report.title')}
                value={range}
                onChange={setRange}
                className="scrollbar-clean"
                items={REPORT_RANGES.map((value) => ({
                  value,
                  label: t(`report.range.${value}`),
                }))}
              />
            </div>

            <div className="mt-6 rounded-xl border border-[#27272A] bg-[#18181B] p-5">
              <h3 className="mb-3 text-sm font-semibold text-[#A1A1AA]">
                {t('report.chartTitle', { range: t(`report.range.${range}`) })}
              </h3>
              <IncomeChart
                series={series}
                locale={locale}
                labels={{
                  estimated: t('report.series.estimated'),
                  net: t('report.series.net'),
                  empty: t('report.empty'),
                }}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Card
                label={t('report.stats.net')}
                prefix="$"
                value={formatMoney(stats.net)}
                valueClassName={LIME}
                hint={t('report.stats.netHint')}
                className="h-full"
              />
              <Card
                label={t('report.stats.variance')}
                value={`${varianceSign}$ ${formatMoney(Math.abs(stats.variance))}`}
                valueClassName={stats.variance < 0 ? SOFT_RED : stats.variance > 0 ? LIME : NEUTRAL}
                hint={t('report.stats.varianceHint', {
                  done: stats.periodsWithActual,
                  total: stats.periodsTotal,
                })}
                className="h-full"
              />
              <Card
                label={t('report.stats.hours')}
                value={formatHours(stats.minutes)}
                valueClassName={NEUTRAL}
                className="h-full"
              />
              <Card
                label={t('report.stats.highestFortnight')}
                prefix={stats.highestFortnight ? '$' : undefined}
                value={
                  stats.highestFortnight ? formatMoney(stats.highestFortnight.income) : none
                }
                valueClassName={LIME}
                hint={stats.highestFortnight ? span(stats.highestFortnight) : undefined}
                className="h-full"
              />
            </div>
          </section>

          <section className="feature-reveal mt-20">
            <h2 className="text-lg font-semibold tracking-tight">{t('features.extras.title')}</h2>
            <ul className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {extras.map((item) => (
                <li
                  key={item.key}
                  className="flex flex-col gap-3 rounded-xl border border-[#27272A] bg-[#18181B] p-5"
                >
                  <span className="text-[#C8E664]">{item.icon}</span>
                  <span className="text-sm font-medium">{item.label}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
      <LandingFooter />
    </div>
  )
}
