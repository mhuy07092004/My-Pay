import { useState } from 'react'
import {
  calcShiftMinutes,
  calcTotalPay,
  formatMoney,
  formatTime12h,
  toIsoDate,
  type Shift,
  type ShiftPart,
} from '../../src/lib/timesheet'

type ShiftCalendarProps = {
  days: Date[]
  shifts: Record<string, Shift>
  rateOf: (rateId: string) => number
  locale: string
  noShiftLabel: string
  breakLabel: (count: number) => string
}

function hoursOf(shift: Shift): string {
  const parts = shift.second ? [shift, shift.second] : [shift]
  const minutes = parts.reduce((sum, part) => sum + calcShiftMinutes(part), 0)
  const value = minutes / 60
  return `${Number.isInteger(value) ? value : value.toFixed(1)}h`
}

export function ShiftCalendar({
  days,
  shifts,
  rateOf,
  locale,
  noShiftLabel,
  breakLabel,
}: ShiftCalendarProps) {
  const firstWorked = days.findIndex((day) => shifts[toIsoDate(day)])
  const [selected, setSelected] = useState(Math.max(firstWorked, 0))
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'short' })
  const dayMonth = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' })
  const full = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'short' })

  const selectedDay = days[selected]
  const selectedShift = selectedDay ? shifts[toIsoDate(selectedDay)] : undefined
  const line = (part: ShiftPart) => {
    const range = `${formatTime12h(part.checkIn, locale)} → ${formatTime12h(part.checkOut, locale)}`
    return part.breakMinutes > 0 ? `${range} · ${breakLabel(part.breakMinutes)}` : range
  }

  return (
    <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-4 sm:p-5">
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.slice(0, 7).map((day) => (
          <p
            key={`h-${toIsoDate(day)}`}
            className="text-center text-[10px] font-semibold uppercase tracking-wider text-[#A1A1AA]"
          >
            {weekday.format(day)}
          </p>
        ))}
        {days.map((day, index) => {
          const shift = shifts[toIsoDate(day)]
          const active = index === selected
          return (
            <button
              key={toIsoDate(day)}
              type="button"
              onClick={() => setSelected(index)}
              aria-pressed={active}
              aria-label={`${full.format(day)}${shift ? ` ${hoursOf(shift)}` : ''}`}
              className={`flex aspect-square min-w-0 flex-col items-center justify-between rounded-lg border p-1 text-[10px] transition-colors sm:p-1.5 sm:text-xs ${
                shift
                  ? 'border-[#C8E664]/30 bg-[#C8E664]/15 text-[#F4F4F5] hover:bg-[#C8E664]/25'
                  : 'border-[#27272A] bg-transparent text-[#A1A1AA]/60 hover:bg-[#27272A]/40'
              } ${active ? 'ring-2 ring-[#C8E664]' : ''}`}
            >
              <span className="tabular-nums">{day.getDate()}</span>
              <span className={`font-semibold tabular-nums ${shift ? 'text-[#C8E664]' : ''}`}>
                {shift ? hoursOf(shift) : ''}
              </span>
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex items-start justify-between gap-4 border-t border-[#27272A] pt-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold">
            {selectedDay ? dayMonth.format(selectedDay) : ''}
          </p>
          {selectedShift ? (
            <>
              <p className="mt-1 text-sm text-[#A1A1AA]">{line(selectedShift)}</p>
              {selectedShift.second ? (
                <p className="text-sm text-[#A1A1AA]">{line(selectedShift.second)}</p>
              ) : null}
            </>
          ) : (
            <p className="mt-1 text-sm text-[#A1A1AA]">{noShiftLabel}</p>
          )}
        </div>
        {selectedShift ? (
          <p className="shrink-0 text-base font-semibold tabular-nums">
            ${formatMoney(calcTotalPay(selectedShift, rateOf))}
          </p>
        ) : null}
      </div>
    </div>
  )
}
