import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { createSeedPeriods } from '../../mock/timesheet'
import type { Period, Shift } from '../lib/timesheet'

const STORAGE_KEY = 'my-pay-periods'

type TimesheetContextValue = {
  periods: Period[]
  addPeriod: (period: Omit<Period, 'id'>) => string
  saveShift: (periodId: string, isoDate: string, shift: Shift) => void
  setActual: (periodId: string, amount: number | undefined) => void
}

const TimesheetContext = createContext<TimesheetContextValue | null>(null)

function readStoredPeriods(): Period[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Period[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {
    // fall through to seed
  }
  return createSeedPeriods()
}

export function TimesheetProvider({ children }: { children: ReactNode }) {
  const [periods, setPeriods] = useState<Period[]>(readStoredPeriods)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(periods))
  }, [periods])

  const addPeriod = useCallback((period: Omit<Period, 'id'>) => {
    const id = `p-${Date.now()}`
    setPeriods((prev) => [...prev, { ...period, id }])
    return id
  }, [])

  const saveShift = useCallback(
    (periodId: string, isoDate: string, shift: Shift) => {
      setPeriods((prev) =>
        prev.map((p) =>
          p.id === periodId ? { ...p, shifts: { ...p.shifts, [isoDate]: shift } } : p,
        ),
      )
    },
    [],
  )

  const setActual = useCallback((periodId: string, amount: number | undefined) => {
    setPeriods((prev) =>
      prev.map((p) => (p.id === periodId ? { ...p, actual: amount } : p)),
    )
  }, [])

  const value = useMemo(
    () => ({ periods, addPeriod, saveShift, setActual }),
    [periods, addPeriod, saveShift, setActual],
  )

  return <TimesheetContext.Provider value={value}>{children}</TimesheetContext.Provider>
}

export function useTimesheet() {
  const context = useContext(TimesheetContext)
  if (!context) {
    throw new Error('useTimesheet must be used within TimesheetProvider')
  }
  return context
}
