import type { RateSnapshot } from './pay'
import type { PeriodInput, PeriodShift } from './period'
import type { PayCycle } from './tax'

/** One saved shift, before pay is calculated. */
export type ShiftDto = {
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

export type PeriodTotalsDto = {
  grossCents: number
  taxCents: number
  netCents: number
  minutes: number
}

/** A pay period as stored. Totals are not part of this shape. */
export type RawPeriodDto = {
  id: string
  startDate: string
  endDate: string
  payCycle: Extract<PayCycle, 'weekly' | 'fortnightly'>
  actualCents: number | null
  shifts: ShiftDto[]
}

/** Maps a stored period onto the engine input. Server and browser share this. */
export function periodInputFromDto(
  dto: Pick<RawPeriodDto, 'startDate' | 'endDate' | 'payCycle' | 'shifts'>,
): PeriodInput {
  const shifts: PeriodShift[] = dto.shifts.map((shift) => ({
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
  return {
    startDate: dto.startDate,
    endDate: dto.endDate,
    payCycle: dto.payCycle,
    shifts,
  }
}
