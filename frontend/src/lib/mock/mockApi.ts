import {
  PAYG_2026_27,
  REPORT_RANGES,
  buildIncomeSeries,
  buildReportStats,
  computePeriod,
  diffDaysIso,
  type PeriodShift,
  type PublicHoliday,
  type RateSnapshot,
  type ReportPeriod,
  type ReportRange,
  type TaxProfile,
} from '@my-pay/engine'
import { ApiError } from '../api/client'
import type { AuState, Profile, TaxProfileDto } from '../api'
import type { JobDto } from '../rates'
import { lookupAward } from './awardRates'
import { currentMockIdentity } from './mockSupabase'
import { readJson, writeJson } from './storage'

const STORE_PREFIX = 'mypay-mock:store:'

const STATES = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT'] as const

/** National public holidays shared by every state in the local fixture. */
const HOLIDAYS: PublicHoliday[] = [
  { date: '2026-01-01', name: "New Year's Day", fromMinute: null },
  { date: '2026-01-26', name: 'Australia Day', fromMinute: null },
  { date: '2026-04-03', name: 'Good Friday', fromMinute: null },
  { date: '2026-04-06', name: 'Easter Monday', fromMinute: null },
  { date: '2026-04-25', name: 'Anzac Day', fromMinute: null },
  { date: '2026-12-25', name: 'Christmas Day', fromMinute: null },
  { date: '2026-12-26', name: 'Boxing Day', fromMinute: null },
  { date: '2027-01-01', name: "New Year's Day", fromMinute: null },
  { date: '2027-01-26', name: 'Australia Day', fromMinute: null },
]

