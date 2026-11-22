import type { Period } from './timesheet'

export type HistorySort = 'desc' | 'asc'

export type HistoryMonthGroup = {
  key: string
  periods: Period[]
}

/** Pay periods that have ended and contain at least one shift. */
export function completedPeriods(periods: Period[], today: string): Period[] {
  return periods.filter((period) => period.end < today && Object.keys(period.shifts).length > 0)
}

export function sortPeriods(periods: Period[], order: HistorySort): Period[] {
  return [...periods].sort((a, b) => {
    const cmp =
      b.paymentDate.localeCompare(a.paymentDate) ||
      b.end.localeCompare(a.end) ||
      b.start.localeCompare(a.start)
    return order === 'desc' ? cmp : -cmp
  })
}

export function groupByPaymentMonth(periods: Period[], order: HistorySort): HistoryMonthGroup[] {
  const sorted = sortPeriods(periods, order)
  const groups: HistoryMonthGroup[] = []
  for (const period of sorted) {
    const key = period.paymentDate.slice(0, 7)
    const last = groups[groups.length - 1]
    if (last && last.key === key) last.periods.push(period)
    else groups.push({ key, periods: [period] })
  }
  return groups
}