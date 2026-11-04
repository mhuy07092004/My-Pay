import { calcShift, type PublicHoliday, type RateSnapshot, type ShiftLine } from './pay'
import { withholdCents, type CoeffSet, type PayCycle, type TaxScale } from './tax'

export type Residency = 'resident' | 'foreign'
export type MedicareVariation = 'none' | 'full' | 'half'

export type TaxProfile = {
  residency: Residency
  studyLoan: boolean
  annualOffsetCents: number
  medicareVariation: MedicareVariation
}

export const DEFAULT_TAX_PROFILE: TaxProfile = {
  residency: 'resident',
  studyLoan: false,
  annualOffsetCents: 0,
  medicareVariation: 'none',
}

export type PeriodShift = {
  date: string
  part: 1 | 2
  jobId: string
  checkIn: string
  checkOut: string
  breakMinutes: number
  publicHoliday: boolean
  overtimeMinutes: number
  rate: RateSnapshot
}

export type PeriodInput = {
  startDate: string
  endDate: string
  payCycle: PayCycle
  shifts: PeriodShift[]
}

export type JobTaxInfo = { id: string; claimsTaxFreeThreshold: boolean }

export type ShiftCalc = {
  cents: number
  minutes: number
  lines: ShiftLine[]
}

export type JobTotals = {
  grossCents: number
  taxCents: number
  minutes: number
  scale: TaxScale
}

export type PeriodResult = {
  grossCents: number
  taxCents: number
  netCents: number
  minutes: number
  byJob: Record<string, JobTotals>
  byDay: Record<string, { grossCents: number; minutes: number }>
  byShift: Record<string, ShiftCalc>
}

export function shiftKey(date: string, part: number): string {
  return `${date}:${part}`
}

export function scaleFor(
  profile: TaxProfile,
  claimsTaxFreeThreshold: boolean,
): TaxScale {
  if (profile.residency === 'foreign') return 3
  if (!claimsTaxFreeThreshold) return 1
  if (profile.medicareVariation === 'full') return 5
  if (profile.medicareVariation === 'half') return 6
  return 2
}

/** Coefficient set with the latest effective_from <= date, else the earliest. */
export function pickCoeffSet(sets: CoeffSet[], paymentDate: string): CoeffSet {
  if (sets.length === 0) throw new Error('No tax coefficient sets loaded')
  const sorted = [...sets].sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom))
  let chosen = sorted[0]
  for (const s of sorted) if (s.effectiveFrom <= paymentDate) chosen = s
  return chosen
}

/**
 * Gross, estimated PAYG withholding and net for a pay period. Tax is worked
 * out per job: the scale follows residency, the tax-free-threshold claim and
 * the Medicare variation. Coefficients are the set in force on the period's
 * end date (the payment date). `upTo` ignores shifts after that date.
 */
export function computePeriod(
  period: PeriodInput,
  jobs: JobTaxInfo[],
  profile: TaxProfile,
  coeffSets: CoeffSet[],
  opts: { upTo?: string; holidays?: PublicHoliday[] } = {},
): PeriodResult {
  const coeffs = pickCoeffSet(coeffSets, period.endDate)
  const claims = new Map(jobs.map((j) => [j.id, j.claimsTaxFreeThreshold]))
  const shifts = period.shifts
    .filter((s) => !opts.upTo || s.date <= opts.upTo)
    .sort((a, b) => a.date.localeCompare(b.date) || a.part - b.part)

  const byShift: PeriodResult['byShift'] = {}
  const byDay: PeriodResult['byDay'] = {}
  const jobGross = new Map<string, { grossCents: number; minutes: number }>()
  const first2Used = new Map<string, number>()

  for (const s of shifts) {
    const tierKey = `${s.date}|${s.jobId}`
    const res = calcShift(s, first2Used.get(tierKey) ?? 0, opts.holidays ?? [])
    first2Used.set(tierKey, (first2Used.get(tierKey) ?? 0) + res.otFirst2Minutes)
    byShift[shiftKey(s.date, s.part)] = {
      cents: res.cents,
      minutes: res.minutes,
      lines: res.lines,
    }
    const day = byDay[s.date] ?? { grossCents: 0, minutes: 0 }
    day.grossCents += res.cents
    day.minutes += res.minutes
    byDay[s.date] = day
    const job = jobGross.get(s.jobId) ?? { grossCents: 0, minutes: 0 }
    job.grossCents += res.cents
    job.minutes += res.minutes
    jobGross.set(s.jobId, job)
  }

  const byJob: Record<string, JobTotals> = {}
  let grossCents = 0
  let taxCents = 0
  let minutes = 0
  for (const [jobId, g] of jobGross) {
    const claim = claims.get(jobId) ?? false
    const scale = scaleFor(profile, claim)
    const tax = withholdCents({
      grossCents: g.grossCents,
      cycle: period.payCycle,
      scale,
      studyLoan: profile.studyLoan,
      annualOffsetCents: profile.annualOffsetCents,
      coeffs,
    })
    byJob[jobId] = { ...g, taxCents: tax, scale }
    grossCents += g.grossCents
    taxCents += tax
    minutes += g.minutes
  }

  return {
    grossCents,
    taxCents,
    netCents: grossCents - taxCents,
    minutes,
    byJob,
    byDay,
    byShift,
  }
}
