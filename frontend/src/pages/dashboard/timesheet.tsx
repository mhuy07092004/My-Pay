import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../../components/button/button'
import { PeriodCard } from '../../../components/timesheet/period_card'
import { MOCK_RATES, TAX_RATE } from '../../../mock/timesheet'
import { HTML_LANG, isAppLanguage } from '../../i18n/config'
import { useTimesheet } from '../../context/TimesheetContext'
import { groupPeriodsByMonth, periodTotals } from '../../lib/timesheet'

export function Timesheet() {
  const { t, i18n } = useTranslation()
  const { periods } = useTimesheet()
  const locale = isAppLanguage(i18n.language) ? HTML_LANG[i18n.language] : 'en'
  const monthTitle = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' })
  const groups = useMemo(() => groupPeriodsByMonth(periods), [periods])

  const rateOf = (id: string) =>
    (MOCK_RATES.find((r) => r.id === id) ?? MOCK_RATES[0]).hourlyRate

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('timesheet.periods.title')}
        </h1>
        <Button
          to="/dashboard/timesheet/newshifts"
          className="bg-[#C8E664]! hover:bg-[#B5D350]!"
        >
          {t('timesheet.addNewShifts')}
        </Button>
      </div>

      {groups.length === 0 ? (
        <p className="mt-6 text-[#A1A1AA]">{t('timesheet.periods.empty')}</p>
      ) : (
        <div className="mt-6 max-w-3xl space-y-8 pb-8">
          {groups.map((group) => (
            <section key={group.key}>
              <h2 className="mb-3 text-sm font-semibold capitalize text-[#A1A1AA]">
                {monthTitle.format(group.month)}
              </h2>
              <div className="space-y-3">
                {group.periods.map((period) => {
                  const { income, tax } = periodTotals(period, rateOf, TAX_RATE)
                  return (
                    <PeriodCard
                      key={period.id}
                      id={period.id}
                      start={period.start}
                      end={period.end}
                      income={income}
                      tax={tax}
                      actual={period.actual}
                    />
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  )
}

export default Timesheet
