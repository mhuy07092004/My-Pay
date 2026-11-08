import { memo, useMemo, type CSSProperties } from 'react'
import {
  buildMonthGrid,
  formatPillHours,
  type DayEntry,
  type ShiftIndex,
} from '../../src/lib/calendar'
import { toIsoDate, startOfDay, isSameDay } from '../../src/lib/timesheet'

type MonthGridProps = {
  viewMonth: Date
  index: ShiftIndex
  jobColors: Map<string, string>
  locale: string
  today: Date
  onDayClick: (iso: string, entry: DayEntry | undefined, anchor: DOMRect) => void
}

type DayCellProps = {
  date: Date
  viewMonth: Date
  entry: DayEntry | undefined
  jobColors: Map<string, string>
  isToday: boolean
  onDayClick: (iso: string, entry: DayEntry | undefined, anchor: DOMRect) => void
}

function pillStyle(color: string): CSSProperties {
  return {
    backgroundColor: `${color}26`,
    borderColor: `${color}4D`,
    color,
  }
}

const DayCell = memo(function DayCell({
  date,
  viewMonth,
  entry,
  jobColors,
  isToday,
  onDayClick,
}: DayCellProps) {
  const iso = toIsoDate(date)
  const inMonth = date.getMonth() === viewMonth.getMonth()
  const worked = entry !== undefined && entry.byJob.length > 0

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    onDayClick(iso, entry, rect)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={String(date.getDate())}
      className={`flex min-h-[4.5rem] flex-col gap-0.5 rounded-lg border p-1.5 text-left transition-colors sm:min-h-[5.5rem] sm:p-2 ${
        worked
          ? 'border-[#3F3F46] bg-[#1F1F23] hover:bg-[#27272A]'
          : 'border-transparent bg-transparent hover:bg-[#27272A]/40'
      } ${!inMonth ? 'opacity-40' : ''}`}
    >
      <span
        className={`inline-flex h-6 w-6 items-center justify-center self-start rounded-full text-xs font-semibold tabular-nums sm:text-sm ${
          isToday
            ? 'bg-[#C8E664] text-black'
            : worked
              ? 'text-[#F4F4F5]'
              : 'text-[#71717A]'
        }`}
      >
        {date.getDate()}
      </span>
      <div className="mt-auto flex min-w-0 flex-col gap-0.5">
        {entry?.byJob.map(({ jobId, minutes }) => {
          const color = jobColors.get(jobId) ?? '#C8E664'
          return (
            <span
              key={jobId}
              className="truncate rounded-full border px-1.5 py-0.5 text-[10px] font-semibold tabular-nums sm:text-[11px]"
              style={pillStyle(color)}
            >
              {formatPillHours(minutes)}
            </span>
          )
        })}
      </div>
    </button>
  )
})

export function MonthGrid({
  viewMonth,
  index,
  jobColors,
  locale,
  today,
  onDayClick,
}: MonthGridProps) {
  const cells = useMemo(() => buildMonthGrid(viewMonth), [viewMonth])
  const weekdayFmt = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: 'short' }),
    [locale],
  )
  const weekdayLabels = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) =>
        weekdayFmt.format(new Date(2024, 0, 1 + i)),
      ),
    [weekdayFmt],
  )

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1 sm:gap-1.5">
        {weekdayLabels.map((label, i) => (
          <p
            key={i}
            className="py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-[#71717A] sm:text-xs"
          >
            {label}
          </p>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
        {cells.map((date) => {
          const iso = toIsoDate(date)
          return (
            <DayCell
              key={iso}
              date={date}
              viewMonth={viewMonth}
              entry={index.byDate.get(iso)}
              jobColors={jobColors}
              isToday={isSameDay(date, startOfDay(today))}
              onDayClick={onDayClick}
            />
          )
        })}
      </div>
    </div>
  )
}
