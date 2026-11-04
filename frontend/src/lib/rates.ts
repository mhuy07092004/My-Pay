import type { RateSnapshot } from '@my-pay/engine'

export type Status = 'fullTime' | 'partTime' | 'casual'

export const STATUS_OPTIONS: Status[] = ['fullTime', 'partTime', 'casual']
export const LEVEL_OPTIONS = ['1', '2', '3'] as const

/** Pay rates in dollars per hour, as shown in the rate form. */
export type OrdinaryPay = {
  weekday: number
  night1: number
  night2: number
  saturday: number
  sunday: number
  publicHoliday: number
}

export type OvertimePay = {
  first2: number
  after2: number
  sunday: number
  publicHoliday: number
}

export type PayRates = { ordinary: OrdinaryPay; overtime: OvertimePay }

export type SavedRate = {
  /** Job id from the database. */
  id: string
  name: string
  pay: PayRates
  overtimeEnabled: boolean
  kind: 'preset' | 'custom'
  status: string
  level: string
  age: string
  claimsTaxFreeThreshold: boolean
  /** Set when the job was hidden because shifts still use it. */
  archived?: boolean
}

export const PRESET_ID = 'fast-food'
export const CUSTOM_ID = 'custom'

export const EMPTY_PAY: PayRates = {
  ordinary: { weekday: 0, night1: 0, night2: 0, saturday: 0, sunday: 0, publicHoliday: 0 },
  overtime: { first2: 0, after2: 0, sunday: 0, publicHoliday: 0 },
}

export const toCents = (dollars: number) => Math.round(dollars * 100)
export const toDollars = (cents: number) => cents / 100

/** API job (cents) -> UI rate (dollars). */
export type JobDto = {
  id: string
  name: string
  kind: 'preset' | 'custom'
  status: string
  level: string
  age: string
  claimsTaxFreeThreshold: boolean
  archived?: boolean
  rate: RateSnapshot
}

export function payFromSnapshot(r: RateSnapshot): PayRates {
  return {
    ordinary: {
      weekday: toDollars(r.weekday),
      night1: toDollars(r.night1),
      night2: toDollars(r.night2),
      saturday: toDollars(r.saturday),
      sunday: toDollars(r.sunday),
      publicHoliday: toDollars(r.publicHoliday),
    },
    overtime: {
      first2: toDollars(r.otFirst2),
      after2: toDollars(r.otAfter2),
      sunday: toDollars(r.otSunday),
      publicHoliday: toDollars(r.otPublicHoliday),
    },
  }
}

export function savedRateFromJob(job: JobDto): SavedRate {
  return {
    id: job.id,
    name: job.name,
    pay: payFromSnapshot(job.rate),
    overtimeEnabled: job.rate.overtimeEnabled,
    kind: job.kind,
    status: job.status,
    level: job.level,
    age: job.age,
    claimsTaxFreeThreshold: job.claimsTaxFreeThreshold,
    archived: job.archived ?? false,
  }
}

/** UI rate -> engine snapshot (cents). */
export function snapshotFromRate(rate: Pick<SavedRate, 'pay' | 'overtimeEnabled'>): RateSnapshot {
  const { ordinary: o, overtime: ot } = rate.pay
  return {
    weekday: toCents(o.weekday),
    night1: toCents(o.night1),
    night2: toCents(o.night2),
    saturday: toCents(o.saturday),
    sunday: toCents(o.sunday),
    publicHoliday: toCents(o.publicHoliday),
    otFirst2: toCents(ot.first2),
    otAfter2: toCents(ot.after2),
    otSunday: toCents(ot.sunday),
    otPublicHoliday: toCents(ot.publicHoliday),
    overtimeEnabled: rate.overtimeEnabled,
  }
}

/** Request body for POST/PATCH /api/jobs. */
export function jobBodyFromRate(rate: Omit<SavedRate, 'id'>) {
  const { overtimeEnabled: _enabled, ...cents } = snapshotFromRate(rate)
  void _enabled
  return {
    name: rate.name,
    kind: rate.kind,
    status: rate.status,
    level: rate.level,
    age: rate.age,
    overtimeEnabled: rate.overtimeEnabled,
    claimsTaxFreeThreshold: rate.claimsTaxFreeThreshold,
    rate: cents,
  }
}
