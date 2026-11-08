import {
  computePeriod,
  periodInputFromDto,
  type CoeffSet,
  type JobTaxInfo,
  type PeriodInput,
  type PeriodTotalsDto,
  type RateSnapshot,
  type RawPeriodDto,
  type ReportPeriod,
  type ShiftDto,
  type ShiftLine,
  type TaxProfile,
} from '@my-pay/engine'
import type { PublicHoliday } from '@my-pay/engine'
import type { Db } from '../deps'
import { check } from '../errors'
import { buildCoeffSets, holidayFromRow, hhmm, jobFromRow, taxProfileFromRow, type JobDto } from '../mappers'

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>

export type PayContext = {
  taxProfile: TaxProfile & { payCycle: 'weekly' | 'fortnightly' }
  jobs: JobDto[]
  jobTax: JobTaxInfo[]
  coeffSets: CoeffSet[]
  holidays: PublicHoliday[]
}

export type ShiftCalcDto = ShiftDto & {
  cents: number
  minutes: number
  lines: ShiftLine[]
}

export type PeriodDto = RawPeriodDto & {
  shifts: ShiftCalcDto[]
  totals: PeriodTotalsDto
}

const RULES_TTL_MS = 60 * 60 * 1000
let rulesCache: { at: number; sets: CoeffSet[] } | null = null

/** Test hook. Rules are public and identical for every user. */
export function clearRulesCache(): void {
  rulesCache = null
}

export async function loadRules(db: Db): Promise<CoeffSet[]> {
  const now = Date.now()
  if (rulesCache && now - rulesCache.at < RULES_TTL_MS) return rulesCache.sets
  const [w, l, o] = await Promise.all([
    db.from('tax_withholding_coefficients').select('*'),
    db.from('tax_study_loan_coefficients').select('*'),
    db.from('tax_offset_rates').select('*'),
  ])
  const sets = buildCoeffSets(check(w) ?? [], check(l) ?? [], check(o) ?? [])
  rulesCache = { at: now, sets }
  return sets
}

export async function loadContext(db: Db, userId: string): Promise<PayContext> {
  const profile = check(await db.from('profiles').select('state').eq('id', userId).maybeSingle())
  const state = profile?.state ?? 'NSW'
  const [tp, jobs, coeffSets, holidays] = await Promise.all([
    db.from('tax_profiles').select('*').eq('user_id', userId).maybeSingle(),
    db.from('jobs').select('*').order('created_at'),
    loadRules(db),
    db.from('public_holidays').select('holiday_date,name,starts_at').eq('state', state).order('holiday_date'),
  ])
  const jobDtos = (check(jobs) ?? []).map(jobFromRow)
  return {
    taxProfile: taxProfileFromRow(check(tp)),
    jobs: jobDtos,
    jobTax: jobDtos.map((j) => ({ id: j.id, claimsTaxFreeThreshold: j.claimsTaxFreeThreshold })),
    coeffSets,
    holidays: (check(holidays) ?? []).map(holidayFromRow),
  }
}

/** Reads every row of a query, paging past PostgREST's row cap. */
async function fetchAll(
  page: (from: number, to: number) => PromiseLike<{ data: any[] | null; error: any }>,
): Promise<Row[]> {
  const size = 1000
  const out: Row[] = []
  for (let from = 0; ; from += size) {
    const rows = check(await page(from, from + size - 1)) ?? []
    out.push(...rows)
    if (rows.length < size) return out
  }
}

export async function loadPeriodRows(db: Db, periodId?: string) {
  let pq = db.from('pay_periods').select('*').order('start_date', { ascending: false })
  if (periodId) pq = pq.eq('id', periodId)
  const periods = check(await pq) ?? []
  if (periods.length === 0) return { periods: [] as Row[], shifts: [] as Row[] }
  const shifts = await fetchAll((from, to) => {
    let q = db.from('shifts').select('*').order('work_date').order('part')
    if (periodId) q = q.eq('period_id', periodId)
    return q.range(from, to)
  })
  return { periods: periods as Row[], shifts }
}

export function rawPeriodFromRows(period: Row, shiftRows: Row[]): RawPeriodDto {
  const shifts: ShiftDto[] = shiftRows
    .filter((s) => s.period_id === period.id)
    .map((s) => ({
      date: s.work_date,
      part: s.part,
      jobId: s.job_id,
      checkIn: hhmm(s.check_in),
      checkOut: hhmm(s.check_out),
      breakMinutes: s.break_minutes,
      publicHoliday: Boolean(s.public_holiday),
      overtimeMinutes: s.overtime_minutes,
      rate: (s.rate_snapshot ?? {}) as RateSnapshot,
    }))
  return {
    id: period.id,
    startDate: period.start_date,
    endDate: period.end_date,
    payCycle: period.pay_cycle,
    actualCents: period.actual_net_cents ?? null,
    shifts,
  }
}

export function toPeriodInput(period: Row, shiftRows: Row[]): PeriodInput {
  return periodInputFromDto(rawPeriodFromRows(period, shiftRows))
}

export async function loadBootstrap(db: Db, user: { id: string; email?: string }) {
  const profileP = Promise.resolve(db.from('profiles').select('*').eq('id', user.id).maybeSingle())
  const holidaysP = profileP.then((profileRes) => {
    const profile = check(profileRes)
    const state = profile?.state ?? 'NSW'
    return db
      .from('public_holidays')
      .select('holiday_date,name,starts_at')
      .eq('state', state)
      .order('holiday_date')
  })
  const [profileRes, holidayRes, taxRes, jobsRes, periodsRes, shifts, coeffSets] = await Promise.all([
    profileP,
    holidaysP,
    db.from('tax_profiles').select('*').eq('user_id', user.id).maybeSingle(),
    db.from('jobs').select('*').order('created_at'),
    db.from('pay_periods').select('*').order('start_date', { ascending: false }),
    fetchAll((from, to) =>
      db.from('shifts').select('*').order('work_date').order('part').range(from, to),
    ),
    loadRules(db),
  ])
  const profile = check(profileRes)
  return {
    profile: {
      firstName: profile?.first_name ?? '',
      lastName: profile?.last_name ?? '',
      email: user.email ?? '',
      state: profile?.state ?? 'NSW',
    },
    taxProfile: taxProfileFromRow(check(taxRes)),
    jobs: (check(jobsRes) ?? []).map(jobFromRow),
    holidays: (check(holidayRes) ?? []).map(holidayFromRow),
    coeffSets,
    periods: ((check(periodsRes) ?? []) as Row[]).map((period) => rawPeriodFromRows(period, shifts)),
  }
}

export function toPeriodDto(period: Row, shiftRows: Row[], ctx: PayContext): PeriodDto {
  const raw = rawPeriodFromRows(period, shiftRows)
  const input = periodInputFromDto(raw)
  const res = computePeriod(input, ctx.jobTax, ctx.taxProfile, ctx.coeffSets, { holidays: ctx.holidays })
  return {
    ...raw,
    shifts: input.shifts.map((s) => {
      const calc = res.byShift[`${s.date}:${s.part}`]
      return { ...s, cents: calc.cents, minutes: calc.minutes, lines: calc.lines }
    }),
    totals: {
      grossCents: res.grossCents,
      taxCents: res.taxCents,
      netCents: res.netCents,
      minutes: res.minutes,
    },
  }
}

export function toReportPeriod(period: Row, shiftRows: Row[]): ReportPeriod {
  return {
    id: period.id,
    ...toPeriodInput(period, shiftRows),
    actualCents: period.actual_net_cents ?? null,
  }
}
