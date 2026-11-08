import { describe, expect, it } from 'vitest'
import { periodInputFromDto, type RawPeriodDto } from './dto'
import { EMPTY_RATE } from './pay'

describe('periodInputFromDto', () => {
  it('copies stored shifts into an engine period', () => {
    const dto: RawPeriodDto = {
      id: 'p1',
      startDate: '2026-11-02',
      endDate: '2026-11-08',
      payCycle: 'weekly',
      actualCents: 100,
      shifts: [
        {
          date: '2026-11-02',
          part: 1,
          jobId: 'j1',
          checkIn: '09:00',
          checkOut: '17:00',
          breakMinutes: 30,
          publicHoliday: false,
          overtimeMinutes: 0,
          rate: EMPTY_RATE,
        },
      ],
    }
    expect(periodInputFromDto(dto)).toEqual({
      startDate: '2026-11-02',
      endDate: '2026-11-08',
      payCycle: 'weekly',
      shifts: dto.shifts,
    })
  })
})
