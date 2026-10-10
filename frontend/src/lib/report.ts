import {
  addDays,
  calcShiftMinutes,
  calcTotalPay,
  eachDayInRange,
  parseIsoDate,
  periodTotals,
  startOfDay,
  toIsoDate,
  type Period,
} from './timesheet'

export type ReportRange = 'month' | 'threeMonths' | 'annual' | 'year'

export const REPORT_RANGES: ReportRange[] = ['month', 'threeMonths', 'annual', 'year']

export type SeriesPoint = {
  start: Date
  end: Date
  /** null = no data for this bucket (line breaks). */
  estimated: number | null
  net: number | null
}

export type IncomeSeries = {
  granularity: 'period' | 'month'
  points: SeriesPoint[]
  hasData: boolean
  windowStart: Date
  windowEnd: Date
}

export type DateSpan = { start: Date; end: Date }

export type ReportStats = {
  estimated: number
  net: number
  variance: number
  periodsWithActual: number
  periodsTotal: number
  tax: number
  minutes: number
  bestWeek: (DateSpan & { minutes: number }) | null
  highestFortnight: (DateSpan & { income: number }) | null
  lowestFortnight: (DateSpan & { income: number }) | null
}

type DayData = { est: number; minutes: number }

type RateOf = (rateId: string) => number

/** Per-day estimated income and worked minutes. */
function buildDayMap(periods: Period[], rateOf: RateOf): Map<string, DayData> {
  const map = new Map<string, DayData>()
  for (const period of periods) {
    const days = eachDayInRange({
      start: parseIsoDate(period.start),
      end: parseIsoDate(period.end),
    })
    for (const day of days) {
      const iso = toIsoDate(day)
      const shift = period.shifts[iso]
      const est = shift ? calcTotalPay(shift, rateOf) : 0
      const minutes = shift
        ? calcShiftMinutes(shift) + (shift.second ? calcShiftMinutes(shift.second) : 0)
        : 0
      map.set(iso, { est, minutes })
    }
  }
  return map
}

export function mondayOf(date: Date): Date {
  return addDays(startOfDay(date), -((date.getDay() + 6) % 7))
}

function windowFor(range: ReportRange, today: Date): DateSpan {
  const y = today.getFullYear()
  const m = today.getMonth()
  switch (range) {
    case 'month':
      return { start: new Date(y, m, 1), end: new Date(y, m + 1, 0) }
    case 'threeMonths':
      return { start: new Date(y, m - 2, 1), end: new Date(y, m + 1, 0) }
    case 'annual': {
      const fy = m >= 6 ? y : y - 1
      return { start: new Date(fy, 6, 1), end: new Date(fy + 1, 5, 30) }
    }
    case 'year':
      return { start: new Date(y, 0, 1), end: new Date(y, 11, 31) }
  }
}

/** Estimated income of a period up to `today`; net is the amount the user entered. */
function periodValue(period: Period, rateOf: RateOf, today: Date) {
  const days = eachDayInRange({ start: parseIsoDate(period.start), end: parseIsoDate(period.end) })
  const estimated = days
    .filter((d) => d <= today)
    .reduce((sum, d) => {
      const shift = period.shifts[toIsoDate(d)]
      return sum + (shift ? calcTotalPay(shift, rateOf) : 0)
    }, 0)
  return { estimated, net: period.actual ?? null }
}

/**
 * Net income is entered per pay period, so points are real periods (1 month tab)
 * or whole months (a period belongs to the month it starts in). A bucket's net is
 * null until at least one of its periods has an amount entered.
 */
export function buildIncomeSeries(
  periods: Period[],
  range: ReportRange,
  today: Date,
  rateOf: RateOf,
): IncomeSeries {
  const now = startOfDay(today)
  const { start, end } = windowFor(range, now)
  const granularity = range === 'month' ? 'period' : 'month'

  const inWindow = periods
    .filter((p) => {
      const s = parseIsoDate(p.start)
      return s >= start && s <= end && s <= now
    })
    .sort((a, b) => a.start.localeCompare(b.start))

  const sum = (list: Period[]) => {
    const values = list.map((p) => periodValue(p, rateOf, now))
    const nets = values.filter((v) => v.net !== null)
    return {
      estimated: values.reduce((s, v) => s + v.estimated, 0),
      net: nets.length > 0 ? nets.reduce((s, v) => s + (v.net ?? 0), 0) : null,
    }
  }

  const points: SeriesPoint[] = []
  if (granularity === 'period') {
    for (const p of inWindow) {
      points.push({ start: parseIsoDate(p.start), end: parseIsoDate(p.end), ...sum([p]) })
    }
  } else {
    const count = range === 'threeMonths' ? 3 : 12
    for (let i = 0; i < count; i++) {
      const ms = new Date(start.getFullYear(), start.getMonth() + i, 1)
      const me = new Date(ms.getFullYear(), ms.getMonth() + 1, 0)
      const bucket = inWindow.filter((p) => p.start.slice(0, 7) === toIsoDate(ms).slice(0, 7))
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
  periods: Period[],
  today: Date,
  rateOf: RateOf,
  taxRate: number,
): ReportStats {
  const now = startOfDay(today)
  const year = now.getFullYear()
  const dayMap = buildDayMap(periods, rateOf)

  let estimated = 0
  let minutes = 0
  const weekMinutes = new Map<string, number>()
  for (const [iso, row] of dayMap) {
    const day = parseIsoDate(iso)
    if (day > now || day.getFullYear() !== year) continue
    estimated += row.est
    minutes += row.minutes
    const key = toIsoDate(mondayOf(day))
    weekMinutes.set(key, (weekMinutes.get(key) ?? 0) + row.minutes)
  }

  let bestWeek: ReportStats['bestWeek'] = null
  for (const [key, mins] of weekMinutes) {
    if (mins > 0 && (!bestWeek || mins > bestWeek.minutes)) {
      const start = parseIsoDate(key)
      bestWeek = { start, end: addDays(start, 6), minutes: mins }
    }
  }

  const yearPeriods = periods.filter((p) => parseIsoDate(p.start).getFullYear() === year)
  const withActual = yearPeriods.filter((p) => p.actual !== undefined)
  const net = withActual.reduce((s, p) => s + (p.actual ?? 0), 0)
  const estimatedOfActual = withActual.reduce(
    (s, p) => s + periodTotals(p, rateOf, 0).income,
    0,
  )

  const todayIso = toIsoDate(now)
  const finished = yearPeriods
    .filter((p) => p.end <= todayIso)
    .map((p) => ({
      start: parseIsoDate(p.start),
      end: parseIsoDate(p.end),
      income: periodTotals(p, rateOf, 0).income,
    }))
    .filter((p) => p.income > 0)

  let highest: ReportStats['highestFortnight'] = null
  let lowest: ReportStats['lowestFortnight'] = null
  for (const p of finished) {
    if (!highest || p.income > highest.income) highest = p
    if (!lowest || p.income < lowest.income) lowest = p
  }

  return {
    estimated,
    net,
    variance: net - estimatedOfActual,
    periodsWithActual: withActual.length,
    periodsTotal: yearPeriods.length,
    tax: estimated * taxRate,
    minutes,
    bestWeek,
    highestFortnight: highest,
    lowestFortnight: lowest,
  }
}
