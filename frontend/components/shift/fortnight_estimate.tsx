import { useTranslation } from 'react-i18next'
import { formatMoney } from '../../src/lib/timesheet'

type FortnightEstimateProps = {
  beforeTax: number
  tax: number
  afterTax: number
  className?: string
  showLive?: boolean
  showNote?: boolean
}

export function FortnightEstimate({
  beforeTax,
  tax,
  afterTax,
  className = '',
  showLive = true,
  showNote = true,
}: FortnightEstimateProps) {
  const { t } = useTranslation()

  return (
    <aside className={`space-y-4 ${className}`}>
      <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
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
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-[#A1A1AA]">{t('timesheet.estimate.beforeTax')}</dt>
            <dd className="text-[#F4F4F5]">${formatMoney(beforeTax)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[#A1A1AA]">{t('timesheet.estimate.tax')}</dt>
            <dd className="text-[#F4F4F5]">${formatMoney(tax)}</dd>
          </div>
          <div className="flex justify-between border-t border-[#27272A] pt-3">
            <dt className="text-[#A1A1AA]">{t('timesheet.estimate.afterTax')}</dt>
            <dd className="font-semibold text-[#C8E664]">${formatMoney(afterTax)}</dd>
          </div>
        </dl>
      </div>

      {showNote ? (
        <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
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
