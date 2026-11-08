import { useTranslation } from 'react-i18next'
import { HoursBadge } from '../timesheet/hours_badge'
import { formatMoney, type PayCycle } from '../../src/lib/timesheet'

type FortnightEstimateProps = {
  beforeTax: number
  tax: number
  afterTax: number
  /** Omit on marketing previews, which have no worked-hours total. */
  minutes?: number
  payCycle?: PayCycle
  className?: string
  showLive?: boolean
  showNote?: boolean
  /** Below lg: render the three figures in one compact row and hide the note. */
  compactOnMobile?: boolean
}

export function FortnightEstimate({
  beforeTax,
  tax,
  afterTax,
  minutes,
  payCycle = 'fortnightly',
  className = '',
  showLive = true,
  showNote = true,
  compactOnMobile = false,
}: FortnightEstimateProps) {
  const { t } = useTranslation()
  const row = compactOnMobile
    ? 'flex flex-col gap-0.5 lg:flex-row lg:justify-between'
    : 'flex justify-between'
  const lastRow = compactOnMobile
    ? 'flex flex-col gap-0.5 lg:flex-row lg:justify-between lg:border-t lg:border-[#27272A] lg:pt-3'
    : 'flex justify-between border-t border-[#27272A] pt-3'
  const showHours = minutes !== undefined

  const hours = showHours ? (
    <div className={compactOnMobile ? `${row} order-3 lg:order-1` : row}>
      <dt className="text-[#A1A1AA]">{t('timesheet.hours.total')}</dt>
      <dd>
        <HoursBadge minutes={minutes} payCycle={payCycle} />
      </dd>
    </div>
  ) : null

  return (
    <aside className={`space-y-4 ${className}`}>
      <div
        className={`rounded-xl border border-[#27272A] bg-[#18181B] ${
          compactOnMobile ? 'p-3 shadow-lg shadow-black/40 sm:p-4 lg:p-5 lg:shadow-none' : 'p-5'
        }`}
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">
            {t('timesheet.estimate.title')}
          </p>
          {showLive ? (
            <span className="rounded-full bg-[#2A3018] px-2 py-0.5 text-[10px] font-semibold text-[#C8E664]">
              {t('timesheet.estimate.live')}
            </span>
          ) : null}
        </div>
        <dl
          className={`mt-4 text-sm ${
            compactOnMobile ? 'mt-2 grid grid-cols-3 gap-2 lg:mt-4 lg:grid-cols-1 lg:gap-3' : 'space-y-3'
          }`}
        >
          {hours}
          <div className={compactOnMobile ? `${row} order-1 lg:order-2` : row}>
            <dt className="text-[#A1A1AA]">{t('timesheet.estimate.beforeTax')}</dt>
            <dd className="tabular-nums text-[#F4F4F5]">${formatMoney(beforeTax)}</dd>
          </div>
          <div className={compactOnMobile ? `${row} order-4 max-lg:hidden lg:order-3` : row}>
            <dt className="text-[#A1A1AA]">{t('timesheet.estimate.tax')}</dt>
            <dd className="tabular-nums text-[#F4F4F5]">${formatMoney(tax)}</dd>
          </div>
          <div className={compactOnMobile ? `${lastRow} order-2 lg:order-4` : lastRow}>
            <dt className="text-[#A1A1AA]">{t('timesheet.estimate.afterTax')}</dt>
            <dd className="font-semibold text-[#C8E664]">${formatMoney(afterTax)}</dd>
          </div>
        </dl>
      </div>

      {showNote ? (
        <div
          className={`rounded-xl border border-[#27272A] bg-[#18181B] p-5 ${
            compactOnMobile ? 'max-lg:hidden' : ''
          }`}
        >
          <p className="text-sm font-semibold text-[#F4F4F5]">
            {t('timesheet.howItUpdates.title')}
          </p>
          <p className="mt-2 text-sm text-[#A1A1AA]">
            {t('timesheet.howItUpdates.body')}
          </p>
        </div>
      ) : null}
    </aside>
  )
}
