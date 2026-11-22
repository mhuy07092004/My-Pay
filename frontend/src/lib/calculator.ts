import type { SavedRate } from './rates'

export type HoursAtRate = {
  rate: number
  totalMinutes: number
}

export type JobHoursBreakdown = {
  jobId: string
  weekday: HoursAtRate | null
  saturday: HoursAtRate | null
  sunday: HoursAtRate | null
}

export function hoursFor(price: number, hourlyRate: number): HoursAtRate | null {
  if (hourlyRate <= 0 || price <= 0) return null
  const totalMinutes = Math.round((price / hourlyRate) * 60)
  return { rate: hourlyRate, totalMinutes }
}

export function formatDuration(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (m === 0) return `${h}h`
  return `${h}h ${String(m).padStart(2, '0')}m`
}

export function jobHoursForPrice(price: number, rates: SavedRate[]): JobHoursBreakdown[] {
  return rates
    .filter((rate) => !rate.archived)
    .map((job) => ({
      jobId: job.id,
      weekday: hoursFor(price, job.pay.ordinary.weekday),
      saturday: hoursFor(price, job.pay.ordinary.saturday),
      sunday: hoursFor(price, job.pay.ordinary.sunday),
    }))
}