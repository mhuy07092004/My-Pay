import { useTranslation } from 'react-i18next'
import type { PaydayMark } from '../../src/lib/calendar'
import { formatMoney } from '../../src/lib/timesheet'

type PaydayPanelProps = {
  marks: PaydayMark[]
  jobName: (id: string) => string
  jobColors: Map<string, string>
  onOpen: (mark: PaydayMark) => void
}

export function PaydayPanel({ marks, jobName, jobColors, onOpen }: PaydayPanelProps) {
  const { t } = useTranslation()
  return (
    <section className="rounded-xl border border-[#27272A] bg-[#18181B] p-4">
      <h2 className="text-sm font-semibold text-[#A1A1AA]">{t('timesheet.paydayPanel.title')}</h2>
      {marks.length === 0 ? (
        <p className="mt-3 text-sm text-[#71717A]">{t('timesheet.paydayPanel.empty')}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {marks.map((mark) => (
            <li key={`${mark.jobId}-${mark.paymentDate}-${mark.startDate}`}>
              <button
                type="button"
                disabled={!mark.periodId}
                onClick={() => onOpen(mark)}
                className="w-full rounded-lg border border-[#27272A] bg-[#09090B] px-3 py-2.5 text-left disabled:opacity-70"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-sm font-semibold text-[#F4F4F5]">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: jobColors.get(mark.jobId) ?? '#C8E664' }}
                    />
                    {jobName(mark.jobId)}
                  </span>
                  <span className="text-xs text-[#A1A1AA]">{mark.paymentDate}</span>
                </span>
                <span className="mt-1 flex justify-between text-xs text-[#A1A1AA]">
                  <span>
                    {t('timesheet.estimate.beforeTax')} ${formatMoney(mark.gross)}
                  </span>
                  <span>
                    {t('timesheet.estimate.tax')} ${formatMoney(mark.tax)}
                  </span>
                  <span className="text-[#C8E664]">${formatMoney(mark.net)}</span>
                </span>
                {mark.projected ? (
                  <span className="mt-1 block text-[11px] text-[#71717A]">{t('timesheet.paydayPanel.upcoming')}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
