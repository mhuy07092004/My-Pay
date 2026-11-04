import { addDaysIso } from './dates'

/** A gazetted public holiday. `fromMinute` is null for a full day, or minutes from midnight when a part-day starts. */
export type PublicHoliday = { date: string; name: string; fromMinute: number | null }

export function minuteIsHoliday(
  holidays: PublicHoliday[],
  iso: string,
  minuteOfDay: number,
): boolean {
  return holidays.some(
    (h) => h.date === iso && (h.fromMinute === null || minuteOfDay >= h.fromMinute),
  )
}

export type RateSnapshot = {
  weekday: number
  night1: number
  night2: number
  saturday: number
  sunday: number
  publicHoliday: number
  otFirst2: number
  otAfter2: number
  otSunday: number
  otPublicHoliday: number
  overtimeEnabled: boolean
}

export const EMPTY_RATE: RateSnapshot = {
  weekday: 0,
  night1: 0,
  night2: 0,
  saturday: 0,
  sunday: 0,
  publicHoliday: 0,
  otFirst2: 0,
  otAfter2: 0,
  otSunday: 0,
  otPublicHoliday: 0,
  overtimeEnabled: false,
}

export type HourKind =
  | 'weekday'
  | 'night1'
  | 'night2'
  | 'saturday'
  | 'sunday'
  | 'publicHoliday'
  | 'otFirst2'
  | 'otAfter2'
  | 'otSunday'
  | 'otPublicHoliday'

export type ShiftInput = {
  /** ISO date YYYY-MM-DD the shift starts on. */
  date: string
  checkIn: string
  checkOut: string
  breakMinutes: number
  publicHoliday: boolean
  overtimeMinutes: number
  rate: RateSnapshot
}

export type ShiftLine = { kind: HourKind; minutes: number; rateCents: number }

export type ShiftResult = {
  cents: number
  minutes: number
  lines: ShiftLine[]
  /** Minutes billed at the "first 2 hours" overtime tier. */
  otFirst2Minutes: number
}

const DAY = 1440
export const FIRST_TIER_MINUTES = 120

export function roundHalfUpDiv(numerator: number, denominator: number): number {
  if (numerator < 0) return -roundHalfUpDiv(-numerator, denominator)
  return Math.floor((2 * numerator + denominator) / (2 * denominator))
}

export function timeToMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

/** Gross minutes between check-in and check-out (overnight adds 24h), before break. */
function spanMinutes(checkIn: string, checkOut: string): number {
  const a = timeToMinutes(checkIn)
  const b = timeToMinutes(checkOut)
  if (a === null || b === null) return 0
  let d = b - a
  if (d < 0) d += DAY
  return d
}

export function workedMinutes(
  s: Pick<ShiftInput, 'checkIn' | 'checkOut' | 'breakMinutes'>,
): number {
  return Math.max(spanMinutes(s.checkIn, s.checkOut) - Math.max(s.breakMinutes, 0), 0)
}

/** 0 = Sunday ... 6 = Saturday */
export function dayOfWeek(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

/**
 * Prices one shift.
 * - The unpaid break sits in the middle of the shift.
 * - Overtime is the last `overtimeMinutes` worked minutes.
 * - Minutes after midnight belong to the next calendar day.
 * - `first2Used` is how many minutes of the "first 2 hours" OT tier the same
 *   job already used on the same day (earlier shift).
 */
export function calcShift(
  shift: ShiftInput,
  first2Used = 0,
  holidays: PublicHoliday[] = [],
): ShiftResult {
  const start = timeToMinutes(shift.checkIn)
  const span = spanMinutes(shift.checkIn, shift.checkOut)
  const empty: ShiftResult = { cents: 0, minutes: 0, lines: [], otFirst2Minutes: 0 }
  if (start === null || span === 0) return empty

  const brk = Math.min(Math.max(shift.breakMinutes, 0), span)
  const worked = span - brk
  if (worked === 0) return empty

  const breakStart = Math.floor((span - brk) / 2)
  const ot = shift.rate.overtimeEnabled
    ? Math.min(Math.max(Math.round(shift.overtimeMinutes), 0), worked)
    : 0
  const baseDow = dayOfWeek(shift.date)
  const totals = new Map<HourKind, number>()
  const add = (kind: HourKind) => totals.set(kind, (totals.get(kind) ?? 0) + 1)

  let k = 0
  let first2 = first2Used
  for (let m = 0; m < span; m++) {
    if (m >= breakStart && m < breakStart + brk) continue
    const abs = start + m
    const dayOffset = Math.floor(abs / DAY)
    const dow = (baseDow + dayOffset) % 7
    const minuteOfDay = abs % DAY
    const holiday =
      shift.publicHoliday || minuteIsHoliday(holidays, addDaysIso(shift.date, dayOffset), minuteOfDay)
    const isOt = k >= worked - ot
    k++

    if (isOt) {
      if (holiday) add('otPublicHoliday')
      else if (dow === 0) add('otSunday')
      else if (first2 < FIRST_TIER_MINUTES) {
        first2++
        add('otFirst2')
      }       else add('otAfter2')
    } else if (holiday) add('publicHoliday')
    else if (dow === 6) add('saturday')
    else if (dow === 0) add('sunday')
    else if (minuteOfDay >= 22 * 60) add('night1')
    else if (minuteOfDay < 6 * 60) add('night2')
    else add('weekday')
  }

  const lines: ShiftLine[] = []
  let sum = 0
  for (const [kind, minutes] of totals) {
    const rateCents = shift.rate[kind]
    lines.push({ kind, minutes, rateCents })
    sum += minutes * rateCents
  }
  return {
    cents: roundHalfUpDiv(sum, 60),
    minutes: worked,
    lines,
    otFirst2Minutes: totals.get('otFirst2') ?? 0,
  }
}
