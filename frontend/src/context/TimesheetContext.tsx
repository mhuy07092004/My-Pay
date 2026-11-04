import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  createPeriod,
  deletePeriod,
  listPeriods,
  saveActual,
  saveDay,
} from '../lib/api'
import { toIsoDate, type DateRange, type Period, type Shift } from '../lib/timesheet'
import { useAuth } from './AuthContext'
import { usePayData } from './PayDataContext'

type TimesheetContextValue = {
  periods: Period[]
  loading: boolean
  /** Creates the period, then saves each given day. Returns the new period id. */
  addPeriod: (range: DateRange, shifts: Record<string, Shift>) => Promise<string>
  removePeriod: (periodId: string) => Promise<void>
  saveShift: (periodId: string, isoDate: string, shift: Shift) => Promise<void>
  setActual: (periodId: string, amount: number | undefined) => Promise<void>
}

const TimesheetContext = createContext<TimesheetContextValue | null>(null)

export function TimesheetProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { version } = usePayData()
  const userEmail = user?.email ?? null
  const [periods, setPeriods] = useState<Period[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userEmail) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPeriods([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    listPeriods()
      .then((list) => {
        if (!cancelled) setPeriods(list)
      })
      .catch((err) => console.error('Failed to load periods', err))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userEmail, version])

  const replace = useCallback((next: Period) => {
    setPeriods((prev) => prev.map((p) => (p.id === next.id ? next : p)))
  }, [])

  const addPeriod = useCallback(async (range: DateRange, shifts: Record<string, Shift>) => {
    const period = await createPeriod(toIsoDate(range.start), toIsoDate(range.end), shifts)
    setPeriods((prev) => [...prev, period])
    return period.id
  }, [])

  const removePeriod = useCallback(async (periodId: string) => {
    await deletePeriod(periodId)
    setPeriods((prev) => prev.filter((p) => p.id !== periodId))
  }, [])

  const saveShift = useCallback(
    async (periodId: string, isoDate: string, shift: Shift) => {
      replace(await saveDay(periodId, isoDate, shift))
    },
    [replace],
  )

  const setActual = useCallback(
    async (periodId: string, amount: number | undefined) => {
      replace(await saveActual(periodId, amount))
    },
    [replace],
  )

  const value = useMemo(
    () => ({ periods, loading, addPeriod, removePeriod, saveShift, setActual }),
    [periods, loading, addPeriod, removePeriod, saveShift, setActual],
  )

  return <TimesheetContext.Provider value={value}>{children}</TimesheetContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTimesheet() {
  const context = useContext(TimesheetContext)
  if (!context) {
    throw new Error('useTimesheet must be used within TimesheetProvider')
  }
  return context
}
