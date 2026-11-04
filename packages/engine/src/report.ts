import {
  addDaysIso,
  mondayOfIso,
  monthEndIso,
  monthIndexOfIso,
  monthStartIso,
  yearOfIso,
} from './dates'
import {
  computePeriod,
  type JobTaxInfo,
  type PeriodInput,
  type TaxProfile,
} from './period'
import type { PublicHoliday } from './pay'
import type { CoeffSet } from './tax'

export type ReportRange = 'month' | 'threeMonths' | 'annual' | 'year'
export const REPORT_RANGES: ReportRange[] = ['month', 'threeMonths', 'annual', 'year']

export type ReportPeriod = PeriodInput & {
  id: string
  /** Net amount the user actually received (cents), if entered. */
  actualCents: number | null
}

export type ReportContext = {
  jobs: JobTaxInfo[]
  profile: TaxProfile
  coeffSets: CoeffSet[]
  holidays?: PublicHoliday[]
}

export type SeriesPointDto = {
  start: string
  end: string
  /** Gross earnings to date (cents); null = no data. */
  estimated: number | null
  /** Actual net entered (cents); null = none entered. */
  net: number | null
}

export type IncomeSeriesDto = {
  granularity: 'period' | 'month'
  points: SeriesPointDto[]
  hasData: boolean
  windowStart: string
  windowEnd: string
}

export type SpanDto = { start: string; end: string }

export type ReportStatsDto = {
  /** Gross to date, calendar year (cents). */
  estimated: number
  /** Sum of actual net entered (cents). */
  net: number
  /** actual net minus estimated net, for periods with actual entered (cents). */
  variance: number
  periodsWithActual: number
  periodsTotal: number
  /** Estimated income tax, calendar year to date (cents). */
  tax: number
  taxRatePct: number
  minutes: number
  bestWeek: (SpanDto & { minutes: number }) | null
  highestFortnight: (SpanDto & { income: number }) | null
  lowestFortnight: (SpanDto & { income: number }) | null
}

export function windowFor(range: ReportRange, today: string): SpanDto {
  const y = yearOfIso(today)
  const m = monthIndexOfIso(today)
  switch (range) {
    case 'month':
      return { start: monthStartIso(y, m), end: monthEndIso(y, m) }
    case 'threeMonths':
      return { start: monthStartIso(y, m - 2), end: monthEndIso(y, m) }
    case 'annual': {
      const fy = m >= 6 ? y : y - 1
      return { start: `${fy}-07-01`, end: `${fy + 1}-06-30` }
    }
    case 'year':
      return { start: `${y}-01-01`, end: `${y}-12-31` }
  }
}

/** Income to date for a period; net is what the user entered. */
function periodValue(p: ReportPeriod, ctx: ReportContext, today: string) {
  const res = computePeriod(p, ctx.jobs, ctx.profile, ctx.coeffSets, { upTo: today, holidays: ctx.holidays })
  return { estimated: res.grossCents, net: p.actualCents }
}

/**
 * Net income is entered per pay period, so points are real periods (1 month
 * tab) or whole months (a period belongs to the month it starts in).
 */
export function buildIncomeSeries(
  periods: ReportPeriod[],
  range: ReportRange,
  today: string,
  ctx: ReportContext,
): IncomeSeriesDto {
  const { start, end } = windowFor(range, today)
  const granularity = range === 'month' ? 'period' : 'month'

  const inWindow = periods
    .filter((p) => p.startDate >= start && p.startDate <= end && p.startDate <= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))

  const sum = (list: ReportPeriod[]) => {
    const values = list.map((p) => periodValue(p, ctx, today))
    const nets = values.filter((v) => v.net !== null)
    return {
      estimated: values.reduce((s, v) => s + v.estimated, 0),
      net: nets.length > 0 ? nets.reduce((s, v) => s + (v.net ?? 0), 0) : null,
    }
  }

  const points: SeriesPointDto[] = []
  if (granularity === 'period') {
    for (const p of inWindow) {
      points.push({ start: p.startDate, end: p.endDate, ...sum([p]) })
    }
  } else {
    const count = range === 'threeMonths' ? 3 : 12
    const y0 = yearOfIso(start)
    const m0 = monthIndexOfIso(start)
    for (let i = 0; i < count; i++) {
      const ms = monthStartIso(y0, m0 + i)
      const me = monthEndIso(y0, m0 + i)
      const bucket = inWindow.filter((p) => p.startDate.slice(0, 7) === ms.slice(0, 7))
      points.push({
        start: ms,
        end: me,
        ...(bucket.length > 0 ? sum(bucket) : { estimated: null, net: null }),
      })
    }
  }

  return {
    granularity,
    points,
    hasData: points.some((p) => p.estimated !== null),
    windowStart: start,
    windowEnd: end,
  }
}

/** Year-to-date stats for the calendar year of `today`. */
export function buildReportStats(
  periods: ReportPeriod[],
  today: string,
  ctx: ReportContext,
): ReportStatsDto {
  const year = yearOfIso(today)
  let estimated = 0
  let tax = 0
  let minutes = 0
  const weekMinutes = new Map<string, number>()

  for (const p of periods) {
    const full = computePeriod(p, ctx.jobs, ctx.profile, ctx.coeffSets, { holidays: ctx.holidays })
    for (const [iso, row] of Object.entries(full.byDay)) {
      if (iso > today || yearOfIso(iso) !== year) continue
      estimated += row.grossCents
      minutes += row.minutes
      const key = mondayOfIso(iso)
      weekMinutes.set(key, (weekMinutes.get(key) ?? 0) + row.minutes)
    }
    if (yearOfIso(p.startDate) === year && p.startDate <= today) {
      tax += computePeriod(p, ctx.jobs, ctx.profile, ctx.coeffSets, { upTo: today, holidays: ctx.holidays }).taxCents
    }
  }

  let bestWeek: ReportStatsDto['bestWeek'] = null
  for (const [key, mins] of weekMinutes) {
    if (mins > 0 && (!bestWeek || mins > bestWeek.minutes)) {
      bestWeek = { start: key, end: addDaysIso(key, 6), minutes: mins }
    }
  }

  const yearPeriods = periods.filter((p) => yearOfIso(p.startDate) === year)
  const withActual = yearPeriods.filter((p) => p.actualCents !== null)
  let net = 0
  let estimatedNetOfActual = 0
  for (const p of withActual) {
    net += p.actualCents ?? 0
    estimatedNetOfActual += computePeriod(p, ctx.jobs, ctx.profile, ctx.coeffSets, { holidays: ctx.holidays }).netCents
  }

  let highest: ReportStatsDto['highestFortnight'] = null
  let lowest: ReportStatsDto['lowestFortnight'] = null
  for (const p of yearPeriods) {
    if (p.endDate > today) continue
    const income = computePeriod(p, ctx.jobs, ctx.profile, ctx.coeffSets, { holidays: ctx.holidays }).grossCents
    if (income <= 0) continue
    const item = { start: p.startDate, end: p.endDate, income }
    if (!highest || income > highest.income) highest = item
    if (!lowest || income < lowest.income) lowest = item
  }

  return {
    estimated,
    net,
    variance: net - estimatedNetOfActual,
    periodsWithActual: withActual.length,
    periodsTotal: yearPeriods.length,
    tax,
    taxRatePct: estimated > 0 ? Math.round((tax / estimated) * 1000) / 10 : 0,
    minutes,
    bestWeek,
    highestFortnight: highest,
    lowestFortnight: lowest,
  }
}