import {
  EMPTY_RATE,
  calcShift,
  computePeriod,
  periodInputFromDto,
  shiftKey,
  type CoeffSet,
  type HourKind,
  type JobTaxInfo,
  type PeriodResult,
  type PeriodShift,
  type PublicHoliday,
  type RateSnapshot,
  type ReportContext,
  type ReportPeriod,
  type ShiftDto,
  type ShiftResult,
  type TaxProfile,
} from '@my-pay/engine'
import type { PeriodPayload } from './api'
import { toCents, toDollars } from './rates'
import { toIsoDate, type PayCycle, type Period, type Shift, type ShiftPart } from './timesheet'

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

export function toReportContext(tax: TaxContext, holidays: PublicHoliday[] = []): ReportContext {
  return {
    jobs: tax.jobTax,
    profile: tax.profile,
    coeffSets: tax.coeffSets,
    holidays,
  }
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

function partFromDto(shift: ShiftDto): ShiftPart {
  return {
    checkIn: shift.checkIn,
    checkOut: shift.checkOut,
    breakMinutes: shift.breakMinutes,
    rateId: shift.jobId,
    publicHoliday: shift.publicHoliday,
    overtimeMinutes: shift.overtimeMinutes,
    rateSnapshot: shift.rate,
  }
}

/**
 * Prices a stored period in the browser. When a write included server totals
 * and they differ, the server figures are kept and the mismatch is logged.
 */
export function periodFromPayload(dto: PeriodPayload, ctx: ReportContext): Period {
  const result = computePeriod(periodInputFromDto(dto), ctx.jobs, ctx.profile, ctx.coeffSets, {
    holidays: ctx.holidays,
  })
  const server = dto.totals
  const diverged =
    server !== undefined &&
    (server.grossCents !== result.grossCents ||
      server.taxCents !== result.taxCents ||
      server.netCents !== result.netCents ||
      server.minutes !== result.minutes)
  if (diverged && server) {
    console.warn('Client pay totals differ from the server', dto.id, {
      client: {
        grossCents: result.grossCents,
        taxCents: result.taxCents,
        netCents: result.netCents,
        minutes: result.minutes,
      },
      server,
    })
  }
  const totals = diverged && server ? server : result
  const shifts: Record<string, Shift> = {}
  for (const shift of dto.shifts.filter((item) => item.part === 1)) shifts[shift.date] = partFromDto(shift)
  for (const shift of dto.shifts.filter((item) => item.part === 2)) {
    if (shifts[shift.date]) shifts[shift.date] = { ...shifts[shift.date], second: partFromDto(shift) }
  }
  return {
    id: dto.id,
    start: dto.startDate,
    end: dto.endDate,
    payCycle: dto.payCycle,
    shifts,
    actual: dto.actualCents === null ? undefined : toDollars(dto.actualCents),
    totals: {
      income: toDollars(totals.grossCents),
      tax: toDollars(totals.taxCents),
      net: toDollars(totals.netCents),
      minutes: totals.minutes,
    },
  }
}

export function toReportPeriod(period: Period): ReportPeriod {
  const shifts: PeriodShift[] = []
  for (const [iso, shift] of Object.entries(period.shifts)) {
    shifts.push(toEngineShift(iso, 1, shift, () => undefined, true))
    if (shift.second) shifts.push(toEngineShift(iso, 2, shift.second, () => undefined, true))
  }
  return {
    id: period.id,
    startDate: period.start,
    endDate: period.end,
    payCycle: period.payCycle ?? 'fortnightly',
    actualCents: period.actual === undefined ? null : toCents(period.actual),
    shifts,
  }
}

export { shiftKey }
