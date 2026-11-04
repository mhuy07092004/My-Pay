import type { CoeffSet, JobTaxInfo, PublicHoliday, RateSnapshot, TaxProfile } from '@my-pay/engine'
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
  DEFAULT_TAX_PROFILE_DTO,
  createJob,
  deleteJob,
  getHolidays,
  getRules,
  getTaxProfile,
  listJobs,
  saveTaxProfile as saveTaxProfileApi,
  updateJob,
  type TaxProfileDto,
} from '../lib/api'
import type { TaxContext, RateLookup } from '../lib/pay'
import { snapshotFromRate, type SavedRate } from '../lib/rates'
import { useAuth } from './AuthContext'

type PayDataValue = {
  loading: boolean
  /** Bumps whenever rates or the tax profile change, so dependent data can reload. */
  version: number
  rates: SavedRate[]
  taxProfile: TaxProfileDto
  coeffSets: CoeffSet[]
  holidays: PublicHoliday[]
  rateOf: RateLookup
  taxContext: TaxContext
  addRate: (rate: Omit<SavedRate, 'id'>) => Promise<void>
  updateRate: (rate: SavedRate) => Promise<void>
  removeRate: (id: string) => Promise<void>
  saveTaxProfile: (profile: TaxProfileDto) => Promise<void>
  reloadHolidays: () => Promise<void>
}

const PayDataContext = createContext<PayDataValue | null>(null)

export function PayDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userEmail = user?.email ?? null
  const [loading, setLoading] = useState(true)
  const [version, setVersion] = useState(0)
  const [rates, setRates] = useState<SavedRate[]>([])
  const [taxProfile, setTaxProfile] = useState<TaxProfileDto>(DEFAULT_TAX_PROFILE_DTO)
  const [coeffSets, setCoeffSets] = useState<CoeffSet[]>([])
  const [holidays, setHolidays] = useState<PublicHoliday[]>([])

  useEffect(() => {
    if (!userEmail) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRates([])
      setTaxProfile(DEFAULT_TAX_PROFILE_DTO)
      setCoeffSets([])
      setHolidays([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    Promise.all([listJobs(true), getTaxProfile(), getRules(), getHolidays()])
      .then(([jobs, tp, rules, days]) => {
        if (cancelled) return
        setRates(jobs)
        setTaxProfile(tp)
        setCoeffSets(rules)
        setHolidays(days)
      })
      .catch((err) => console.error('Failed to load pay data', err))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userEmail])

  const reloadJobs = useCallback(async () => {
    setRates(await listJobs(true))
    setVersion((v) => v + 1)
  }, [])

  const addRate = useCallback(
    async (rate: Omit<SavedRate, 'id'>) => {
      await createJob(rate)
      await reloadJobs()
    },
    [reloadJobs],
  )

  const updateRate = useCallback(
    async (rate: SavedRate) => {
      await updateJob(rate)
      await reloadJobs()
    },
    [reloadJobs],
  )

  const removeRate = useCallback(
    async (id: string) => {
      await deleteJob(id)
      await reloadJobs()
    },
    [reloadJobs],
  )

  const reloadHolidays = useCallback(async () => {
    setHolidays(await getHolidays())
    setVersion((v) => v + 1)
  }, [])

  const saveTaxProfile = useCallback(
    async (profile: TaxProfileDto) => {
      setTaxProfile(await saveTaxProfileApi(profile))
      await reloadJobs()
    },
    [reloadJobs],
  )

  const value = useMemo<PayDataValue>(() => {
    const snapshots = new Map<string, RateSnapshot>(
      rates.map((r) => [r.id, snapshotFromRate(r)]),
    )
    const profile: TaxProfile = {
      residency: taxProfile.residency,
      studyLoan: taxProfile.studyLoan,
      annualOffsetCents: taxProfile.annualOffsetCents,
      medicareVariation: taxProfile.medicareVariation,
    }
    const jobTax: JobTaxInfo[] = rates.map((r) => ({
      id: r.id,
      claimsTaxFreeThreshold: r.claimsTaxFreeThreshold,
    }))
    return {
      loading,
      version,
      rates,
      taxProfile,
      coeffSets,
      holidays,
      rateOf: (id) => snapshots.get(id),
      taxContext: { jobTax, profile, coeffSets },
      addRate,
      updateRate,
      removeRate,
      saveTaxProfile,
      reloadHolidays,
    }
  }, [loading, version, rates, taxProfile, coeffSets, holidays, addRate, updateRate, removeRate, saveTaxProfile, reloadHolidays])

  return <PayDataContext.Provider value={value}>{children}</PayDataContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePayData() {
  const context = useContext(PayDataContext)
  if (!context) throw new Error('usePayData must be used within PayDataProvider')
  return context
}
