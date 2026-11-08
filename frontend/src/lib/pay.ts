import {
  EMPTY_RATE,
  calcShift,
  computePeriod,
  shiftKey,
  type CoeffSet,
  type HourKind,
  type JobTaxInfo,
  type PeriodResult,
  type PeriodShift,
  type PublicHoliday,
  type RateSnapshot,
  type ShiftResult,
  type TaxProfile,
} from '@my-pay/engine'
import { toIsoDate, type PayCycle, type Shift, type ShiftPart } from './timesheet'

export type RateLookup = (rateId: string) => RateSnapshot | undefined

/** `useSnapshot`: price a saved shift with the rates frozen when it was saved. */
function rateFor(part: ShiftPart, rateOf: RateLookup, useSnapshot: boolean): RateSnapshot {
  return (useSnapshot ? part.rateSnapshot : undefined) ?? rateOf(part.rateId) ?? EMPTY_RATE
}

export function toEngineShift(
  isoDate: string,
  partNo: 1 | 2,
  part: ShiftPart,
  rateOf: RateLookup,
  useSnapshot: boolean,
): PeriodShift {
  return {
    date: isoDate,
    part: partNo,
    jobId: part.rateId,
    checkIn: part.checkIn,
    checkOut: part.checkOut,
    breakMinutes: part.breakMinutes,
    publicHoliday: part.publicHoliday ?? false,
    overtimeMinutes: part.overtimeMinutes ?? 0,
    rate: rateFor(part, rateOf, useSnapshot),
  }
}

/** Prices the one or two shifts of a day. Results are in cents. */
export function calcDay(
  isoDate: string,
  shift: Shift,
  rateOf: RateLookup,
  useSnapshot: boolean,
  holidays: PublicHoliday[] = [],
): { parts: ShiftResult[]; cents: number; minutes: number } {
  const parts = shift.second ? [shift, shift.second] : [shift]
  const first2 = new Map<string, number>()
  const results = parts.map((part, i) => {
    const s = toEngineShift(isoDate, (i + 1) as 1 | 2, part, rateOf, useSnapshot)
    const res = calcShift(s, first2.get(s.jobId) ?? 0, holidays)
    first2.set(s.jobId, (first2.get(s.jobId) ?? 0) + res.otFirst2Minutes)
    return res
  })
  return {
    parts: results,
    cents: results.reduce((sum, r) => sum + r.cents, 0),
    minutes: results.reduce((sum, r) => sum + r.minutes, 0),
  }
}

export type TaxContext = {
  jobTax: JobTaxInfo[]
  profile: TaxProfile
  coeffSets: CoeffSet[]
}

/** Live estimate for the shifts in an editor (saved shifts use their snapshot). */
export function estimateShifts(
  range: { start: Date; end: Date },
  payCycle: PayCycle,
  shifts: Record<string, Shift>,
  rateOf: RateLookup,
  tax: TaxContext,
  holidays: PublicHoliday[] = [],
): PeriodResult {
  const engineShifts: PeriodShift[] = []
  for (const [iso, shift] of Object.entries(shifts)) {
    engineShifts.push(toEngineShift(iso, 1, shift, rateOf, true))
    if (shift.second) engineShifts.push(toEngineShift(iso, 2, shift.second, rateOf, true))
  }
  return computePeriod(
    {
      startDate: toIsoDate(range.start),
      endDate: toIsoDate(range.end),
      payCycle,
      shifts: engineShifts,
    },
    tax.jobTax,
    tax.profile,
    tax.coeffSets,
    { holidays },
  )
}

/** Payslip row order. Zero-minute kinds are omitted by the summary. */
export const SUMMARY_KINDS: HourKind[] = [
  'weekday',
  'night1',
  'night2',
  'saturday',
  'sunday',
  'publicHoliday',
  'otFirst2',
  'otAfter2',
  'otSunday',
  'otPublicHoliday',
]

export type RateHours = {
  rateId: string
  minutes: number
  byKind: Partial<Record<HourKind, number>>
}

/** Worked minutes per rate, split by hour kind, for the payslip check. */
export function hoursByRate(shifts: Record<string, Shift>, estimate: PeriodResult): RateHours[] {
  const grouped = new Map<string, RateHours>()
  for (const iso of Object.keys(shifts).sort()) {
    const shift = shifts[iso]
    const parts: Array<[1 | 2, ShiftPart]> = [[1, shift]]
    if (shift.second) parts.push([2, shift.second])
    for (const [partNo, part] of parts) {
      const calc = estimate.byShift[shiftKey(iso, partNo)]
      if (!calc) continue
      let row = grouped.get(part.rateId)
      if (!row) {
        row = { rateId: part.rateId, minutes: 0, byKind: {} }
        grouped.set(part.rateId, row)
      }
      for (const line of calc.lines) {
        row.byKind[line.kind] = (row.byKind[line.kind] ?? 0) + line.minutes
        row.minutes += line.minutes
      }
    }
  }
  return [...grouped.values()]
}

export { shiftKey }
