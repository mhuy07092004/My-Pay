import { useTranslation } from 'react-i18next'
import { SUMMARY_KINDS, type RateHours } from '../../src/lib/pay'
import { formatHours } from '../../src/lib/timesheet'

type HoursSummaryProps = {
  rows: RateHours[]
  nameOf: (rateId: string) => string
}

export function HoursSummary({ rows, nameOf }: HoursSummaryProps) {
  const { t } = useTranslation()
  const visible = rows.filter((row) => row.minutes > 0)
  if (visible.length === 0) return null

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold tracking-tight">{t('timesheet.hours.summaryTitle')}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-4">
        {visible.map((row) => (
          <div key={row.rateId} className="rounded-xl border border-[#27272A] bg-[#18181B] p-4 sm:p-5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-semibold text-[#F4F4F5]">{nameOf(row.rateId)}</p>
              <p className="text-sm font-semibold tabular-nums text-[#F4F4F5]">
                {formatHours(row.minutes)}
              </p>
            </div>
            <ul className="mt-3 space-y-1.5 text-sm">
              {SUMMARY_KINDS.filter((kind) => (row.byKind[kind] ?? 0) > 0).map((kind) => (
                <li key={kind} className="flex items-baseline justify-between gap-3">
                  <span className="text-[#A1A1AA]">{t(`timesheet.summaryKind.${kind}`)}</span>
                  <span className="tabular-nums text-[#F4F4F5]">
                    {formatHours(row.byKind[kind] ?? 0)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
