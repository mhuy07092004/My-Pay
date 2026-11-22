import { useTranslation } from 'react-i18next'
import { HTML_LANG, isAppLanguage } from '../../src/i18n/config'
import { formatMoney, parseIsoDate } from '../../src/lib/timesheet'

export type PaydayRowProps = {
  jobName: string
  jobColor: string
  paymentDate: string
  startDate: string
  endDate: string
  gross: number
  tax: number
  net: number
  projected?: boolean
  actual?: number
  showRange?: boolean
  disabled?: boolean
  onClick?: () => void
}

export function PaydayRow({
  jobName,
  jobColor,
  paymentDate,
  startDate,
  endDate,
  gross,
  tax,
  net,
  projected,
  actual,
  showRange = false,
  disabled,
  onClick,
}: PaydayRowProps) {
  const { t, i18n } = useTranslation()
  const locale = isAppLanguage(i18n.language) ? HTML_LANG[i18n.language] : 'en'
  const fmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' })
  const range = `${fmt.format(parseIsoDate(startDate))} → ${fmt.format(parseIsoDate(endDate))}`
  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      disabled={disabled}
      onClick={onClick}
      className={
        onClick
          ? 'w-full rounded-lg border border-[#27272A] bg-[#09090B] px-3 py-2.5 text-left transition-colors hover:bg-[#121212] disabled:opacity-70'
          : 'rounded-lg border border-[#27272A] bg-[#09090B] px-3 py-2.5'
      }
    >
      <span className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-[#F4F4F5]">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: jobColor }} />
          {jobName}
        </span>
        <span className="text-xs text-[#A1A1AA]">{paymentDate}</span>
      </span>
      {showRange ? <p className="mt-1 text-xs text-[#71717A]">{range}</p> : null}
      <span className="mt-1 flex flex-wrap justify-between gap-x-2 gap-y-1 text-xs text-[#A1A1AA]">
        <span>
          {t('timesheet.estimate.beforeTax')} ${formatMoney(gross)}
        </span>
        <span>
          {t('timesheet.estimate.tax')} ${formatMoney(tax)}
        </span>
        <span className="text-[#C8E664]">${formatMoney(net)}</span>
      </span>
      {actual !== undefined ? (
        <span className="mt-1 block text-xs text-[#A1A1AA]">
          {t('timesheet.periods.actual')}: ${formatMoney(actual)}
        </span>
      ) : null}
      {projected ? (
        <span className="mt-1 block text-[11px] text-[#71717A]">{t('timesheet.paydayPanel.upcoming')}</span>
      ) : null}
    </Tag>
  )
}