type StoredShift = {
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

type StoredPeriod = {
  id: string
  startDate: string
  endDate: string
  payCycle: 'weekly' | 'fortnightly'
  actualCents: number | null
  shifts: StoredShift[]
}

type Store = {
  profile: Profile
  tax: TaxProfileDto
  jobs: JobDto[]
  periods: StoredPeriod[]
}

type JobBody = {
  name: string
  kind: 'preset' | 'custom'
  status: string
  level: string
  age: string
  overtimeEnabled: boolean
  claimsTaxFreeThreshold?: boolean
  rate: Omit<RateSnapshot, 'overtimeEnabled'>
}

const RATE_KEYS = [
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
] as const

function fail(status: number, code: string): never {
  throw new ApiError(status, code)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isState(value: unknown): value is AuState {
  return typeof value === 'string' && (STATES as readonly string[]).includes(value)
}

function seed(identity: { email: string; firstName: string; lastName: string }): Store {
  const rate = lookupAward('fullTime', 1, 21)
  if (!rate) fail(500, 'internal')
  const jobId = '00000000-0000-4000-8000-000000000001'
  const shift = (
    date: string,
    checkIn: string,
    checkOut: string,
    breakMinutes: number,
  ): StoredShift => ({
    date,
    part: 1,
    jobId,
    checkIn,
    checkOut,
    breakMinutes,
    publicHoliday: false,
    overtimeMinutes: 0,
    rate,
  })
  return {
    profile: {
      firstName: identity.firstName,
      lastName: identity.lastName,
      email: identity.email,
      state: 'NSW',
    },
    tax: {
      residency: 'resident',
      studyLoan: false,
      annualOffsetCents: 0,
      medicareVariation: 'none',
      payCycle: 'fortnightly',
    },
    jobs: [
      {
        id: jobId,
        name: 'Fast Food',
        kind: 'preset',
        status: 'fullTime',
        level: '1',
        age: '21',
        claimsTaxFreeThreshold: true,
        archived: false,
        rate,
      },
    ],
    periods: [
      {
        id: '00000000-0000-4000-8000-000000000002',
        startDate: '2026-10-26',
        endDate: '2026-11-08',
        payCycle: 'fortnightly',
        actualCents: 82000,
        shifts: [
          shift('2026-10-26', '09:00', '17:00', 30),
          shift('2026-10-27', '09:00', '17:00', 30),
          shift('2026-10-31', '10:00', '18:00', 30),
          shift('2026-11-02', '09:00', '15:00', 0),
        ],
      },
    ],
  }
}

function storeKey(email: string): string {
  return `${STORE_PREFIX}${email}`
}

function loadStore(identity: { email: string; firstName: string; lastName: string }): Store {
  const stored = readJson<Store>(storeKey(identity.email))
  if (stored?.profile && stored.tax && Array.isArray(stored.jobs) && Array.isArray(stored.periods)) {
    stored.profile.email = identity.email
    return stored
  }
  return seed(identity)
}

function saveStore(email: string, store: Store) {
  writeJson(storeKey(email), store)
}

function taxProfile(store: Store): TaxProfile {
  return {
    residency: store.tax.residency,
    studyLoan: store.tax.studyLoan,
    annualOffsetCents: store.tax.annualOffsetCents,
    medicareVariation: store.tax.medicareVariation,
  }
}

function jobTax(store: Store) {
  return store.jobs.map((job) => ({
    id: job.id,
    claimsTaxFreeThreshold: job.claimsTaxFreeThreshold,
  }))
}

function periodShifts(period: StoredPeriod): PeriodShift[] {
  return period.shifts.map((shift) => ({
    date: shift.date,
    part: shift.part,
    jobId: shift.jobId,
    checkIn: shift.checkIn,
    checkOut: shift.checkOut,
    breakMinutes: shift.breakMinutes,
    publicHoliday: shift.publicHoliday,
    overtimeMinutes: shift.overtimeMinutes,
    rate: shift.rate,
  }))
}

function toPeriodDto(period: StoredPeriod, store: Store) {
  const input = {
    startDate: period.startDate,
    endDate: period.endDate,
    payCycle: period.payCycle,
    shifts: periodShifts(period),
  }
  const result = computePeriod(input, jobTax(store), taxProfile(store), [PAYG_2026_27], {
    holidays: HOLIDAYS,
  })
  return {
    id: period.id,
    startDate: period.startDate,
    endDate: period.endDate,
    payCycle: period.payCycle,
    actualCents: period.actualCents,
    shifts: period.shifts.map((shift) => ({
      date: shift.date,
      part: shift.part,
      jobId: shift.jobId,
      checkIn: shift.checkIn,
      checkOut: shift.checkOut,
      breakMinutes: shift.breakMinutes,
      publicHoliday: shift.publicHoliday,
      overtimeMinutes: shift.overtimeMinutes,
      rate: shift.rate,
    })),
    totals: {
      grossCents: result.grossCents,
      taxCents: result.taxCents,
      netCents: result.netCents,
      minutes: result.minutes,
    },
  }
}

function reportPeriods(store: Store): ReportPeriod[] {
  return store.periods.map((period) => ({
    id: period.id,
    startDate: period.startDate,
    endDate: period.endDate,
    payCycle: period.payCycle,
    actualCents: period.actualCents,
    shifts: periodShifts(period),
  }))
}

function clockMinutes(time: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

function spanMinutes(checkIn: string, checkOut: string): number {
  const start = clockMinutes(checkIn)
  const end = clockMinutes(checkOut)
  if (start === null || end === null) fail(400, 'invalid')
  const diff = end - start
  return diff > 0 ? diff : diff + 1440
}

function assertNoOverlap(shifts: Array<{ checkIn: string; checkOut: string }>) {
  const ranges = shifts.map((shift) => {
    const start = clockMinutes(shift.checkIn)
    if (start === null) fail(400, 'invalid')
    return [start, start + spanMinutes(shift.checkIn, shift.checkOut)] as const
  })
  for (let i = 0; i < ranges.length; i++) {
    for (let j = i + 1; j < ranges.length; j++) {
      if (ranges[i][0] < ranges[j][1] && ranges[j][0] < ranges[i][1]) fail(400, 'shift_overlap')
    }
  }
}

function readShift(
  store: Store,
  date: string,
  part: 1 | 2,
  value: unknown,
): StoredShift {
  if (!isRecord(value)) fail(400, 'invalid')
  const jobId = value.jobId
  const checkIn = value.checkIn
  const checkOut = value.checkOut
  if (typeof jobId !== 'string' || typeof checkIn !== 'string' || typeof checkOut !== 'string') {
    fail(400, 'invalid')
  }
  const job = store.jobs.find((item) => item.id === jobId)
  if (!job) fail(404, 'not_found')
  const span = spanMinutes(checkIn, checkOut)
  if (span === 0) fail(400, 'invalid')
  const breakMinutes = value.breakMinutes
  const overtimeMinutes = value.overtimeMinutes
  if (typeof breakMinutes !== 'number' || breakMinutes < 0 || breakMinutes >= span) fail(400, 'invalid')
  if (typeof overtimeMinutes !== 'number' || overtimeMinutes < 0) fail(400, 'invalid')
  return {
    date,
    part,
    jobId,
    checkIn,
    checkOut,
    breakMinutes,
    publicHoliday: value.publicHoliday === true,
    overtimeMinutes,
    rate: { ...job.rate },
  }
}

function readDayShifts(store: Store, date: string, value: unknown): StoredShift[] {
  if (!Array.isArray(value) || value.length > 2) fail(400, 'invalid')
  const shifts = value.map((item, index) => readShift(store, date, (index + 1) as 1 | 2, item))
  assertNoOverlap(shifts)
  return shifts
}

function rangesOverlap(start: string, end: string, period: StoredPeriod): boolean {
  return start <= period.endDate && period.startDate <= end
}

function readJobBody(body: unknown): JobBody {
  if (!isRecord(body) || !isRecord(body.rate)) fail(400, 'invalid')
  const rate = {} as JobBody['rate']
  for (const key of RATE_KEYS) {
    const cents = body.rate[key]
    if (typeof cents !== 'number' || !Number.isInteger(cents) || cents < 0) fail(400, 'invalid')
    rate[key] = cents
  }
  if (typeof body.name !== 'string' || body.name.trim() === '') fail(400, 'invalid')
  if (body.kind !== 'preset' && body.kind !== 'custom') fail(400, 'invalid')
  if (typeof body.overtimeEnabled !== 'boolean') fail(400, 'invalid')
  return {
    name: body.name.trim(),
    kind: body.kind,
    status: typeof body.status === 'string' ? body.status : '',
    level: typeof body.level === 'string' ? body.level : '',
    age: typeof body.age === 'string' ? body.age : '',
    overtimeEnabled: body.overtimeEnabled,
    claimsTaxFreeThreshold:
      typeof body.claimsTaxFreeThreshold === 'boolean' ? body.claimsTaxFreeThreshold : undefined,
    rate,
  }
}

function snapshot(body: JobBody): RateSnapshot {
  return { ...body.rate, overtimeEnabled: body.overtimeEnabled }
}

function applyClaim(store: Store, jobId: string, claim: boolean) {
  for (const job of store.jobs) {
    if (job.id === jobId) job.claimsTaxFreeThreshold = claim
    else if (claim) job.claimsTaxFreeThreshold = false
  }
}

function findPeriod(store: Store, id: string): StoredPeriod {
  const period = store.periods.find((item) => item.id === id)
  if (!period) fail(404, 'not_found')
  return period
}

function dispatch(
  store: Store,
  path: string,
  options: { method?: string; body?: unknown },
): unknown {
  const queryAt = path.indexOf('?')
  const pathname = queryAt === -1 ? path : path.slice(0, queryAt)
  const query = new URLSearchParams(queryAt === -1 ? '' : path.slice(queryAt + 1))
  const method = (options.method ?? 'GET').toUpperCase()

  if (pathname === '/me' && method === 'GET') return { profile: store.profile }
  if (pathname === '/me' && method === 'PATCH') {
    const body = options.body
    if (!isRecord(body) || typeof body.firstName !== 'string' || typeof body.lastName !== 'string') {
      fail(400, 'invalid')
    }
    if (!isState(body.state)) fail(400, 'invalid')
    store.profile = {
      ...store.profile,
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      state: body.state,
    }
    return { profile: store.profile }
  }

  if (pathname === '/tax-profile' && method === 'GET') return { taxProfile: store.tax }
  if (pathname === '/tax-profile' && method === 'PUT') {
    const body = options.body
    if (!isRecord(body)) fail(400, 'invalid')
    if (body.residency !== 'resident' && body.residency !== 'foreign') fail(400, 'invalid')
    if (body.medicareVariation !== 'none' && body.medicareVariation !== 'full' && body.medicareVariation !== 'half') {
      fail(400, 'invalid')
    }
    if (body.payCycle !== 'weekly' && body.payCycle !== 'fortnightly') fail(400, 'invalid')
    if (typeof body.studyLoan !== 'boolean') fail(400, 'invalid')
    if (typeof body.annualOffsetCents !== 'number' || body.annualOffsetCents < 0) fail(400, 'invalid')
    store.tax = {
      residency: body.residency,
      studyLoan: body.studyLoan,
      annualOffsetCents: body.annualOffsetCents,
      medicareVariation: body.medicareVariation,
      payCycle: body.payCycle,
    }
    if (store.tax.residency === 'foreign') {
      for (const job of store.jobs) job.claimsTaxFreeThreshold = false
    }
    return { taxProfile: store.tax }
  }

  if (pathname === '/rules' && method === 'GET') return { coeffSets: [PAYG_2026_27] }
  if (pathname === '/holidays' && method === 'GET') return { holidays: HOLIDAYS }

  if (pathname === '/jobs' && method === 'GET') {
    const jobs = query.get('archived') === '1' ? store.jobs : store.jobs.filter((job) => !job.archived)
    return { jobs }
  }
  if (pathname === '/jobs' && method === 'POST') {
    const body = readJobBody(options.body)
    const job: JobDto = {
      id: crypto.randomUUID(),
      name: body.name,
      kind: body.kind,
      status: body.status,
      level: body.level,
      age: body.age,
      claimsTaxFreeThreshold: false,
      archived: false,
      rate: snapshot(body),
    }
    store.jobs.push(job)
    if (body.claimsTaxFreeThreshold) applyClaim(store, job.id, true)
    return { job }
  }

  const jobMatch = /^\/jobs\/([^/]+)$/.exec(pathname)
  if (jobMatch && method === 'PATCH') {
    const job = store.jobs.find((item) => item.id === jobMatch[1])
    if (!job) fail(404, 'not_found')
    const body = readJobBody(options.body)
    job.name = body.name
    job.kind = body.kind
    job.status = body.status
    job.level = body.level
    job.age = body.age
    job.rate = snapshot(body)
    if (body.claimsTaxFreeThreshold !== undefined) applyClaim(store, job.id, body.claimsTaxFreeThreshold)
    return { job }
  }
  if (jobMatch && method === 'DELETE') {
    const job = store.jobs.find((item) => item.id === jobMatch[1])
    if (!job) fail(404, 'not_found')
    const used = store.periods.some((period) => period.shifts.some((shift) => shift.jobId === job.id))
    if (used) {
      job.archived = true
      job.claimsTaxFreeThreshold = false
    } else {
      store.jobs = store.jobs.filter((item) => item.id !== job.id)
    }
    return {}
  }

  if (pathname === '/award-rates' && method === 'GET') {
    const status = query.get('status')
    const level = Number(query.get('level'))
    const age = Math.min(Math.max(Number(query.get('age')), 15), 21)
    if (status !== 'fullTime' && status !== 'partTime' && status !== 'casual') fail(400, 'invalid')
    if (!Number.isInteger(level) || level < 1 || level > 3) fail(400, 'invalid')
    const rate = lookupAward(status, level, age)
    if (!rate) fail(404, 'not_found')
    return { rate }
  }

  if (pathname === '/bootstrap' && method === 'GET') {
    const periods = [...store.periods].sort((a, b) => b.startDate.localeCompare(a.startDate))
    return {
      profile: store.profile,
      taxProfile: store.tax,
      jobs: store.jobs,
      holidays: HOLIDAYS,
      coeffSets: [PAYG_2026_27],
      periods: periods.map((period) => toPeriodDto(period, store)),
    }
  }

  if (pathname === '/periods' && method === 'GET') {
    const periods = [...store.periods].sort((a, b) => b.startDate.localeCompare(a.startDate))
    return { periods: periods.map((period) => toPeriodDto(period, store)) }
  }
  if (pathname === '/periods' && method === 'POST') {
    const body = options.body
    if (!isRecord(body) || typeof body.startDate !== 'string' || typeof body.endDate !== 'string') {
      fail(400, 'invalid')
    }
    const expected = store.tax.payCycle === 'weekly' ? 6 : 13
    if (diffDaysIso(body.startDate, body.endDate) !== expected) fail(400, 'invalid_period_length')
    if (store.periods.some((period) => rangesOverlap(body.startDate as string, body.endDate as string, period))) {
      fail(400, 'period_overlap')
    }
    const days = Array.isArray(body.days) ? body.days : []
    if (days.length > 14) fail(400, 'invalid')
    const seen = new Set<string>()
    const shifts: StoredShift[] = []
    for (const day of days) {
      if (!isRecord(day) || typeof day.date !== 'string') fail(400, 'invalid')
      if (day.date < body.startDate || day.date > body.endDate || seen.has(day.date)) fail(400, 'invalid')
      seen.add(day.date)
      shifts.push(...readDayShifts(store, day.date, day.shifts))
    }
    const period: StoredPeriod = {
      id: crypto.randomUUID(),
      startDate: body.startDate,
      endDate: body.endDate,
      payCycle: store.tax.payCycle,
      actualCents: null,
      shifts,
    }
    store.periods.push(period)
    return { period: toPeriodDto(period, store) }
  }

  const dayMatch = /^\/periods\/([^/]+)\/days\/(\d{4}-\d{2}-\d{2})$/.exec(pathname)
  if (dayMatch && method === 'PUT') {
    const period = findPeriod(store, dayMatch[1])
    const date = dayMatch[2]
    if (date < period.startDate || date > period.endDate) fail(400, 'invalid')
    const body = options.body
    if (!isRecord(body)) fail(400, 'invalid')
    const shifts = readDayShifts(store, date, body.shifts)
    period.shifts = [...period.shifts.filter((shift) => shift.date !== date), ...shifts]
    return { period: toPeriodDto(period, store) }
  }

  const periodMatch = /^\/periods\/([^/]+)$/.exec(pathname)
  if (periodMatch && method === 'DELETE') {
    const period = findPeriod(store, periodMatch[1])
    store.periods = store.periods.filter((item) => item.id !== period.id)
    return {}
  }
  if (periodMatch && method === 'PATCH') {
    const period = findPeriod(store, periodMatch[1])
    const body = options.body
    if (!isRecord(body)) fail(400, 'invalid')
    if (body.actualCents !== null && (typeof body.actualCents !== 'number' || body.actualCents < 0)) {
      fail(400, 'invalid')
    }
    period.actualCents = body.actualCents === null ? null : body.actualCents
    return { period: toPeriodDto(period, store) }
  }

  if (pathname === '/report' && method === 'GET') {
    const raw = query.get('range') ?? 'year'
    const range: ReportRange = (REPORT_RANGES as readonly string[]).includes(raw) ? (raw as ReportRange) : 'year'
    const today = query.get('today') ?? new Date().toISOString().slice(0, 10)
    const periods = reportPeriods(store)
    const ctx = {
      jobs: jobTax(store),
      profile: taxProfile(store),
      coeffSets: [PAYG_2026_27],
      holidays: HOLIDAYS,
    }
    let grossToDateCents = 0
    for (const period of periods) {
      grossToDateCents += computePeriod(period, ctx.jobs, ctx.profile, ctx.coeffSets, {
        upTo: today,
        holidays: HOLIDAYS,
      }).grossCents
    }
    return {
      series: buildIncomeSeries(periods, range, today, ctx),
      stats: buildReportStats(periods, today, ctx),
      grossToDateCents,
    }
  }

  fail(404, 'not_found')
}

export async function handleMock<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const identity = currentMockIdentity()
  if (!identity) fail(401, 'unauthorized')
  const store = loadStore(identity)
  const result = dispatch(store, path, options)
  saveStore(identity.email, store)
  return result as T
}
