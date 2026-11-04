import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../../components/button/button'
import { Card } from '../../../components/card/card'
import { PageHeader } from '../../../components/layout/page_header'
import { PeriodCard } from '../../../components/timesheet/period_card'
import { useAuth } from '../../context/AuthContext'
import { useTimesheet } from '../../context/TimesheetContext'
import { useTranslation } from 'react-i18next'
import { getReport } from '../../lib/api'
import { formatMoney, startOfDay, toIsoDate } from '../../lib/timesheet'

export function Dashboard() {
  const { user } = useAuth()
  const { periods, loading } = useTimesheet()
  const { t } = useTranslation()
  const [total, setTotal] = useState(0)

  // Gross earned from every shift up to today; reloads when periods change.
  useEffect(() => {
    let cancelled = false
    getReport('year', toIsoDate(startOfDay(new Date())))
      .then((res) => {
        if (!cancelled) setTotal(res.grossToDateCents / 100)
      })
      .catch((err) => console.error('Failed to load dashboard total', err))
    return () => {
      cancelled = true
    }
  }, [periods])

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
            value={formatMoney(total)}
            prefix="$"
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
          {loading ? null : recent.length === 0 ? (
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
                  tax={period.totals?.tax ?? 0}
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
