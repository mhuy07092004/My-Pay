import { useTranslation } from 'react-i18next'
import type { PaydayMark } from '../../src/lib/calendar'
import { PaydayRow } from './payday_row'

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
              <PaydayRow
                jobName={jobName(mark.jobId)}
                jobColor={jobColors.get(mark.jobId) ?? '#C8E664'}
                paymentDate={mark.paymentDate}
                startDate={mark.startDate}
                endDate={mark.endDate}
                gross={mark.gross}
                tax={mark.tax}
                net={mark.net}
                projected={mark.projected}
                disabled={!mark.periodId}
                onClick={() => onOpen(mark)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}