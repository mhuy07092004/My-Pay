import { addDays, toIsoDate, type Shift } from '../src/lib/timesheet'

export type Rate = {
  id: string
  name: string
  hourlyRate: number
}

export const MOCK_RATES: Rate[] = [
  { id: 'fast-food', name: 'Fast Food Industry', hourlyRate: 24.5 },
]

export const TAX_RATE = 0.1

export function createSeedShifts(today: Date): Record<string, Shift> {
  const make = (offset: number, checkIn: string, checkOut: string, breakMinutes: number) =>
    [
      toIsoDate(addDays(today, offset)),
      { checkIn, checkOut, breakMinutes, rateId: 'fast-food' },
    ] as const

  return Object.fromEntries([
    make(-12, '20:30', '02:15', 30),
    make(-10, '17:00', '23:00', 30),
    make(-9, '17:00', '23:00', 0),
    make(-6, '09:00', '15:30', 60),
    make(-3, '18:00', '23:30', 30),
  ])
}
