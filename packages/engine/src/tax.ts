import { roundHalfUpDiv } from './pay'

export type PayCycle = 'weekly' | 'fortnightly' | 'monthly' | 'quarterly'
export type TaxScale = 1 | 2 | 3 | 5 | 6

/** One "x less than N" row. `lt` null = "N and over". a, b are decimal strings. */
export type CoeffRow = { lt: number | null; a: string; b: string }

export type CoeffSet = {
  effectiveFrom: string
  scales: Record<string, CoeffRow[]>
  loanA: CoeffRow[]
  loanB: CoeffRow[]
  offsetRates: Record<PayCycle, string>
}

/** Decimal string -> integer scaled by 1e4 (exact, no float). */
export function toScaled4(value: string): number {
  const neg = value.startsWith('-')
  const [int, frac = ''] = value.replace('-', '').split('.')
  const n = Number(int) * 10000 + Number((frac + '0000').slice(0, 4))
  return neg ? -n : n
}

function pickRow(rows: CoeffRow[], wholeDollars: number): CoeffRow {
  for (const row of rows) {
    if (row.lt === null || wholeDollars < row.lt) return row
  }
  return rows[rows.length - 1]
}

/**
 * a * x - b, where x = wholeDollars + 0.99, returned as an integer scaled by 1e6
 * (millionths of a dollar).
 */
function linear(row: CoeffRow, wholeDollars: number): number {
  const x100 = wholeDollars * 100 + 99
  return toScaled4(row.a) * x100 - toScaled4(row.b) * 100
}

/** Weekly-equivalent whole dollars for the pay cycle. */
export function weeklyWholeDollars(grossCents: number, cycle: PayCycle): number {
  const c = Math.max(grossCents, 0)
  switch (cycle) {
    case 'weekly':
      return Math.floor(c / 100)
    case 'fortnightly':
      return Math.floor(c / 200)
    case 'monthly': {
      const adj = c % 100 === 33 ? c + 1 : c
      return Math.floor((adj * 3) / 1300)
    }
    case 'quarterly':
      return Math.floor(c / 1300)
  }
}

function cycleFromWeekly(w: number, cycle: PayCycle): number {
  switch (cycle) {
    case 'weekly':
      return w
    case 'fortnightly':
      return w * 2
    case 'monthly':
      return roundHalfUpDiv(w * 13, 3)
    case 'quarterly':
      return w * 13
  }
}

export type WithholdInput = {
  grossCents: number
  cycle: PayCycle
  scale: TaxScale
  studyLoan: boolean
  annualOffsetCents: number
  coeffs: CoeffSet
}

/** Weekly tax in whole dollars, before converting to the pay cycle. */
export function weeklyTax(
  wholeDollars: number,
  scale: TaxScale,
  studyLoan: boolean,
  coeffs: CoeffSet,
): number {
  const rows = coeffs.scales[String(scale)]
  if (!rows) throw new Error(`No coefficients for scale ${scale}`)
  let y6 = linear(pickRow(rows, wholeDollars), wholeDollars)
  if (studyLoan) {
    y6 += linear(pickRow(scale === 1 ? coeffs.loanB : coeffs.loanA, wholeDollars), wholeDollars)
  }
  if (y6 <= 0) return 0
  return roundHalfUpDiv(y6, 1_000_000)
}

/** Study loan component alone (weekly, whole dollars). Exposed for tests. */
export function weeklyLoan(wholeDollars: number, scale: TaxScale, coeffs: CoeffSet): number {
  const rows = scale === 1 ? coeffs.loanB : coeffs.loanA
  const y6 = linear(pickRow(rows, wholeDollars), wholeDollars)
  return y6 <= 0 ? 0 : roundHalfUpDiv(y6, 1_000_000)
}

/** PAYG withholding for one pay, in cents (always whole dollars). */
export function withholdCents(input: WithholdInput): number {
  const { grossCents, cycle, scale, studyLoan, annualOffsetCents, coeffs } = input
  if (grossCents <= 0) return 0
  const whole = weeklyWholeDollars(grossCents, cycle)
  const w = weeklyTax(whole, scale, studyLoan, coeffs)
  let dollars = cycleFromWeekly(w, cycle)

  if ((scale === 2 || scale === 5 || scale === 6) && annualOffsetCents > 0) {
    const rate = toScaled4(coeffs.offsetRates[cycle])
    // annualOffsetCents * rate / 1e4 = cents; to whole dollars => / 100
    dollars -= roundHalfUpDiv(annualOffsetCents * rate, 1_000_000)
  }
  return Math.max(dollars, 0) * 100
}
