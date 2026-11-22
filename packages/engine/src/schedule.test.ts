import { describe, expect, it } from 'vitest'
import { isValidSchedule, paydaysBetween, periodFor, scheduleOffset } from './schedule'

const fortnight = {
  payCycle: 'fortnightly' as const,
  startDate: '2026-12-01',
  payDate: '2026-12-17',
}

describe('periodFor', () => {
  it('repeats a fortnight that is paid three days after it ends', () => {
    expect(scheduleOffset(fortnight)).toBe(3)
    expect(periodFor(fortnight, '2026-12-01')).toEqual({
      startDate: '2026-12-01',
      endDate: '2026-12-14',
      paymentDate: '2026-12-17',
    })
    expect(periodFor(fortnight, '2026-12-14').paymentDate).toBe('2026-12-17')
    expect(periodFor(fortnight, '2026-12-15')).toEqual({
      startDate: '2026-12-15',
      endDate: '2026-12-28',
      paymentDate: '2026-12-31',
    })
  })

  it('walks backwards before the anchor date', () => {
    expect(periodFor(fortnight, '2026-11-30')).toEqual({
      startDate: '2026-11-17',
      endDate: '2026-11-30',
      paymentDate: '2026-12-03',
    })
  })

  it('rejects a payday more than 14 days after the period ends', () => {
    expect(isValidSchedule(fortnight)).toBe(true)
    expect(
      isValidSchedule({ payCycle: 'weekly', startDate: '2026-12-01', payDate: '2026-12-22' }),
    ).toBe(false)
  })
})

describe('paydaysBetween', () => {
  it('lists paydays that fall in the month', () => {
    expect(paydaysBetween(fortnight, '2026-12-01', '2026-12-31').map((p) => p.paymentDate)).toEqual([
      '2026-12-03',
      '2026-12-17',
      '2026-12-31',
    ])
  })
})
