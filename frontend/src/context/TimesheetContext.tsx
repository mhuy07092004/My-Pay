import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'
import {
  createPeriod,
  deletePeriod,
  saveActual,
  saveDay,
  type PeriodPayload,
} from '../lib/api'
import { periodFromPayload, toReportContext } from '../lib/pay'
import { useBootstrap, usePatchBootstrap } from '../lib/queries'
import { toIsoDate, type DateRange, type Period, type Shift } from '../lib/timesheet'
import { useAuth } from './AuthContext'
import { usePayData } from './PayDataContext'

type TimesheetContextValue = {
  periods: Period[]
  loading: boolean
  error: boolean
  retry: () => void
  /** Creates the period, then saves each given day. Returns the new period id. */
  addPeriod: (range: DateRange, shifts: Record<string, Shift>) => Promise<string>
  removePeriod: (periodId: string) => Promise<void>
  saveShift: (periodId: string, isoDate: string, shift: Shift | null) => Promise<void>
  setActual: (periodId: string, amount: number | undefined) => Promise<void>
}

const TimesheetContext = createContext<TimesheetContextValue | null>(null)

function upsert(periods: PeriodPayload[], next: PeriodPayload): PeriodPayload[] {
  return periods.some((period) => period.id === next.id)
    ? periods.map((period) => (period.id === next.id ? next : period))
    : [...periods, next]
}

export function TimesheetProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { taxContext, holidays } = usePayData()
  const query = useBootstrap()
  const patch = usePatchBootstrap()

  const retry = useCallback(() => {
    void query.refetch()
  }, [query])

  const ctx = useMemo(
    () => toReportContext(taxContext, holidays),
    [taxContext, holidays],
  )

  const periods = useMemo(() => {
    if (!query.data || !user) return []
    return query.data.periods.map((period) => periodFromPayload(period, ctx))
  }, [query.data, user, ctx])

  const addPeriod = useCallback(
    async (range: DateRange, shifts: Record<string, Shift>) => {
      const period = await createPeriod(toIsoDate(range.start), toIsoDate(range.end), shifts)
      patch((prev) => ({ ...prev, periods: upsert(prev.periods, period) }))
      return period.id
    },
    [patch],
  )

  const removePeriod = useCallback(
    async (periodId: string) => {
      await deletePeriod(periodId)
      patch((prev) => ({ ...prev, periods: prev.periods.filter((period) => period.id !== periodId) }))
    },
    [patch],
  )

  const saveShift = useCallback(
    async (periodId: string, isoDate: string, shift: Shift | null) => {
      const period = await saveDay(periodId, isoDate, shift)
      patch((prev) => ({ ...prev, periods: upsert(prev.periods, period) }))
    },
    [patch],
  )

  const setActual = useCallback(
    async (periodId: string, amount: number | undefined) => {
      const period = await saveActual(periodId, amount)
      patch((prev) => ({ ...prev, periods: upsert(prev.periods, period) }))
    },
    [patch],
  )

  const value = useMemo(
    () => ({
      periods,
      loading: query.isLoading,
      error: query.isError,
      retry,
      addPeriod,
      removePeriod,
      saveShift,
      setActual,
    }),
    [periods, query.isLoading, query.isError, retry, addPeriod, removePeriod, saveShift, setActual],
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
