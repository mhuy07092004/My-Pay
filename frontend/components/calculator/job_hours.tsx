import { useTranslation } from 'react-i18next'
import { formatDuration, type JobHoursBreakdown } from '../../src/lib/calculator'
import { formatMoney } from '../../src/lib/timesheet'

type JobHoursProps = {
  breakdowns: JobHoursBreakdown[]
  jobName: (id: string) => string
  jobColors: Map<string, string>
}

export function JobHours({ breakdowns, jobName, jobColors }: JobHoursProps) {
  const { t } = useTranslation()
  if (breakdowns.length === 0) return null

  return (
    <ul className="space-y-2">
      {breakdowns.map((row) => (
        <li
          key={row.jobId}
          className="rounded-lg border border-[#27272A] bg-[#09090B] px-3 py-2.5 text-sm"
        >
          <p className="flex items-center gap-2 font-semibold text-[#F4F4F5]">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: jobColors.get(row.jobId) ?? '#C8E664' }}
            />
            {jobName(row.jobId)}
          </p>
          {row.weekday ? (
            <p className="mt-1 text-[#F4F4F5]">
              {formatDuration(row.weekday.totalMinutes)}{' '}
              <span className="text-[#A1A1AA]">
                ({t('calculator.rates.weekday')} ${formatMoney(row.weekday.rate)}/h)
              </span>
            </p>
          ) : (
            <p className="mt-1 text-[#71717A]">{t('calculator.noWeekdayRate')}</p>
          )}
          <p className="mt-1 text-xs text-[#A1A1AA]">
            {row.saturday ? (
              <span className="mr-3">
                {t('calculator.rates.saturday')} {formatDuration(row.saturday.totalMinutes)}
              </span>
            ) : null}
            {row.sunday ? (
              <span>
                {t('calculator.rates.sunday')} {formatDuration(row.sunday.totalMinutes)}
              </span>
            ) : null}
          </p>
        </li>
      ))}
    </ul>
  )
}