import {
  addDays,
  diffDays,
  eachDayInRange,
  toIsoDate,
  type Period,
  type Shift,
} from '../src/lib/timesheet'

export type Rate = {
  id: string
  name: string
  hourlyRate: number
}

export const MOCK_RATES: Rate[] = [
  { id: 'fast-food', name: 'Fast Food Industry', hourlyRate: 24.5 },
]

export const TAX_RATE = 0.1

const PATTERNS: Array<[string, string, number] | null> = [
  ['17:00', '23:00', 30],
  null,
  ['09:00', '15:30', 60],
  ['18:00', '23:30', 30],
  null,
  ['20:30', '02:15', 30],
  ['17:00', '23:00', 0],
]

function buildShifts(start: Date, end: Date): Record<string, Shift> {
  const shifts: Record<string, Shift> = {}
  eachDayInRange({ start, end }).forEach((day) => {
    const pattern = PATTERNS[diffDays(start, day) % PATTERNS.length]
    if (!pattern) return
    const [checkIn, checkOut, breakMinutes] = pattern
    shifts[toIsoDate(day)] = { checkIn, checkOut, breakMinutes, rateId: 'fast-food' }
  })
  return shifts
}

export function createSeedPeriods(): Period[] {
  const make = (
    start: Date,
    length: number,
    actual?: number,
  ): Period => {
    const end = addDays(start, length - 1)
    return {
      id: `seed-${toIsoDate(start)}`,
      start: toIsoDate(start),
      end: toIsoDate(end),
      shifts: buildShifts(start, end),
      actual,
    }
  }

  return [
    make(new Date(2026, 7, 1), 15, 987.7),
    make(new Date(2026, 7, 16), 16, 1028.6),
    make(new Date(2026, 8, 1), 15, 1158.42),
    make(new Date(2026, 8, 16), 15),
  ]
}
