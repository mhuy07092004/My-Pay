import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '../../../components/card/card'
import { PageHeader } from '../../../components/layout/page_header'
import { IncomeChart } from '../../../components/report/income_chart'
import { LoadError } from '../../../components/skeleton/load_error'
import { LoadingRegion } from '../../../components/skeleton/skeleton'
import { Tabs } from '../../../components/tabs/tabs'
import { usePayData } from '../../context/PayDataContext'
import { useTimesheet } from '../../context/TimesheetContext'
import { HTML_LANG, isAppLanguage } from '../../i18n/config'
import { toReportContext } from '../../lib/pay'
import {
  REPORT_RANGES,
  reportFromPeriods,
  type DateSpan,
  type IncomeSeries,
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

function formatHours(minutes: number): string {
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`
}

export function Report() {
  const { t, i18n } = useTranslation()
  const { periods, loading, error, retry } = useTimesheet()
  const { taxContext, holidays } = usePayData()
  const [range, setRange] = useState<ReportRange>('year')
  const locale = isAppLanguage(i18n.language) ? HTML_LANG[i18n.language] : 'en'
  const today = useMemo(() => toIsoDate(startOfDay(new Date())), [])

  const data = useMemo(() => {
    if (loading || error) return null
    return reportFromPeriods(periods, range, today, toReportContext(taxContext, holidays))
  }, [loading, error, periods, range, today, taxContext, holidays])

  const series = data?.series ?? EMPTY_SERIES
  const stats = data?.stats
  const dayFmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' })
  const span = (s: DateSpan) => `${dayFmt.format(s.start)} – ${dayFmt.format(s.end)}`
  const none = '—'
  const text = (value: string) => (loading ? null : value)
  const dollars = (amount: number) => text(formatMoney(amount))
  const varianceSign = !stats ? '' : stats.variance > 0 ? '+' : stats.variance < 0 ? '−' : ''

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

      {error ? <LoadError onRetry={retry} /> : null}

      {error ? null : <section className="rounded-xl border border-[#27272A] bg-[#18181B] p-4 sm:p-5">
        <h2 className="mb-3 text-sm font-semibold text-[#A1A1AA]">
          {t('report.chartTitle', { range: t(`report.range.${range}`) })}
        </h2>
        {loading ? (
          <LoadingRegion label={t('common.loading')}>
            <IncomeChart
              loading
              series={EMPTY_SERIES}
              locale={locale}
              labels={{
                estimated: t('report.series.estimated'),
                net: t('report.series.net'),
                empty: t('report.empty'),
              }}
            />
          </LoadingRegion>
        ) : (
          <IncomeChart
            series={series}
            locale={locale}
            labels={{
              estimated: t('report.series.estimated'),
              net: t('report.series.net'),
              empty: t('report.empty'),
            }}
          />
        )}
      </section>}

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <Card
          layout="responsive"
          label={t('report.stats.estimated')}
          prefix={stats ? '$' : undefined}
          value={stats ? dollars(stats.estimated) : text(none)}
          valueClassName={LIME}
          hint={stats ? t('report.stats.estimatedHint') : undefined}
        />
        <Card
          layout="responsive"
          label={t('report.stats.net')}
          prefix={stats ? '$' : undefined}
          value={stats ? dollars(stats.net) : text(none)}
          valueClassName={LIME}
          hint={stats ? t('report.stats.netHint') : undefined}
        />
        <Card
          layout="responsive"
          label={t('report.stats.variance')}
          value={
            stats
              ? text(`${varianceSign}$ ${formatMoney(Math.abs(stats.variance))}`)
              : text(none)
          }
          valueClassName={!stats || stats.variance === 0 ? NEUTRAL : stats.variance < 0 ? SOFT_RED : LIME}
          hint={
            stats
              ? t('report.stats.varianceHint', {
                  done: stats.periodsWithActual,
                  total: stats.periodsTotal,
                })
              : undefined
          }
        />
        <Card
          layout="responsive"
          label={t('report.stats.tax')}
          prefix={stats ? '$' : undefined}
          value={stats ? dollars(stats.tax) : text(none)}
          valueClassName={NEUTRAL}
          hint={stats ? t('report.stats.taxHint', { rate: stats.taxRatePct }) : undefined}
        />
        <Card
          layout="responsive"
          label={t('report.stats.hours')}
          value={stats ? text(formatHours(stats.minutes)) : text(none)}
          valueClassName={NEUTRAL}
        />
        <Card
          layout="responsive"
          label={t('report.stats.bestWeek')}
          value={stats ? text(stats.bestWeek ? formatHours(stats.bestWeek.minutes) : none) : text(none)}
          valueClassName={NEUTRAL}
          hint={stats?.bestWeek ? span(stats.bestWeek) : undefined}
        />
        <Card
          layout="responsive"
          label={t('report.stats.highestFortnight')}
          prefix={stats?.highestFortnight ? '$' : undefined}
          value={
            stats
              ? text(stats.highestFortnight ? formatMoney(stats.highestFortnight.income) : none)
              : text(none)
          }
          valueClassName={LIME}
          hint={stats?.highestFortnight ? span(stats.highestFortnight) : undefined}
        />
        <Card
          layout="responsive"
          label={t('report.stats.lowestFortnight')}
          prefix={stats?.lowestFortnight ? '$' : undefined}
          value={
            stats
              ? text(stats.lowestFortnight ? formatMoney(stats.lowestFortnight.income) : none)
              : text(none)
          }
          valueClassName={NEUTRAL}
          hint={stats?.lowestFortnight ? span(stats.lowestFortnight) : undefined}
        />
      </div>
    </>
  )
}

export default Report
