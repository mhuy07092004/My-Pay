import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { HTML_LANG, isAppLanguage } from '../../src/i18n/config'
import { formatMoney, periodRange } from '../../src/lib/timesheet'

type PeriodCardProps = {
  id: string
  start: string
  end: string
  income: number
  tax: number
  actual?: number
}

export function PeriodCard({ id, start, end, income, tax, actual }: PeriodCardProps) {
  const { t, i18n } = useTranslation()
  const locale = isAppLanguage(i18n.language) ? HTML_LANG[i18n.language] : 'en'
  const fmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' })
  const range = periodRange({ start, end })
  const recorded = actual !== undefined

  const stat = (label: string, value: string, className = 'text-[#F4F4F5]') => (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-[#A1A1AA]">{label}</p>
      <p className={`mt-1 text-sm ${className}`}>{value}</p>
    </div>
  )

  return (
    <Link
      to={`/dashboard/timesheet/${id}`}
      className="flex items-center gap-4 rounded-xl border border-[#27272A] bg-[#18181B] px-5 py-4 transition-colors hover:bg-[#1E1E1E]"
    >
      <div className="flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="text-base text-[#F4F4F5]">
            {fmt.format(range.start)} → {fmt.format(range.end)}
          </p>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] ${
              recorded ? 'bg-[#2A3018] text-[#C8E664]' : 'bg-[#27272A] text-[#A1A1AA]'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                recorded ? 'bg-[#C8E664]' : 'bg-[#A1A1AA]'
              }`}
            />
            {recorded ? t('timesheet.periods.actualRecorded') : t('timesheet.periods.estimated')}
          </span>
        </div>
        <div
          className={`mt-3 grid gap-4 ${recorded ? 'grid-cols-3' : 'grid-cols-2'}`}
        >
          {stat(t('timesheet.periods.income'), `$${formatMoney(income)}`)}
          {stat(t('timesheet.periods.tax'), `$${formatMoney(tax)}`)}
          {recorded
            ? stat(
                t('timesheet.periods.actual'),
                `$${formatMoney(actual)}`,
                'text-[#C8E664]',
              )
            : null}
        </div>
      </div>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0 text-[#71717A]"
        aria-hidden
      >
        <path d="M9 6l6 6-6 6" />
      </svg>
    </Link>
  )
}
