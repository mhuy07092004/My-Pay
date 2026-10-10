import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '../../../components/card/card'
import { IncomeChart } from '../../../components/report/income_chart'
import { Tabs } from '../../../components/tabs/tabs'
import { MOCK_RATES, TAX_RATE } from '../../../mock/timesheet'
import { useTimesheet } from '../../context/TimesheetContext'
import { HTML_LANG, isAppLanguage } from '../../i18n/config'
import {
  buildIncomeSeries,
  buildReportStats,
  REPORT_RANGES,
  type DateSpan,
  type ReportRange,
} from '../../lib/report'
import { formatMoney } from '../../lib/timesheet'

const LIME = 'text-[#C8E664]'
const NEUTRAL = 'text-[#F4F4F5]'
const SOFT_RED = 'text-[#F0A8A8]'

function formatHours(minutes: number): string {
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`
}

export function Report() {
  const { t, i18n } = useTranslation()
  const { periods } = useTimesheet()
  const [range, setRange] = useState<ReportRange>('year')
  const locale = isAppLanguage(i18n.language) ? HTML_LANG[i18n.language] : 'en'
  const today = useMemo(() => new Date(), [])

  const rateOf = (id: string) =>
    (MOCK_RATES.find((r) => r.id === id) ?? MOCK_RATES[0]).hourlyRate

  const series = buildIncomeSeries(periods, range, today, rateOf)
  const stats = buildReportStats(periods, today, rateOf, TAX_RATE)

  const dayFmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' })
  const span = (s: DateSpan) => `${dayFmt.format(s.start)} – ${dayFmt.format(s.end)}`
  const none = '—'

  const varianceSign = stats.variance > 0 ? '+' : stats.variance < 0 ? '−' : ''

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">{t('report.title')}</h1>
        <Tabs
          ariaLabel={t('report.title')}
          value={range}
          onChange={setRange}
          items={REPORT_RANGES.map((value) => ({ value, label: t(`report.range.${value}`) }))}
        />
      </div>

      <section className="mt-6 rounded-xl border border-[#27272A] bg-[#18181B] p-5">
        <h2 className="mb-3 text-sm font-semibold text-[#A1A1AA]">
          {t('report.chartTitle', { range: t(`report.range.${range}`) })}
        </h2>
        <IncomeChart
          series={series}
          locale={locale}
          labels={{
            estimated: t('report.series.estimated'),
            net: t('report.series.net'),
            empty: t('report.empty'),
          }}
        />
      </section>

      <div className="mt-4 grid grid-cols-1 gap-4 pb-8 sm:grid-cols-2 xl:grid-cols-4">
        <Card
          label={t('report.stats.estimated')}
          prefix="$"
          value={formatMoney(stats.estimated)}
          valueClassName={LIME}
          hint={t('report.stats.estimatedHint')}
        />
        <Card
          label={t('report.stats.net')}
          prefix="$"
          value={formatMoney(stats.net)}
          valueClassName={LIME}
          hint={t('report.stats.netHint')}
        />
        <Card
          label={t('report.stats.variance')}
          value={`${varianceSign}$ ${formatMoney(Math.abs(stats.variance))}`}
          valueClassName={stats.variance < 0 ? SOFT_RED : stats.variance > 0 ? LIME : NEUTRAL}
          hint={t('report.stats.varianceHint', {
            done: stats.periodsWithActual,
            total: stats.periodsTotal,
          })}
        />
        <Card
          label={t('report.stats.tax')}
          prefix="$"
          value={formatMoney(stats.tax)}
          valueClassName={NEUTRAL}
          hint={t('report.stats.taxHint', { rate: TAX_RATE * 100 })}
        />
        <Card
          label={t('report.stats.hours')}
          value={formatHours(stats.minutes)}
          valueClassName={NEUTRAL}
        />
        <Card
          label={t('report.stats.bestWeek')}
          value={stats.bestWeek ? formatHours(stats.bestWeek.minutes) : none}
          valueClassName={NEUTRAL}
          hint={stats.bestWeek ? span(stats.bestWeek) : undefined}
        />
        <Card
          label={t('report.stats.highestFortnight')}
          prefix={stats.highestFortnight ? '$' : undefined}
          value={stats.highestFortnight ? formatMoney(stats.highestFortnight.income) : none}
          valueClassName={LIME}
          hint={stats.highestFortnight ? span(stats.highestFortnight) : undefined}
        />
        <Card
          label={t('report.stats.lowestFortnight')}
          prefix={stats.lowestFortnight ? '$' : undefined}
          value={stats.lowestFortnight ? formatMoney(stats.lowestFortnight.income) : none}
          valueClassName={NEUTRAL}
          hint={stats.lowestFortnight ? span(stats.lowestFortnight) : undefined}
        />
      </div>
    </>
  )
}

export default Report
