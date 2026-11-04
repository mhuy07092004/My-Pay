/** ISO date (YYYY-MM-DD) helpers using UTC math so no timezone drift. */

function parse(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

function format(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function addDaysIso(iso: string, days: number): string {
  const d = parse(iso)
  d.setUTCDate(d.getUTCDate() + days)
  return format(d)
}

export function diffDaysIso(from: string, to: string): number {
  return Math.round((parse(to).getTime() - parse(from).getTime()) / 86_400_000)
}

export function eachDayIso(start: string, end: string): string[] {
  const n = diffDaysIso(start, end) + 1
  return Array.from({ length: Math.max(n, 0) }, (_, i) => addDaysIso(start, i))
}

export function mondayOfIso(iso: string): string {
  const dow = parse(iso).getUTCDay()
  return addDaysIso(iso, -((dow + 6) % 7))
}

export function monthStartIso(year: number, monthIndex: number): string {
  return format(new Date(Date.UTC(year, monthIndex, 1)))
}

export function monthEndIso(year: number, monthIndex: number): string {
  return format(new Date(Date.UTC(year, monthIndex + 1, 0)))
}

export function yearOfIso(iso: string): number {
  return Number(iso.slice(0, 4))
}

export function monthIndexOfIso(iso: string): number {
  return Number(iso.slice(5, 7)) - 1
}
