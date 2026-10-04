import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HTML_LANG, isAppLanguage } from '../../src/i18n/config'
import {
  MAX_RANGE_DAYS,
  diffDays,
  isSameDay,
  startOfDay,
  type DateRange,
} from '../../src/lib/timesheet'

type DateRangePickerProps = {
  value: DateRange
  onChange: (range: DateRange) => void
  maxDays?: number
  className?: string
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}

function buildMonthCells(month: Date): (Date | null)[] {
  const offset = (month.getDay() + 6) % 7 // Monday first
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const cells: (Date | null)[] = Array.from({ length: offset }, () => null)
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), d))
  }
  return cells
}

const chevronProps = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export function DateRangePicker({
  value,
  onChange,
  maxDays = MAX_RANGE_DAYS,
  className = '',
}: DateRangePickerProps) {
  const { t, i18n } = useTranslation()
  const locale = isAppLanguage(i18n.language) ? HTML_LANG[i18n.language] : 'en'
  const containerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(value.start))
  const [pendingStart, setPendingStart] = useState<Date | null>(null)
  const [hover, setHover] = useState<Date | null>(null)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const shortDate = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' })
  const monthTitle = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' })
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short' })
  const dayLabel = new Intl.DateTimeFormat(locale, { dateStyle: 'full' })

  function toggle() {
    if (!open) {
      setViewMonth(startOfMonth(value.start))
      setPendingStart(null)
      setHover(null)
    }
    setOpen((prev) => !prev)
  }

  function isDisabled(day: Date): boolean {
    if (!pendingStart || day < pendingStart) return false
    return diffDays(pendingStart, day) > maxDays - 1
  }

  function handleSelect(day: Date) {
    if (isDisabled(day)) return
    if (!pendingStart || day < pendingStart) {
      setPendingStart(day)
      setHover(null)
      return
    }
    onChange({ start: pendingStart, end: day })
    setPendingStart(null)
    setOpen(false)
  }

  let shownStart = value.start
  let shownEnd = value.end
  if (pendingStart) {
    shownStart = pendingStart
    shownEnd =
      hover && hover >= pendingStart && !isDisabled(hover) ? hover : pendingStart
  }

  const today = startOfDay(new Date())
  const dayCount = diffDays(shownStart, shownEnd) + 1
  const weekdayLabels = Array.from({ length: 7 }, (_, i) =>
    weekday.format(new Date(2024, 0, 1 + i)),
  )

  function renderMonth(month: Date, extraClass: string) {
    return (
      <div className={`w-64 ${extraClass}`} key={month.toISOString()}>
        <p className="mb-3 text-center text-sm font-semibold capitalize text-[#F4F4F5]">
          {monthTitle.format(month)}
        </p>
        <div className="grid grid-cols-7 gap-y-1 text-center">
          {weekdayLabels.map((label, i) => (
            <span key={i} className="pb-1 text-xs capitalize text-[#71717A]">
              {label}
            </span>
          ))}
          {buildMonthCells(month).map((day, i) => {
            if (!day) return <span key={`empty-${i}`} />

            const isStart = isSameDay(day, shownStart)
            const isEnd = isSameDay(day, shownEnd)
            const inRange = day >= shownStart && day <= shownEnd
            const disabled = isDisabled(day)
            const edge = isStart || isEnd

            return (
              <button
                key={day.getDate()}
                type="button"
                disabled={disabled}
                aria-label={dayLabel.format(day)}
                aria-pressed={edge}
                onClick={() => handleSelect(day)}
                onMouseEnter={() => setHover(day)}
                className={`h-9 text-sm transition-colors ${
                  edge
                    ? 'rounded-lg bg-[#C8E664] font-semibold text-black'
                    : inRange
                      ? 'bg-[#2A3018] text-[#C8E664]'
                      : disabled
                        ? 'cursor-not-allowed text-[#3F3F46]'
                        : 'rounded-lg text-[#F4F4F5] hover:bg-[#27272A]'
                } ${isSameDay(day, today) && !edge ? 'font-bold underline' : ''}`}
              >
                {day.getDate()}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={toggle}
        className="inline-flex items-center gap-2 rounded-full border border-[#27272A] bg-[#09090B] px-4 py-2 text-sm font-medium text-[#F4F4F5] transition-colors hover:bg-[#1E1E1E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8E664]"
      >
        <svg {...chevronProps} className="text-[#C8E664]">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </svg>
        <span>
          {shortDate.format(value.start)} → {shortDate.format(value.end)}
        </span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={t('timesheet.picker.label')}
          className="absolute right-0 z-30 mt-2 rounded-2xl border border-[#27272A] bg-[#18181B] p-4 shadow-2xl"
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              aria-label={t('timesheet.picker.prevMonth')}
              onClick={() => setViewMonth((m) => addMonths(m, -1))}
              className="rounded-md p-1.5 text-[#F4F4F5] hover:bg-[#27272A]"
            >
              <svg {...chevronProps}>
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </button>
            <button
              type="button"
              aria-label={t('timesheet.picker.nextMonth')}
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              className="rounded-md p-1.5 text-[#F4F4F5] hover:bg-[#27272A]"
            >
              <svg {...chevronProps}>
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </div>

          <div className="flex gap-6">
            {renderMonth(viewMonth, '')}
            {renderMonth(addMonths(viewMonth, 1), 'hidden md:block')}
          </div>

          <p className="mt-3 text-xs text-[#A1A1AA]">
            {pendingStart
              ? t('timesheet.picker.pickEnd', { max: maxDays })
              : t('timesheet.picker.pickStart', { max: maxDays })}
            {' · '}
            {t('timesheet.picker.days', { count: dayCount })}
          </p>
        </div>
      ) : null}
    </div>
  )
}