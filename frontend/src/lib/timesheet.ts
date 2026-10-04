export type ShiftPart = {
  checkIn: string
  checkOut: string
  breakMinutes: number
  rateId: string
}

export type Shift = ShiftPart & {
  /** Optional second shift on the same day (e.g. morning + afternoon). */
  second?: ShiftPart
}

export type DateRange = {
  start: Date
  end: Date
}

export const MAX_RANGE_DAYS = 14

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function diffDays(from: Date, to: Date): number {
  const ms = startOfDay(to).getTime() - startOfDay(from).getTime()
  return Math.round(ms / 86_400_000)
}

export function toIsoDate(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${m}-${d}`
}

export function eachDayInRange({ start, end }: DateRange): Date[] {
  const count = diffDays(start, end) + 1
  return Array.from({ length: Math.max(count, 0) }, (_, i) => addDays(start, i))
}

function timeToMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

/** Worked minutes; a check-out earlier than check-in means the shift crosses midnight. */
export function calcShiftMinutes(shift: Pick<Shift, 'checkIn' | 'checkOut' | 'breakMinutes'>): number {
  const inMin = timeToMinutes(shift.checkIn)
  const outMin = timeToMinutes(shift.checkOut)
  if (inMin === null || outMin === null) return 0
  let total = outMin - inMin
  if (total < 0) total += 24 * 60
  return Math.max(total - Math.max(shift.breakMinutes, 0), 0)
}

export function calcShiftPay(
  shift: Pick<Shift, 'checkIn' | 'checkOut' | 'breakMinutes'>,
  hourlyRate: number,
): number {
  return (calcShiftMinutes(shift) / 60) * hourlyRate
}

export function calcTotalPay(
  shift: Shift,
  hourlyRateOf: (rateId: string) => number,
): number {
  const parts = shift.second ? [shift, shift.second] : [shift]
  return parts.reduce(
    (sum, part) => sum + calcShiftPay(part, hourlyRateOf(part.rateId)),
    0,
  )
}

export function formatMoney(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatTime12h(time: string, locale: string): string {
  const minutes = timeToMinutes(time)
  if (minutes === null) return time
  const date = new Date(2000, 0, 1, Math.floor(minutes / 60), minutes % 60)
  return date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })
}
