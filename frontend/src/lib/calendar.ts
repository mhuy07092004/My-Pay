import { paydaysBetween, type PaySchedule } from '@my-pay/engine'
import type { SavedRate } from './rates'
import {
  calcShiftMinutes,
  compareStart,
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

export type DayPartDetail = ShiftPart & { minutes: number; periodId: string }

export type DayEntry = {
  /** Earliest start first. */
  parts: DayPartDetail[]
  /** In the order each job first starts that day. */
  byJob: JobHours[]
}

export type PaydayMark = {
  jobId: string
  paymentDate: string
  startDate: string
  endDate: string
  periodId?: string
  gross: number
  tax: number
  net: number
  projected: boolean
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
  return [...map.entries()].map(([jobId, minutes]) => ({ jobId, minutes }))
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
      const parts: DayPartDetail[] = partsOfShift(shift).map((part) => ({
        ...part,
        minutes: calcShiftMinutes(part),
        periodId: period.id,
      }))
      const existing = byDate.get(iso)
      const merged = [...(existing?.parts ?? []), ...parts].sort(compareStart)
      byDate.set(iso, { parts: merged, byJob: aggregateByJob(merged) })
      addMonthMinutes(byMonth, iso, aggregateByJob(parts))
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

function scheduleOf(rate: SavedRate): PaySchedule | null {
  if (!rate.scheduleStart || !rate.payDate) return null
  return { payCycle: rate.payCycle, startDate: rate.scheduleStart, payDate: rate.payDate }
}

/**
 * Saved and upcoming paydays whose payment date falls in [from, to]. Periods without shifts
 * are projected only from the schedule start on, and only while their payday is not past.
 */
export function paydaysInRange(
  rates: SavedRate[],
  periods: Period[],
  from: string,
  to: string,
  today: string,
): PaydayMark[] {
  const marks: PaydayMark[] = []
  for (const rate of rates) {
    if (rate.archived) continue
    const schedule = scheduleOf(rate)
    if (!schedule) continue
    for (const bounds of paydaysBetween(schedule, from, to)) {
      const saved = periods.find(
        (period) =>
          period.jobId === rate.id && period.start === bounds.startDate && period.end === bounds.endDate,
      )
      if (!saved && (bounds.startDate < schedule.startDate || bounds.paymentDate < today)) continue
      marks.push({
        jobId: rate.id,
        paymentDate: bounds.paymentDate,
        startDate: bounds.startDate,
        endDate: bounds.endDate,
        periodId: saved?.id,
        gross: saved?.totals?.income ?? 0,
        tax: saved?.totals?.tax ?? 0,
        net: saved?.totals?.net ?? 0,
        projected: saved === undefined,
      })
    }
  }
  for (const period of periods) {
    if (period.paymentDate < from || period.paymentDate > to) continue
    if (marks.some((mark) => mark.periodId === period.id)) continue
    marks.push({
      jobId: period.jobId,
      paymentDate: period.paymentDate,
      startDate: period.start,
      endDate: period.end,
      periodId: period.id,
      gross: period.totals?.income ?? 0,
      tax: period.totals?.tax ?? 0,
      net: period.totals?.net ?? 0,
      projected: false,
    })
  }
  return marks.sort(
    (a, b) => a.paymentDate.localeCompare(b.paymentDate) || a.jobId.localeCompare(b.jobId),
  )
}
