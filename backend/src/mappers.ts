import type { CoeffSet, CoeffRow, PublicHoliday, RateSnapshot, TaxProfile } from '@my-pay/engine'

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>

export const RATE_COLUMNS = {
  weekday: 'weekday_cents',
  night1: 'night1_cents',
  night2: 'night2_cents',
  saturday: 'saturday_cents',
  sunday: 'sunday_cents',
  publicHoliday: 'public_holiday_cents',
  otFirst2: 'ot_first2_cents',
  otAfter2: 'ot_after2_cents',
  otSunday: 'ot_sunday_cents',
  otPublicHoliday: 'ot_public_holiday_cents',
} as const

export type RateCents = Omit<RateSnapshot, 'overtimeEnabled'>

export function rateFromRow(row: Row): RateSnapshot {
  const rate = { overtimeEnabled: Boolean(row.overtime_enabled) } as RateSnapshot
  for (const [key, col] of Object.entries(RATE_COLUMNS)) {
    ;(rate as Record<string, unknown>)[key] = Number(row[col] ?? 0)
  }
  return rate
}

export function rateToColumns(rate: RateCents): Row {
  const out: Row = {}
  for (const [key, col] of Object.entries(RATE_COLUMNS)) {
    out[col] = rate[key as keyof RateCents]
  }
  return out
}

export type JobDto = {
  id: string
  name: string
  kind: 'preset' | 'custom'
  status: string
  level: string
  age: string
  claimsTaxFreeThreshold: boolean
  archived: boolean
  rate: RateSnapshot
}

export function jobFromRow(row: Row): JobDto {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    status: row.status,
    level: row.level,
    age: row.age,
    claimsTaxFreeThreshold: Boolean(row.claims_tax_free_threshold),
    archived: row.archived_at != null,
    rate: rateFromRow(row),
  }
}

export function taxProfileFromRow(row: Row | null): TaxProfile & { payCycle: 'weekly' | 'fortnightly' } {
  return {
    residency: row?.residency ?? 'resident',
    studyLoan: Boolean(row?.study_loan),
    annualOffsetCents: Number(row?.annual_offset_cents ?? 0),
    medicareVariation: row?.medicare_variation ?? 'none',
    payCycle: row?.pay_cycle ?? 'fortnightly',
  }
}

export const hhmm = (t: string): string => String(t).slice(0, 5)

export const AU_STATES = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT'] as const
export type AuState = (typeof AU_STATES)[number]

export function holidayFromRow(row: Row): PublicHoliday {
  const clock = row.starts_at ? String(row.starts_at).slice(0, 5) : null
  const fromMinute = clock
    ? Number(clock.slice(0, 2)) * 60 + Number(clock.slice(3, 5))
    : null
  return { date: row.holiday_date, name: row.name, fromMinute }
}

function coeffRows(rows: Row[]): CoeffRow[] {
  return [...rows]
    .sort((a, b) => a.seq - b.seq)
    .map((r) => ({ lt: r.lt === null ? null : Number(r.lt), a: String(r.a), b: String(r.b) }))
}

/** Builds engine coefficient sets (one per effective_from) from the rule tables. */
export function buildCoeffSets(withholding: Row[], loans: Row[], offsets: Row[]): CoeffSet[] {
  const dates = new Set<string>(withholding.map((r) => r.effective_from))
  const sets: CoeffSet[] = []
  for (const date of [...dates].sort()) {
    const scales: Record<string, CoeffRow[]> = {}
    for (const scale of new Set(withholding.filter((r) => r.effective_from === date).map((r) => r.scale))) {
      scales[String(scale)] = coeffRows(
        withholding.filter((r) => r.effective_from === date && r.scale === scale),
      )
    }
    const loan = (tbl: string) =>
      coeffRows(loans.filter((r) => r.effective_from === date && r.tbl === tbl))
    const offsetRates = {} as CoeffSet['offsetRates']
    for (const o of offsets.filter((r) => r.effective_from === date)) {
      offsetRates[o.cycle as keyof CoeffSet['offsetRates']] = String(o.rate)
    }
    sets.push({ effectiveFrom: date, scales, loanA: loan('A'), loanB: loan('B'), offsetRates })
  }
  return sets
}
