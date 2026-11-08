import type { SavedRate } from './rates'
import {
  calcShiftMinutes,
  toIsoDate,
  type Period,
  type Shift,
  type ShiftPart,
} from './timesheet'

export const JOB_COLORS = [
  '#C8E664',
  '#7DD3FC',
  '#C4B5FD',
  '#FCD34D',
  '#F9A8D4',
  '#5EEAD4',
] as const

export type JobHours = { jobId: string; minutes: number }

export type DayPartDetail = ShiftPart & { minutes: number }

export type DayEntry = {
  periodId: string
  shift: Shift
  parts: DayPartDetail[]
  byJob: JobHours[]
}

export type ShiftIndex = {
  byDate: Map<string, DayEntry>
  byMonth: Map<string, Map<string, number>>
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}

export function monthKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function parseMonthKey(key: string): Date | null {
  const match = /^(\d{4})-(\d{2})$/.exec(key)
  if (!match) return null
  const y = Number(match[1])
  const m = Number(match[2])
  if (m < 1 || m > 12) return null
  return new Date(y, m - 1, 1)
}

export function buildMonthGrid(month: Date): Date[] {
  const first = startOfMonth(month)
  const offset = (first.getDay() + 6) % 7
  const gridStart = new Date(first.getFullYear(), first.getMonth(), 1 - offset)
  return Array.from({ length: 42 }, (_, i) =>
    new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i),
  )
}

function partsOfShift(shift: Shift): ShiftPart[] {
  return shift.second ? [shift, shift.second] : [shift]
}

function aggregateByJob(parts: DayPartDetail[]): JobHours[] {
  const map = new Map<string, number>()
  for (const part of parts) {
    map.set(part.rateId, (map.get(part.rateId) ?? 0) + part.minutes)
  }
  return [...map.entries()]
    .map(([jobId, minutes]) => ({ jobId, minutes }))
    .sort((a, b) => a.jobId.localeCompare(b.jobId))
}

function addMonthMinutes(
  byMonth: Map<string, Map<string, number>>,
  iso: string,
  byJob: JobHours[],
) {
  const key = iso.slice(0, 7)
  let row = byMonth.get(key)
  if (!row) {
    row = new Map()
    byMonth.set(key, row)
  }
  for (const { jobId, minutes } of byJob) {
    row.set(jobId, (row.get(jobId) ?? 0) + minutes)
  }
}

export function indexShifts(periods: Period[]): ShiftIndex {
  const byDate = new Map<string, DayEntry>()
  const byMonth = new Map<string, Map<string, number>>()

  for (const period of periods) {
    for (const [iso, shift] of Object.entries(period.shifts)) {
      if (!shift) continue
      const raw = partsOfShift(shift)
      const parts: DayPartDetail[] = raw.map((part) => ({
        ...part,
        minutes: calcShiftMinutes(part),
      }))
      const byJob = aggregateByJob(parts)
      byDate.set(iso, { periodId: period.id, shift, parts, byJob })
      addMonthMinutes(byMonth, iso, byJob)
    }
  }

  return { byDate, byMonth }
}

export function jobColorMap(rates: SavedRate[]): Map<string, string> {
  const map = new Map<string, string>()
  rates.forEach((rate, i) => {
    map.set(rate.id, JOB_COLORS[i % JOB_COLORS.length])
  })
  return map
}

export function formatPillHours(minutes: number): string {
  const hours = minutes / 60
  if (Number.isInteger(hours)) return `${hours}h`
  const one = Math.round(hours * 10) / 10
  return `${one}h`
}

export function monthJobMinutes(
  byMonth: Map<string, Map<string, number>>,
  key: string,
): Map<string, number> {
  return byMonth.get(key) ?? new Map()
}

export function totalMinutes(map: Map<string, number>): number {
  let sum = 0
  for (const m of map.values()) sum += m
  return sum
}

export function jobIdsInMonth(
  byMonth: Map<string, Map<string, number>>,
  key: string,
): Set<string> {
  return new Set((byMonth.get(key) ?? new Map()).keys())
}

export function dayGradient(colors: string[]): string {
  if (colors.length === 0) return 'transparent'
  if (colors.length === 1) return colors[0]
  return `linear-gradient(135deg, ${colors[0]} 50%, ${colors[1]} 50%)`
}

export function isoFromDate(date: Date): string {
  return toIsoDate(date)
}
