import { MOCK_RATES, TAX_RATE } from '../../mock/timesheet'
import {
  addDays,
  parseIsoDate,
  periodTotals,
  startOfDay,
  toIsoDate,
  type Period,
  type Shift,
  type ShiftPart,
} from './timesheet'

const RATE_ID = MOCK_RATES[0].id

export type FeatureSample = {
  periods: Period[]
  featured: Period
  rateName: string
  hourlyRate: number
  taxRate: number
}

type Kind = 'full' | 'light' | 'short'

function part(checkIn: string, checkOut: string, breakMinutes: number): ShiftPart {
  return { checkIn, checkOut, breakMinutes, rateId: RATE_ID }
}

/** One fortnight. Null days are days off. Index 3 is two shifts; index 4 crosses midnight. */
const FORTNIGHT: Array<Shift | null> = [
  part('09:00', '17:00', 30),
  part('17:00', '23:00', 30),
  null,
  { ...part('09:00', '13:00', 0), second: part('17:00', '21:30', 0) },
  part('20:30', '02:00', 30),
  part('10:00', '18:00', 60),
  null,
  part('08:00', '16:00', 30),
  part('12:00', '20:00', 30),
  part('09:00', '15:30', 0),
  null,
  part('18:00', '23:30', 30),
  part('09:00', '17:30', 30),
  part('11:00', '19:00', 30),
]

const LIGHT_DAYS = new Set([0, 1, 5, 8])

function shiftsFor(start: Date, kind: Kind, today: Date): Record<string, Shift> {
  const shifts: Record<string, Shift> = {}
  FORTNIGHT.forEach((row, index) => {
    if (!row) return
    if (kind === 'short' && index !== 0) return
    if (kind === 'light' && !LIGHT_DAYS.has(index)) return
    const day = addDays(start, index)
    if (day > today) return
    shifts[toIsoDate(day)] = row
  })
  return shifts
}

function makePeriod(start: Date, kind: Kind, today: Date, delta: number | null): Period {
  const end = addDays(start, 13)
  const period: Period = {
    id: `sample-${toIsoDate(start)}`,
    start: toIsoDate(start),
    end: toIsoDate(end),
    shifts: shiftsFor(start, kind, today),
  }
  if (delta !== null) {
    const income = periodTotals(period, () => MOCK_RATES[0].hourlyRate, TAX_RATE).income
    period.actual = Math.round((income + delta) * 100) / 100
  }
  return period
}

function kindFor(month: number, day: number): Kind {
  if (month === 0 && day === 1) return 'short'
  if (month === 6) return 'full'
  if (day === 15) return 'light'
  return 'full'
}

/** Closed fortnights from January, plus the open one that contains today. */
export function buildFeatureSample(today: Date): FeatureSample {
  const now = startOfDay(today)
  const periods: Period[] = []

  for (let month = 0; month <= now.getMonth(); month++) {
    for (const day of [1, 15]) {
      const start = startOfDay(new Date(now.getFullYear(), month, day))
      if (start > now) continue
      const end = addDays(start, 13)
      const open = end >= now
      const kind = kindFor(month, day)
      const delta = open ? null : kind === 'short' ? -15 : month === 6 ? 25 : -6.4
      periods.push(makePeriod(start, kind, now, delta))
    }
  }

  const closed = periods.filter((period) => period.actual !== undefined)
  const featuredSource = closed[closed.length - 1] ?? periods[periods.length - 1]
  const featured = makePeriod(parseIsoDate(featuredSource.start), 'full', now, -18.5)
  const featuredIndex = periods.findIndex((period) => period.id === featured.id)
  if (featuredIndex >= 0) periods[featuredIndex] = featured

  return {
    periods,
    featured,
    rateName: MOCK_RATES[0].name,
    hourlyRate: MOCK_RATES[0].hourlyRate,
    taxRate: TAX_RATE,
  }
}
