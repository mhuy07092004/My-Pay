import { useTranslation } from 'react-i18next'
import { formatHours, hoursTone, type HoursTone, type PayCycle } from '../../src/lib/timesheet'

const TONE_CLASS: Record<HoursTone, string> = {
  green: 'bg-[#2A3018] text-[#C8E664]',
  yellow: 'bg-[#3F3208] text-[#FACC15]',
  red: 'bg-[#3F1515] text-[#EF4444]',
}

type HoursBadgeProps = {
  minutes: number
  payCycle: PayCycle
  className?: string
}

export function HoursBadge({ minutes, payCycle, className = '' }: HoursBadgeProps) {
  const { t } = useTranslation()
  const tone = hoursTone(minutes, payCycle)
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums ${TONE_CLASS[tone]} ${className}`}
    >
      {t('timesheet.hours.badge', { hours: formatHours(minutes) })}
    </span>
  )
}
