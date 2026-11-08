import type {
  CoeffSet,
  MedicareVariation,
  PeriodTotalsDto,
  PublicHoliday,
  RateSnapshot,
  RawPeriodDto,
  Residency,
} from '@my-pay/engine'
import { jobBodyFromRate, savedRateFromJob, type JobDto, type SavedRate } from '../rates'
import type { PayCycle, Shift } from '../timesheet'
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

export type BootstrapResponse = {
  profile: Profile
  taxProfile: TaxProfileDto
  jobs: JobDto[]
  holidays: PublicHoliday[]
  coeffSets: CoeffSet[]
  periods: PeriodPayload[]
}

/** Stored period plus the server totals from a write, when the server sent them. */
export type PeriodPayload = RawPeriodDto & { totals?: PeriodTotalsDto }

export async function getBootstrap(): Promise<BootstrapResponse> {
  return api<BootstrapResponse>('/bootstrap')
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
): Promise<PeriodPayload> {
  const { period } = await api<{ period: PeriodPayload }>('/periods', {
    method: 'POST',
    body: {
      startDate,
      endDate,
      days: Object.entries(shifts).map(([date, shift]) => ({ date, shifts: shiftPayload(shift) })),
    },
  })
  return period
}

export async function deletePeriod(id: string): Promise<void> {
  await api(`/periods/${id}`, { method: 'DELETE' })
}

export async function saveDay(periodId: string, isoDate: string, shift: Shift | null): Promise<PeriodPayload> {
  const { period } = await api<{ period: PeriodPayload }>(`/periods/${periodId}/days/${isoDate}`, {
    method: 'PUT',
    body: { shifts: shift ? shiftPayload(shift) : [] },
  })
  return period
}

export async function saveActual(periodId: string, dollars: number | undefined): Promise<PeriodPayload> {
  const { period } = await api<{ period: PeriodPayload }>(`/periods/${periodId}`, {
    method: 'PATCH',
    body: { actualCents: dollars === undefined ? null : Math.round(dollars * 100) },
  })
  return period
}