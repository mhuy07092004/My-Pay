import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PaydayRow } from '../../../components/calendar/payday_row'
import { PayslipSheet } from '../../../components/calendar/payslip_sheet'
import { PageHeader } from '../../../components/layout/page_header'
import { LoadError } from '../../../components/skeleton/load_error'
import { LoadingRegion, Skeleton } from '../../../components/skeleton/skeleton'
import { Tabs } from '../../../components/tabs/tabs'
import { usePayData } from '../../context/PayDataContext'
import { useTimesheet } from '../../context/TimesheetContext'
import { HTML_LANG, isAppLanguage } from '../../i18n/config'
import { jobColorMap, parseMonthKey } from '../../lib/calendar'
import {
  completedPeriods,
  groupByPaymentMonth,
  type HistorySort,
} from '../../lib/history'
import { startOfDay, toIsoDate, type Period } from '../../lib/timesheet'

type JobFilter = 'all' | string

export function History() {
  const { t, i18n } = useTranslation()
  const { periods, loading, error, retry, setActual } = useTimesheet()
  const { rates, rateOf, taxContext, holidays } = usePayData()
  const locale = isAppLanguage(i18n.language) ? HTML_LANG[i18n.language] : 'en'
  const today = useMemo(() => toIsoDate(startOfDay(new Date())), [])
  const [sort, setSort] = useState<HistorySort>('desc')
  const [jobFilter, setJobFilter] = useState<JobFilter>('all')
  const [payslip, setPayslip] = useState<Period | null>(null)
  const jobColors = useMemo(() => jobColorMap(rates), [rates])

  const completed = useMemo(() => completedPeriods(periods, today), [periods, today])

  const filtered = useMemo(
    () => (jobFilter === 'all' ? completed : completed.filter((period) => period.jobId === jobFilter)),
    [completed, jobFilter],
  )

  const groups = useMemo(() => groupByPaymentMonth(filtered, sort), [filtered, sort])

  const jobName = useCallback(
    (id: string) => rates.find((rate) => rate.id === id)?.name ?? id,
    [rates],
  )

  const filterJobs = useMemo(() => {
    const ids = new Set(completed.map((period) => period.jobId))
    return rates.filter((rate) => ids.has(rate.id))
  }, [completed, rates])

  const monthFmt = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }),
    [locale],
  )

  const filterTabs = useMemo(
    () => [
      { value: 'all' as const, label: t('history.filterAll') },
      ...filterJobs.map((job) => ({ value: job.id, label: job.name })),
    ],
    [filterJobs, t],
  )

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => setSort((value) => (value === 'desc' ? 'asc' : 'desc'))}
        className="min-h-10 rounded-lg border border-[#27272A] bg-[#121212] px-3 text-sm font-medium text-[#F4F4F5] hover:bg-[#1E1E1E]"
      >
        {sort === 'desc' ? t('history.sortNewest') : t('history.sortOldest')}
      </button>
      {filterTabs.length > 1 ? (
        <Tabs ariaLabel={t('history.filterLabel')} value={jobFilter} onChange={setJobFilter} items={filterTabs} />
      ) : null}
    </div>
  )

  return (
    <>
      <PageHeader title={t('history.title')} description={t('history.subtitle')} actions={toolbar} />
      {error ? <LoadError onRetry={retry} /> : null}
      {error ? null : loading ? (
        <LoadingRegion label={t('common.loading')}>
          <div className="space-y-3">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        </LoadingRegion>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-[#71717A]">{t('history.empty')}</p>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => {
            const monthDate = parseMonthKey(group.key)
            const title = monthDate ? monthFmt.format(monthDate) : group.key
            return (
              <section key={group.key}>
                <h2 className="text-sm font-semibold capitalize text-[#A1A1AA]">{title}</h2>
                <ul className="mt-3 space-y-2">
                  {group.periods.map((period) => (
                    <li key={period.id}>
                      <PaydayRow
                        jobName={jobName(period.jobId)}
                        jobColor={jobColors.get(period.jobId) ?? '#C8E664'}
                        paymentDate={period.paymentDate}
                        startDate={period.start}
                        endDate={period.end}
                        gross={period.totals?.income ?? 0}
                        tax={period.totals?.tax ?? 0}
                        net={period.totals?.net ?? 0}
                        actual={period.actual}
                        showRange
                        onClick={() => setPayslip(period)}
                      />
                      {period.paymentDate > today ? (
                        <p className="mt-1 text-[11px] text-[#71717A]">
                          {t('history.paydayPending', { date: period.paymentDate })}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      )}
      <PayslipSheet
        period={payslip}
        rates={rates}
        rateOf={rateOf}
        taxContext={taxContext}
        holidays={holidays}
        jobColor={jobColors.get(payslip?.jobId ?? '') ?? '#C8E664'}
        onClose={() => setPayslip(null)}
        onSaveActual={(amount) => (payslip ? setActual(payslip.id, amount) : Promise.resolve())}
      />
    </>
  )
}

export default History