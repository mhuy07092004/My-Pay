import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '../../../components/card/card'
import { PageHeader } from '../../../components/layout/page_header'
import { IncomeChart } from '../../../components/report/income_chart'
import { Tabs } from '../../../components/tabs/tabs'
import { useTimesheet } from '../../context/TimesheetContext'
import { HTML_LANG, isAppLanguage } from '../../i18n/config'
import { getReport } from '../../lib/api'
import {
  fromReportResponse,
  REPORT_RANGES,
  type DateSpan,
  type IncomeSeries,
  type LiveReportStats,
  type ReportRange,
} from '../../lib/report'
import { formatMoney, startOfDay, toIsoDate } from '../../lib/timesheet'

const LIME = 'text-[#C8E664]'
const NEUTRAL = 'text-[#F4F4F5]'
const SOFT_RED = 'text-[#F0A8A8]'

const EMPTY_SERIES: IncomeSeries = {
  granularity: 'month',
  points: [],
  hasData: false,
  windowStart: new Date(),
  windowEnd: new Date(),
}

const EMPTY_STATS: LiveReportStats = {
  estimated: 0,
  net: 0,
  variance: 0,
  periodsWithActual: 0,
  periodsTotal: 0,
  tax: 0,
  taxRatePct: 0,
  minutes: 0,
  bestWeek: null,
  highestFortnight: null,
  lowestFortnight: null,
}

function formatHours(minutes: number): string {
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`
}

export function Report() {
  const { t, i18n } = useTranslation()
  const { periods } = useTimesheet()
  const [range, setRange] = useState<ReportRange>('year')
  const locale = isAppLanguage(i18n.language) ? HTML_LANG[i18n.language] : 'en'
  const today = useMemo(() => toIsoDate(startOfDay(new Date())), [])
  const [data, setData] = useState<{ series: IncomeSeries; stats: LiveReportStats } | null>(null)

  // Reload when the range changes or any period is saved.
  useEffect(() => {
    let cancelled = false
    getReport(range, today)
      .then((res) => {
        if (!cancelled) setData(fromReportResponse(res))
      })
      .catch((err) => console.error('Failed to load report', err))
    return () => {
      cancelled = true
    }
  }, [range, today, periods])

  const series = data?.series ?? EMPTY_SERIES
  const stats = data?.stats ?? EMPTY_STATS

  const dayFmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' })
  const span = (s: DateSpan) => `${dayFmt.format(s.start)} – ${dayFmt.format(s.end)}`
  const none = '—'

  const varianceSign = stats.variance > 0 ? '+' : stats.variance < 0 ? '−' : ''

  return (
    <>
      <PageHeader
        title={t('report.title')}
        actions={
          <Tabs
            stretch
            ariaLabel={t('report.title')}
            value={range}
            onChange={setRange}
            items={REPORT_RANGES.map((value) => ({ value, label: t(`report.range.${value}`) }))}
          />
        }
      />

      <section className="rounded-xl border border-[#27272A] bg-[#18181B] p-4 sm:p-5">
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

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <Card
          layout="responsive"
          label={t('report.stats.estimated')}
          prefix="$"
          value={formatMoney(stats.estimated)}
          valueClassName={LIME}
          hint={t('report.stats.estimatedHint')}
        />
        <Card
          layout="responsive"
          label={t('report.stats.net')}
          prefix="$"
          value={formatMoney(stats.net)}
          valueClassName={LIME}
          hint={t('report.stats.netHint')}
        />
        <Card
          layout="responsive"
          label={t('report.stats.variance')}
          value={`${varianceSign}$ ${formatMoney(Math.abs(stats.variance))}`}
          valueClassName={stats.variance < 0 ? SOFT_RED : stats.variance > 0 ? LIME : NEUTRAL}
          hint={t('report.stats.varianceHint', {
            done: stats.periodsWithActual,
            total: stats.periodsTotal,
          })}
        />
        <Card
          layout="responsive"
          label={t('report.stats.tax')}
          prefix="$"
          value={formatMoney(stats.tax)}
          valueClassName={NEUTRAL}
          hint={t('report.stats.taxHint', { rate: stats.taxRatePct })}
        />
        <Card
          layout="responsive"
          label={t('report.stats.hours')}
          value={formatHours(stats.minutes)}
          valueClassName={NEUTRAL}
        />
        <Card
          layout="responsive"
          label={t('report.stats.bestWeek')}
          value={stats.bestWeek ? formatHours(stats.bestWeek.minutes) : none}
          valueClassName={NEUTRAL}
          hint={stats.bestWeek ? span(stats.bestWeek) : undefined}
        />
        <Card
          layout="responsive"
          label={t('report.stats.highestFortnight')}
          prefix={stats.highestFortnight ? '$' : undefined}
          value={stats.highestFortnight ? formatMoney(stats.highestFortnight.income) : none}
          valueClassName={LIME}
          hint={stats.highestFortnight ? span(stats.highestFortnight) : undefined}
        />
        <Card
          layout="responsive"
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
