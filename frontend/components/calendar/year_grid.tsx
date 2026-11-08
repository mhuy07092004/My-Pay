import { useMemo } from 'react'
import {
  buildMonthGrid,
  dayGradient,
  totalMinutes,
  type ShiftIndex,
} from '../../src/lib/calendar'
import { toIsoDate } from '../../src/lib/timesheet'

type YearGridProps = {
  year: number
  index: ShiftIndex
  jobColors: Map<string, string>
  locale: string
  onPickMonth: (month: Date) => void
}

function formatMonthTotal(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function YearGrid({ year, index, jobColors, locale, onPickMonth }: YearGridProps) {
  const monthFmt = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long' }),
    [locale],
  )

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 12 }, (_, m) => {
        const month = new Date(year, m, 1)
        const key = `${year}-${String(m + 1).padStart(2, '0')}`
        const monthMap = index.byMonth.get(key)
        const monthTotal = monthMap ? totalMinutes(monthMap) : 0
        const cells = buildMonthGrid(month)

        return (
          <button
            key={key}
            type="button"
            onClick={() => onPickMonth(month)}
            className="rounded-xl border border-[#27272A] bg-[#18181B] p-3 text-left transition-colors hover:border-[#3F3F46] hover:bg-[#1F1F23]"
          >
            <div className="mb-2 flex items-baseline justify-between gap-2">
              <span className="text-sm font-semibold capitalize text-[#F4F4F5]">
                {monthFmt.format(month)}
              </span>
              <span className="text-xs tabular-nums text-[#A1A1AA]">
                {monthTotal > 0 ? formatMonthTotal(monthTotal) : '—'}
              </span>
            </div>
            <div className="grid grid-cols-7 gap-px">
              {cells.map((date) => {
                const iso = toIsoDate(date)
                const entry = index.byDate.get(iso)
                const inMonth = date.getMonth() === m
                const colors =
                  entry?.byJob.map(
                    ({ jobId }) => jobColors.get(jobId) ?? '#C8E664',
                  ) ?? []
                const worked = colors.length > 0
                return (
                  <span
                    key={iso}
                    className={`aspect-square rounded-[2px] ${
                      !inMonth ? 'opacity-30' : ''
                    }`}
                    style={{
                      background: worked ? dayGradient(colors) : '#27272A',
                      opacity: worked ? (inMonth ? 0.85 : 0.35) : inMonth ? 0.25 : 0.15,
                    }}
                  />
                )
              })}
            </div>
          </button>
        )
      })}
    </div>
  )
}
