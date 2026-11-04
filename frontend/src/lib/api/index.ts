import type {
  CoeffSet,
  IncomeSeriesDto,
  MedicareVariation,
  PublicHoliday,
  RateSnapshot,
  Residency,
  ReportStatsDto,
} from '@my-pay/engine'
import { jobBodyFromRate, savedRateFromJob, toDollars, type JobDto, type SavedRate } from '../rates'
import type { PayCycle, Period, Shift, ShiftPart } from '../timesheet'
import { api } from './client'

export { ApiError } from './client'

/* ------------------------------------------------------------------ profile */
export const AU_STATES = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT'] as const
export type AuState = (typeof AU_STATES)[number]

export type Profile = { firstName: string; lastName: string; email: string; state: AuState }

export async function getProfile(): Promise<Profile> {
  return (await api<{ profile: Profile }>('/me')).profile
}

export async function updateProfile(
  body: Pick<Profile, 'firstName' | 'lastName' | 'state'>,
): Promise<Profile> {
  return (await api<{ profile: Profile }>('/me', { method: 'PATCH', body })).profile
}

export async function getHolidays(): Promise<PublicHoliday[]> {
  return (await api<{ holidays: PublicHoliday[] }>('/holidays')).holidays
}

export type TaxProfileDto = {
  residency: Residency
  studyLoan: boolean
  annualOffsetCents: number
  medicareVariation: MedicareVariation
  payCycle: PayCycle
}

export const DEFAULT_TAX_PROFILE_DTO: TaxProfileDto = {
  residency: 'resident',
  studyLoan: false,
  annualOffsetCents: 0,
  medicareVariation: 'none',
  payCycle: 'fortnightly',
}

export async function getTaxProfile(): Promise<TaxProfileDto> {
  return (await api<{ taxProfile: TaxProfileDto }>('/tax-profile')).taxProfile
}

export async function saveTaxProfile(body: TaxProfileDto): Promise<TaxProfileDto> {
  return (await api<{ taxProfile: TaxProfileDto }>('/tax-profile', { method: 'PUT', body })).taxProfile
}

export async function getRules(): Promise<CoeffSet[]> {
  return (await api<{ coeffSets: CoeffSet[] }>('/rules')).coeffSets
}

/* --------------------------------------------------------------------- jobs */
export async function listJobs(includeArchived = false): Promise<SavedRate[]> {
  const query = includeArchived ? '?archived=1' : ''
  return (await api<{ jobs: JobDto[] }>(`/jobs${query}`)).jobs.map(savedRateFromJob)
}

export async function createJob(rate: Omit<SavedRate, 'id'>): Promise<SavedRate> {
  const { job } = await api<{ job: JobDto }>('/jobs', { method: 'POST', body: jobBodyFromRate(rate) })
  return savedRateFromJob(job)
}

export async function updateJob(rate: SavedRate): Promise<SavedRate> {
  const { job } = await api<{ job: JobDto }>(`/jobs/${rate.id}`, {
    method: 'PATCH',
    body: jobBodyFromRate(rate),
  })
  return savedRateFromJob(job)
}

export async function deleteJob(id: string): Promise<void> {
  await api(`/jobs/${id}`, { method: 'DELETE' })
}

export async function getAwardRate(
  status: string,
  level: string,
  age: number,
): Promise<SavedRate['pay']> {
  const { rate } = await api<{ rate: RateSnapshot }>(
    `/award-rates?status=${status}&level=${level}&age=${age}`,
  )
  return savedRateFromJob({
    id: '',
    name: '',
    kind: 'preset',
    status,
    level,
    age: String(age),
    claimsTaxFreeThreshold: false,
    rate,
  }).pay
}

/* ------------------------------------------------------------------ periods */
type ShiftDto = {
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

type PeriodDto = {
  id: string
  startDate: string
  endDate: string
  payCycle: PayCycle
  actualCents: number | null
  shifts: ShiftDto[]
  totals: { grossCents: number; taxCents: number; netCents: number; minutes: number }
}

function partFromDto(s: ShiftDto): ShiftPart {
  return {
    checkIn: s.checkIn,
    checkOut: s.checkOut,
    breakMinutes: s.breakMinutes,
    rateId: s.jobId,
    publicHoliday: s.publicHoliday,
    overtimeMinutes: s.overtimeMinutes,
    rateSnapshot: s.rate,
  }
}

function periodFromDto(dto: PeriodDto): Period {
  const shifts: Record<string, Shift> = {}
  for (const s of dto.shifts.filter((x) => x.part === 1)) shifts[s.date] = partFromDto(s)
  for (const s of dto.shifts.filter((x) => x.part === 2)) {
    if (shifts[s.date]) shifts[s.date] = { ...shifts[s.date], second: partFromDto(s) }
  }
  return {
    id: dto.id,
    start: dto.startDate,
    end: dto.endDate,
    payCycle: dto.payCycle,
    shifts,
    actual: dto.actualCents === null ? undefined : toDollars(dto.actualCents),
    totals: {
      income: toDollars(dto.totals.grossCents),
      tax: toDollars(dto.totals.taxCents),
      net: toDollars(dto.totals.netCents),
    },
  }
}

export async function listPeriods(): Promise<Period[]> {
  return (await api<{ periods: PeriodDto[] }>('/periods')).periods.map(periodFromDto)
}

function shiftPayload(shift: Shift) {
  const parts = shift.second ? [shift, shift.second] : [shift]
  return parts.map((p) => ({
    jobId: p.rateId,
    checkIn: p.checkIn,
    checkOut: p.checkOut,
    breakMinutes: p.breakMinutes,
    publicHoliday: p.publicHoliday ?? false,
    overtimeMinutes: p.overtimeMinutes ?? 0,
  }))
}

export async function createPeriod(
  startDate: string,
  endDate: string,
  shifts: Record<string, Shift>,
): Promise<Period> {
  const { period } = await api<{ period: PeriodDto }>('/periods', {
    method: 'POST',
    body: {
      startDate,
      endDate,
      days: Object.entries(shifts).map(([date, shift]) => ({ date, shifts: shiftPayload(shift) })),
    },
  })
  return periodFromDto(period)
}

export async function deletePeriod(id: string): Promise<void> {
  await api(`/periods/${id}`, { method: 'DELETE' })
}

export async function saveDay(periodId: string, isoDate: string, shift: Shift | null): Promise<Period> {
  const { period } = await api<{ period: PeriodDto }>(`/periods/${periodId}/days/${isoDate}`, {
    method: 'PUT',
    body: { shifts: shift ? shiftPayload(shift) : [] },
  })
  return periodFromDto(period)
}

export async function saveActual(periodId: string, dollars: number | undefined): Promise<Period> {
  const { period } = await api<{ period: PeriodDto }>(`/periods/${periodId}`, {
    method: 'PATCH',
    body: { actualCents: dollars === undefined ? null : Math.round(dollars * 100) },
  })
  return periodFromDto(period)
}

/* ------------------------------------------------------------------- report */
export type ReportResponse = {
  series: IncomeSeriesDto
  stats: ReportStatsDto
  grossToDateCents: number
}

export async function getReport(range: string, today: string): Promise<ReportResponse> {
  return api<ReportResponse>(`/report?range=${range}&today=${today}`)
}