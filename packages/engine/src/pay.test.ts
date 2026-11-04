import { describe, expect, it } from 'vitest'
import { calcShift, EMPTY_RATE, type RateSnapshot } from './pay'
import { computePeriod, DEFAULT_TAX_PROFILE, type PeriodShift } from './period'
import { PAYG_2026_27 } from './index'

/** Fast Food casual, Level 1, 21+ (SPEC section 9). */
const RATE_A: RateSnapshot = {
  weekday: 3476,
  night1: 3476,
  night2: 3476,
  saturday: 4172,
  sunday: 4172,
  publicHoliday: 7648,
  otFirst2: 4867,
  otAfter2: 6257,
  otSunday: 6257,
  otPublicHoliday: 7648,
  overtimeEnabled: true,
}

const RATE_B: RateSnapshot = {
  ...EMPTY_RATE,
  weekday: 2000,
  night1: 2500,
  night2: 2600,
  saturday: 3000,
  sunday: 3500,
  publicHoliday: 6000,
  otFirst2: 4500,
  otAfter2: 5000,
  overtimeEnabled: true,
}

const SAT = '2026-11-07'
const SUN = '2026-11-08'
const FRI = '2026-11-06'

const shift = (over: Partial<Parameters<typeof calcShift>[0]>) =>
  calcShift({
    date: SAT,
    checkIn: '08:00',
    checkOut: '18:30',
    breakMinutes: 30,
    publicHoliday: false,
    overtimeMinutes: 0,
    rate: RATE_A,
    ...over,
  })

describe('payEngine: Saturday scenario (workplace A and B)', () => {
  it('A: 10h worked, 2h overtime at the first-2h rate', () => {
    const r = shift({ overtimeMinutes: 120 })
    expect(r.cents).toBe(43110) // 8h x 41.72 + 2h x 48.67
    expect(r.minutes).toBe(600)
  })

  it('B: 5h with 2h overtime on a custom rate', () => {
    const r = shift({
      checkIn: '19:00',
      checkOut: '00:00',
      breakMinutes: 0,
      overtimeMinutes: 120,
      rate: RATE_B,
    })
    expect(r.cents).toBe(18000) // 3h x 30 + 2h x 45
  })

  it('public holiday on: whole shift at the holiday rates', () => {
    expect(shift({ overtimeMinutes: 120, publicHoliday: true }).cents).toBe(76480 * 1)
  })

  it('3h overtime splits into first 2h and after 2h', () => {
    expect(shift({ overtimeMinutes: 180 }).cents).toBe(45195)
  })

  it('no overtime: all hours at the Saturday rate', () => {
    expect(shift({}).cents).toBe(41720)
  })

  it('ignores overtime when the rate has overtime disabled', () => {
    const r = shift({ overtimeMinutes: 120, rate: { ...RATE_A, overtimeEnabled: false } })
    expect(r.cents).toBe(41720)
  })

  it('caps overtime at worked minutes', () => {
    const r = shift({ checkOut: '10:00', breakMinutes: 0, overtimeMinutes: 600 })
    expect(r.cents).toBe(9734) // 2h worked, all first-2h overtime
  })
})

describe('payEngine: day / night / overnight', () => {
  it('Sunday overtime uses the Sunday OT rate', () => {
    const r = shift({ date: SUN, checkIn: '09:00', checkOut: '17:00', breakMinutes: 0, overtimeMinutes: 60 })
    expect(r.cents).toBe(7 * 4172 + 6257)
  })

  it('Friday evening shift crossing into Saturday', () => {
    const r = shift({ date: FRI, checkIn: '20:00', checkOut: '02:00', breakMinutes: 0, rate: RATE_B })
    // 2h weekday + 2h night1 + 2h Saturday
    expect(r.cents).toBe(2 * 2000 + 2 * 2500 + 2 * 3000)
  })

  it('Monday night into Tuesday early morning uses night1 then night2', () => {
    const r = shift({ date: '2026-11-09', checkIn: '23:00', checkOut: '03:00', breakMinutes: 0, rate: RATE_B })
    expect(r.cents).toBe(2500 + 3 * 2600)
  })

  it('returns zero for an empty shift', () => {
    expect(shift({ checkIn: '09:00', checkOut: '09:00' }).cents).toBe(0)
  })

  it('prices a gazetted Christmas Day without the checkbox', () => {
    const r = calcShift(
      {
        date: '2026-12-25',
        checkIn: '09:00',
        checkOut: '17:00',
        breakMinutes: 0,
        publicHoliday: false,
        overtimeMinutes: 0,
        rate: RATE_B,
      },
      0,
      [{ date: '2026-12-25', name: 'Christmas Day', fromMinute: null }],
    )
    expect(r.cents).toBe(8 * 6000)
  })

  it('prices only the minutes after midnight on a holiday', () => {
    const r = calcShift(
      {
        date: '2026-12-24',
        checkIn: '22:00',
        checkOut: '02:00',
        breakMinutes: 0,
        publicHoliday: false,
        overtimeMinutes: 0,
        rate: RATE_B,
      },
      0,
      [{ date: '2026-12-25', name: 'Christmas Day', fromMinute: null }],
    )
    // 2h Thursday night, then 2h Christmas Day
    expect(r.cents).toBe(2 * 2500 + 2 * 6000)
  })

  it('prices a South Australian Christmas Eve only from 19:00', () => {
    const holiday = [{ date: '2026-12-24', name: 'Christmas Eve', fromMinute: 19 * 60 }]
    const before = calcShift(
      {
        date: '2026-12-24',
        checkIn: '16:00',
        checkOut: '19:00',
        breakMinutes: 0,
        publicHoliday: false,
        overtimeMinutes: 0,
        rate: RATE_B,
      },
      0,
      holiday,
    )
    const across = calcShift(
      {
        date: '2026-12-24',
        checkIn: '16:00',
        checkOut: '21:00',
        breakMinutes: 0,
        publicHoliday: false,
        overtimeMinutes: 0,
        rate: RATE_B,
      },
      0,
      holiday,
    )
    expect(before.cents).toBe(3 * 2000)
    expect(across.cents).toBe(3 * 2000 + 2 * 6000)
  })
})

describe('computePeriod: shared first-2h overtime counter', () => {
  it('second shift continues the tier used by the first shift on the same day', () => {
    const base: Omit<PeriodShift, 'part' | 'checkIn' | 'checkOut' | 'overtimeMinutes'> = {
      date: SAT,
      jobId: 'a',
      breakMinutes: 0,
      publicHoliday: false,
      rate: RATE_A,
    }
    const res = computePeriod(
      {
        startDate: '2026-11-02',
        endDate: '2026-11-15',
        payCycle: 'fortnightly',
        shifts: [
          { ...base, part: 1, checkIn: '08:00', checkOut: '12:00', overtimeMinutes: 60 },
          { ...base, part: 2, checkIn: '13:00', checkOut: '17:00', overtimeMinutes: 120 },
        ],
      },
      [{ id: 'a', claimsTaxFreeThreshold: true }],
      DEFAULT_TAX_PROFILE,
      [PAYG_2026_27],
    )
    // shift 1: 3h x 41.72 + 1h x 48.67; shift 2: 2h x 41.72 + 1h x 48.67 + 1h x 62.57
    expect(res.byShift[`${SAT}:1`].cents).toBe(3 * 4172 + 4867)
    expect(res.byShift[`${SAT}:2`].cents).toBe(2 * 4172 + 4867 + 6257)
  })
})
