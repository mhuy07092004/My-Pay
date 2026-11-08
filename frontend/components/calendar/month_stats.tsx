import { useMemo } from 'react'
import {
  addMonths,
  formatPillHours,
  monthJobMinutes,
  monthKey,
  totalMinutes,
  type ShiftIndex,
} from '../../src/lib/calendar'
import type { SavedRate } from '../../src/lib/rates'

const LIME = 'text-[#C8E664]'
const SOFT_RED = 'text-[#F0A8A8]'
const NEUTRAL = 'text-[#F4F4F5]'

type MonthStatsProps = {
  viewMonth: Date
  index: ShiftIndex
  rates: SavedRate[]
  jobColors: Map<string, string>
  labels: {
    title: string
    vsLastMonth: string
    total: string
  }
}

function deltaClass(delta: number): string {
  if (delta > 0) return LIME
  if (delta < 0) return SOFT_RED
  return NEUTRAL
}

function formatDeltaHours(minutes: number): string {
  const sign = minutes > 0 ? '+' : minutes < 0 ? '−' : ''
  const abs = Math.abs(minutes)
  const h = Math.floor(abs / 60)
  const m = abs % 60
  if (h === 0) return `${sign}${m}m`
  if (m === 0) return `${sign}${h}h`
  return `${sign}${h}h ${m}m`
}

function formatPct(current: number, prev: number): string {
  if (prev === 0) return current > 0 ? '+100%' : '0%'
  const pct = ((current - prev) / prev) * 100
  const sign = pct > 0 ? '+' : ''
  return `${sign}${pct.toFixed(0)}%`
}

export function MonthStats({ viewMonth, index, rates, jobColors, labels }: MonthStatsProps) {
  const curKey = monthKey(viewMonth)
  const prevKey = monthKey(addMonths(viewMonth, -1))
  const cur = monthJobMinutes(index.byMonth, curKey)
  const prev = monthJobMinutes(index.byMonth, prevKey)

  const rows = useMemo(() => {
    const ids = new Set<string>([...cur.keys(), ...prev.keys()])
    return [...ids]
      .map((jobId) => {
        const rate = rates.find((r) => r.id === jobId)
        const name = rate?.name ?? jobId
        const curM = cur.get(jobId) ?? 0
        const prevM = prev.get(jobId) ?? 0
        return { jobId, name, curM, prevM, delta: curM - prevM }
      })
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [cur, prev, rates])

  const curTotal = totalMinutes(cur)
  const prevTotal = totalMinutes(prev)
  const totalDelta = curTotal - prevTotal

  if (rows.length === 0 && curTotal === 0) {
    return (
      <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-4">
        <p className="text-sm font-semibold text-[#A1A1AA]">{labels.title}</p>
        <p className="mt-2 text-sm text-[#71717A]">—</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-4 sm:p-5">
      <p className="text-sm font-semibold text-[#A1A1AA]">{labels.title}</p>
      <p className="mt-0.5 text-xs text-[#71717A]">{labels.vsLastMonth}</p>
      <ul className="mt-4 space-y-3">
        {rows.map(({ jobId, name, curM, prevM, delta }) => {
          const color = jobColors.get(jobId) ?? '#C8E664'
          return (
            <li key={jobId} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-medium text-[#F4F4F5]">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="truncate">{name}</span>
                </p>
                <p className="mt-0.5 text-lg font-semibold tabular-nums text-[#C8E664]">
                  {formatPillHours(curM)}
                </p>
              </div>
              <div className="shrink-0 text-right text-xs tabular-nums">
                <p className={deltaClass(delta)}>{formatDeltaHours(delta)}</p>
                <p className={`mt-0.5 ${deltaClass(delta)}`}>
                  {formatPct(curM, prevM)}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
      <div className="mt-4 border-t border-[#27272A] pt-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-semibold text-[#A1A1AA]">{labels.total}</span>
          <span className="text-lg font-semibold tabular-nums text-[#F4F4F5]">
            {formatPillHours(curTotal)}
          </span>
        </div>
        <p className={`mt-1 text-right text-xs tabular-nums ${deltaClass(totalDelta)}`}>
          {formatDeltaHours(totalDelta)} · {formatPct(curTotal, prevTotal)}
        </p>
      </div>
    </div>
  )
}
