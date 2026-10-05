export type Status = 'fullTime' | 'partTime' | 'casual'

export const STATUS_OPTIONS: Status[] = ['fullTime', 'partTime', 'casual']
export const LEVEL_OPTIONS = ['1', '2', '3'] as const

export type OrdinaryPay = {
  night1: number
  night2: number
  saturday: number
  sunday: number
  publicHoliday: number
}

export type OvertimePay = {
  first2: number
  after2: number
  sunday: number
  publicHoliday: number
}

export type PayRates = { ordinary: OrdinaryPay; overtime: OvertimePay }

export type SavedRate = {
  id: string
  name: string
  pay: PayRates
  overtimeEnabled: boolean
  kind: 'preset' | 'custom'
  status: string
  level: string
  age: string
}

export const PRESET_ID = 'fast-food'
export const CUSTOM_ID = 'custom'

export const EMPTY_PAY: PayRates = {
  ordinary: { night1: 0, night2: 0, saturday: 0, sunday: 0, publicHoliday: 0 },
  overtime: { first2: 0, after2: 0, sunday: 0, publicHoliday: 0 },
}

const round = (n: number) => Math.round(n * 100) / 100

// Placeholder until the database API exists.
export function getPresetPay(status: Status, level: string, age: number): PayRates {
  const base = 22 + Number(level) * 1.5 + (status === 'casual' ? 5.5 : 0)
  const factor = age >= 21 ? 1 : Math.max(0.5, age / 21)
  const b = base * factor
  return {
    ordinary: {
      night1: round(b * 1.15),
      night2: round(b * 1.3),
      saturday: round(b * 1.25),
      sunday: round(b * 1.5),
      publicHoliday: round(b * 2.25),
    },
    overtime: {
      first2: round(b * 1.5),
      after2: round(b * 2),
      sunday: round(b * 2),
      publicHoliday: round(b * 2.5),
    },
  }
}

export const SEED_RATES: SavedRate[] = [
  {
    id: PRESET_ID,
    name: 'Fast Food Industry',
    pay: getPresetPay('fullTime', '1', 21),
    overtimeEnabled: true,
    kind: 'preset',
    status: 'fullTime',
    level: '1',
    age: '21',
  },
]
