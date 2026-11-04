import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../../components/button/button'
import { PageHeader } from '../../../components/layout/page_header'
import { PeriodCard } from '../../../components/timesheet/period_card'
import { HTML_LANG, isAppLanguage } from '../../i18n/config'
import { useTimesheet } from '../../context/TimesheetContext'
import { groupPeriodsByMonth } from '../../lib/timesheet'

export function Timesheet() {
  const { t, i18n } = useTranslation()
  const { periods, loading } = useTimesheet()
  const locale = isAppLanguage(i18n.language) ? HTML_LANG[i18n.language] : 'en'
  const monthTitle = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' })
  const groups = useMemo(() => groupPeriodsByMonth(periods), [periods])

  return (
    <>
      <PageHeader
        title={t('timesheet.periods.title')}
        actions={
          <Button
            to="/dashboard/timesheet/newshifts"
            className="min-h-11 bg-[#C8E664]! hover:bg-[#B5D350]!"
          >
            {t('timesheet.addNewShifts')}
          </Button>
        }
      />

      {loading ? null : groups.length === 0 ? (
        <p className="text-[#A1A1AA]">{t('timesheet.periods.empty')}</p>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.key}>
              <h2 className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-10 -mx-4 mb-3 bg-[#18181B]/95 px-4 py-2 text-sm font-semibold capitalize text-[#A1A1AA] backdrop-blur sm:-mx-6 sm:px-6 md:static md:mx-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none">
                {monthTitle.format(group.month)}
              </h2>
              <div className="grid gap-3 lg:grid-cols-2">
                {group.periods.map((period) => (
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
            </section>
          ))}
        </div>
      )}
    </>
  )
}

export default Timesheet
