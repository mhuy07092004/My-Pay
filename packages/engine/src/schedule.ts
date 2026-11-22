import { addDaysIso, diffDaysIso } from './dates'

export type ScheduleCycle = 'weekly' | 'fortnightly'

/** Anchor period plus the payday of that period. Later periods repeat from here. */
export type PaySchedule = {
  payCycle: ScheduleCycle
  startDate: string
  payDate: string
}

export type PeriodBounds = {
  startDate: string
  endDate: string
  paymentDate: string
}

export function cycleLength(cycle: ScheduleCycle): number {
  return cycle === 'weekly' ? 7 : 14
}

/** Days after the period end that payday falls. 0–14 is a valid schedule. */
export function scheduleOffset(schedule: PaySchedule): number {
  const periodEnd = addDaysIso(schedule.startDate, cycleLength(schedule.payCycle) - 1)
  return diffDaysIso(periodEnd, schedule.payDate)
}

export function isValidSchedule(schedule: PaySchedule): boolean {
  const offset = scheduleOffset(schedule)
  return offset >= 0 && offset <= 14
}

/** The pay period of this job that contains `iso`, and its payday. */
export function periodFor(schedule: PaySchedule, iso: string): PeriodBounds {
  const span = cycleLength(schedule.payCycle)
  const k = Math.floor(diffDaysIso(schedule.startDate, iso) / span)
  const startDate = addDaysIso(schedule.startDate, k * span)
  const endDate = addDaysIso(startDate, span - 1)
  return {
    startDate,
    endDate,
    paymentDate: addDaysIso(endDate, scheduleOffset(schedule)),
  }
}

/** Periods whose payday falls inside [from, to], inclusive. */
export function paydaysBetween(schedule: PaySchedule, from: string, to: string): PeriodBounds[] {
  const span = cycleLength(schedule.payCycle)
  let start = addDaysIso(periodFor(schedule, from).startDate, -span)

  const out: PeriodBounds[] = []
  for (let guard = 0; guard < 400; guard += 1) {
    const bounds = periodFor(schedule, start)
    if (bounds.paymentDate > to) break
    if (bounds.paymentDate >= from) out.push(bounds)
    start = addDaysIso(bounds.startDate, span)
  }
  return out
}
