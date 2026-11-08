import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '../../../components/button/button'
import { Card } from '../../../components/card/card'
import { PageHeader } from '../../../components/layout/page_header'
import { LoadError } from '../../../components/skeleton/load_error'
import { LoadingRegion } from '../../../components/skeleton/skeleton'
import { PeriodCard, PeriodCardSkeleton } from '../../../components/timesheet/period_card'
import { useAuth } from '../../context/AuthContext'
import { usePayData } from '../../context/PayDataContext'
import { useTimesheet } from '../../context/TimesheetContext'
import { toReportContext } from '../../lib/pay'
import { reportFromPeriods } from '../../lib/report'
import { formatMoney, startOfDay, toIsoDate } from '../../lib/timesheet'

export function Dashboard() {
  const { user } = useAuth()
  const { periods, loading, error, retry } = useTimesheet()
  const { taxContext, holidays } = usePayData()
  const { t } = useTranslation()
  const today = useMemo(() => toIsoDate(startOfDay(new Date())), [])

  const total = useMemo(() => {
    if (loading || error) return null
    return reportFromPeriods(periods, 'year', today, toReportContext(taxContext, holidays)).grossToDate
  }, [loading, error, periods, today, taxContext, holidays])

  const recent = useMemo(
    () => [...periods].sort((a, b) => b.start.localeCompare(a.start)).slice(0, 3),
    [periods],
  )

  return (
    <>
      <PageHeader
        title={t('dashboard.title')}
        description={t('dashboard.welcome', { name: user?.firstName })}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="space-y-4">
          <Card
            label={t('dashboard.totalEarning')}
            value={total === null ? (error ? '—' : null) : formatMoney(total)}
            prefix={total === null ? undefined : '$'}
            valueClassName="text-[#C8E664]"
            className="[&>p:nth-of-type(2)]:text-4xl"
          />
          <Button
            to="/dashboard/timesheet/newshifts"
            size="lg"
            className="w-full bg-[#C8E664]! text-black hover:bg-[#B5D350]!"
          >
            {t('timesheet.addNewShifts')}
          </Button>
        </div>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#A1A1AA]">
              {t('dashboard.recentPeriods')}
            </h2>
            <Link
              to="/dashboard/timesheet"
              className="-mr-2 inline-flex min-h-11 items-center px-2 text-sm font-medium text-[#C8E664] hover:text-[#B5D350]"
            >
              {t('dashboard.viewAll')} →
            </Link>
          </div>
          {loading ? (
            <LoadingRegion label={t('common.loading')}>
              <div className="space-y-3">
                <PeriodCardSkeleton />
                <PeriodCardSkeleton />
                <PeriodCardSkeleton />
              </div>
            </LoadingRegion>
          ) : error ? (
            <LoadError onRetry={retry} />
          ) : recent.length === 0 ? (
            <p className="text-[#A1A1AA]">{t('timesheet.periods.empty')}</p>
          ) : (
            <div className="space-y-3">
              {recent.map((period) => (
                <PeriodCard
                  key={period.id}
                  id={period.id}
                  start={period.start}
                  end={period.end}
                  income={period.totals?.income ?? 0}
                  net={period.totals?.net ?? 0}
                  minutes={period.totals?.minutes ?? 0}
                  payCycle={period.payCycle ?? 'fortnightly'}
                  actual={period.actual}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}

export default Dashboard
