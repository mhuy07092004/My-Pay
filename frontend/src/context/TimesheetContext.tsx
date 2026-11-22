import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'
import { saveActual, saveDay, type PeriodPayload } from '../lib/api'
import { periodFromPayload, toReportContext } from '../lib/pay'
import { useBootstrap, usePatchBootstrap } from '../lib/queries'
import type { Period, Shift } from '../lib/timesheet'
import { useAuth } from './AuthContext'
import { usePayData } from './PayDataContext'

type TimesheetContextValue = {
  periods: Period[]
  loading: boolean
  error: boolean
  retry: () => void
  /** Saves the one or two shifts of a day. Periods are created and removed per job. */
  saveDay: (isoDate: string, shift: Shift | null) => Promise<void>
  setActual: (periodId: string, amount: number | undefined) => Promise<void>
}

const TimesheetContext = createContext<TimesheetContextValue | null>(null)

function upsertMany(periods: PeriodPayload[], next: PeriodPayload[], deleted: string[]): PeriodPayload[] {
  const gone = new Set(deleted)
  const byId = new Map(periods.filter((period) => !gone.has(period.id)).map((period) => [period.id, period]))
  for (const period of next) byId.set(period.id, period)
  return [...byId.values()]
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

  const saveDayShift = useCallback(
    async (isoDate: string, shift: Shift | null) => {
      const saved = await saveDay(isoDate, shift)
      patch((prev) => ({ ...prev, periods: upsertMany(prev.periods, saved.periods, saved.deleted) }))
    },
    [patch],
  )

  const setActual = useCallback(
    async (periodId: string, amount: number | undefined) => {
      const period = await saveActual(periodId, amount)
      patch((prev) => ({
        ...prev,
        periods: prev.periods.map((item) => (item.id === period.id ? period : item)),
      }))
    },
    [patch],
  )

  const value = useMemo(
    () => ({
      periods,
      loading: query.isLoading,
      error: query.isError,
      retry,
      saveDay: saveDayShift,
      setActual,
    }),
    [periods, query.isLoading, query.isError, retry, saveDayShift, setActual],
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
