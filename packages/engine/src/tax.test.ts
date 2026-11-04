import { describe, expect, it } from 'vitest'
import { PAYG_2026_27 as C } from './index'
import { computePeriod, DEFAULT_TAX_PROFILE } from './period'
import { EMPTY_RATE } from './pay'
import { weeklyLoan, withholdCents, type PayCycle, type TaxScale } from './tax'

const w = (
  earnings: number,
  cycle: PayCycle,
  scale: TaxScale,
  extra: Partial<{ studyLoan: boolean; annualOffsetCents: number }> = {},
) =>
  withholdCents({
    grossCents: Math.round(earnings * 100),
    cycle,
    scale,
    studyLoan: false,
    annualOffsetCents: 0,
    coeffs: C,
    ...extra,
  }) / 100

// [earnings, scale1, scale2, scale3, scale5, scale6]
const WEEKLY: number[][] = [
  [116, 17, 0, 35, 0, 0],
  [362, 65, 0, 109, 0, 0],
  [370, 66, 1, 111, 1, 1],
  [538, 100, 27, 161, 27, 27],
  [672, 143, 60, 202, 47, 47],
  [931, 227, 116, 279, 97, 98],
  [1135, 292, 181, 340, 159, 170],
  [1845, 519, 409, 553, 372, 391],
  [2246, 647, 537, 674, 492, 515],
  [2596, 784, 649, 779, 597, 623],
  [3303, 1060, 925, 1041, 859, 892],
  [3653, 1224, 1062, 1170, 989, 1025],
]
const FORTNIGHTLY: number[][] = [
  [232, 34, 0, 70, 0, 0],
  [740, 132, 2, 222, 2, 2],
  [1344, 286, 120, 404, 94, 94],
  [2268, 584, 362, 680, 316, 340],
  [4238, 1214, 994, 1272, 908, 950],
  [7304, 2448, 2122, 2340, 1976, 2050],
]
const MONTHLY: number[][] = [
  [502.67, 74, 0, 152, 0, 0],
  [810.33, 121, 0, 243, 0, 0],
  [1603.33, 286, 4, 481, 4, 4],
  [4034.33, 984, 503, 1209, 420, 425],
  [9732.67, 2804, 2327, 2921, 2132, 2232],
  [15829.67, 5304, 4602, 5070, 4286, 4442],
]
const SCALES: TaxScale[] = [1, 2, 3, 5, 6]

describe('taxEngine: ATO sample data', () => {
  for (const [name, cycle, table] of [
    ['weekly', 'weekly', WEEKLY],
    ['fortnightly', 'fortnightly', FORTNIGHTLY],
    ['monthly', 'monthly', MONTHLY],
  ] as const) {
    it(name, () => {
      for (const [earnings, ...expected] of table) {
        SCALES.forEach((scale, i) => {
          expect(w(earnings, cycle, scale), `${name} ${earnings} scale ${scale}`).toBe(expected[i])
        })
      }
    })
  }

  it('weekly $1,000 on scale 2 is $138', () => {
    expect(w(1000, 'weekly', 2)).toBe(138)
  })
})

describe('taxEngine: ATO worked examples', () => {
  it('A: weekly scale 2 with study loan', () => {
    expect(weeklyLoan(2608, 2, C)).toBe(193)
    expect(w(2608.36, 'weekly', 2, { studyLoan: true })).toBe(847)
  })

  it('B: fortnightly scale 5 with offsets', () => {
    expect(w(1299.3, 'fortnightly', 5, { annualOffsetCents: 164500 })).toBe(23)
  })

  it('C: monthly scale 2 with offsets', () => {
    expect(w(5400.33, 'monthly', 2, { annualOffsetCents: 136500 })).toBe(827)
  })

  it('F: monthly scale 1, loan component', () => {
    // 10,627.88 monthly -> weekly whole dollars 2,452
    expect(weeklyLoan(2452, 1, C)).toBe(226)
    expect(Math.round((weeklyLoan(2452, 1, C) * 13) / 3)).toBe(979)
  })

  it('never goes below zero and ignores offsets for scale 1 and 3', () => {
    expect(w(400, 'weekly', 2, { annualOffsetCents: 5_000_000 })).toBe(0)
    expect(w(1000, 'weekly', 1, { annualOffsetCents: 5_000_000 })).toBe(w(1000, 'weekly', 1))
  })
})

describe('computePeriod: two jobs', () => {
  it('taxes each job separately: A claims tax-free threshold, B does not', () => {
    const rate = (cents: number) => ({ ...EMPTY_RATE, weekday: cents })
    const base = {
      date: '2026-11-09', // Monday
      part: 1 as const,
      checkIn: '09:00',
      checkOut: '10:00',
      breakMinutes: 0,
      publicHoliday: false,
      overtimeMinutes: 0,
    }
    const res = computePeriod(
      {
        startDate: '2026-11-02',
        endDate: '2026-11-15',
        payCycle: 'fortnightly',
        shifts: [
          { ...base, jobId: 'a', rate: rate(134400) }, // $1,344 gross
          { ...base, jobId: 'b', rate: rate(74000) }, // $740 gross
        ],
      },
      [
        { id: 'a', claimsTaxFreeThreshold: true },
        { id: 'b', claimsTaxFreeThreshold: false },
      ],
      DEFAULT_TAX_PROFILE,
      [C],
    )
    // ATO fortnightly sample: $1,344 scale 2 = $120; $740 scale 1 = $132.
    expect(res.byJob.a.taxCents).toBe(12000)
    expect(res.byJob.b.taxCents).toBe(13200)
    expect(res.byJob.a.scale).toBe(2)
    expect(res.byJob.b.scale).toBe(1)
    expect(res.taxCents).toBe(25200)
    expect(res.grossCents).toBe(208400)
    expect(res.netCents).toBe(208400 - 25200)
  })

  it('taxes a foreign resident on scale 3 and adds a study loan for a resident', () => {
    const rate = (cents: number) => ({ ...EMPTY_RATE, weekday: cents })
    const period = {
      startDate: '2026-11-02',
      endDate: '2026-11-15',
      payCycle: 'fortnightly' as const,
      shifts: [
        {
          date: '2026-11-09',
          part: 1 as const,
          jobId: 'a',
          checkIn: '09:00',
          checkOut: '10:00',
          breakMinutes: 0,
          publicHoliday: false,
          overtimeMinutes: 0,
          rate: rate(134400),
        },
      ],
    }
    const jobs = [{ id: 'a', claimsTaxFreeThreshold: true }]
    const foreign = computePeriod(
      period,
      jobs,
      { ...DEFAULT_TAX_PROFILE, residency: 'foreign' },
      [C],
    )
    expect(foreign.byJob.a.scale).toBe(3)
    expect(foreign.taxCents).toBe(w(1344, 'fortnightly', 3) * 100)

    const withLoan = computePeriod(
      period,
      jobs,
      { ...DEFAULT_TAX_PROFILE, studyLoan: true },
      [C],
    )
    expect(withLoan.taxCents).toBe(w(1344, 'fortnightly', 2, { studyLoan: true }) * 100)
  })
})
