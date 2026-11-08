import type { CoeffSet, JobTaxInfo, PublicHoliday, RateSnapshot, TaxProfile } from '@my-pay/engine'
import { useQueryClient } from '@tanstack/react-query'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'
import {
  createJob,
  deleteJob,
  getHolidays,
  saveTaxProfile as saveTaxProfileApi,
  updateJob,
  updateProfile,
  type Profile,
  type TaxProfileDto,
} from '../lib/api'
import type { TaxContext, RateLookup } from '../lib/pay'
import { bootstrapKey, useBootstrap, usePatchBootstrap } from '../lib/queries'
import { snapshotFromRate, type SavedRate } from '../lib/rates'
import { useAuth } from './AuthContext'

const EMPTY_PROFILE: TaxProfileDto = {
  residency: 'resident',
  studyLoan: false,
  annualOffsetCents: 0,
  medicareVariation: 'none',
  payCycle: 'fortnightly',
}

type PayDataValue = {
  loading: boolean
  error: boolean
  retry: () => void
  profile: Profile | null
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
  saveProfile: (body: Pick<Profile, 'firstName' | 'lastName' | 'state'>) => Promise<Profile>
  reloadHolidays: () => Promise<void>
}

const PayDataContext = createContext<PayDataValue | null>(null)

function withClaim(jobs: SavedRate[], job: SavedRate): SavedRate[] {
  const next = jobs.some((item) => item.id === job.id)
    ? jobs.map((item) => (item.id === job.id ? job : item))
    : [...jobs, job]
  if (!job.claimsTaxFreeThreshold) return next
  return next.map((item) =>
    item.id === job.id ? item : { ...item, claimsTaxFreeThreshold: false },
  )
}

export function PayDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const query = useBootstrap()
  const patch = usePatchBootstrap()
  const queryClient = useQueryClient()
  const email = user?.email ?? null
  const data = query.data

  const retry = useCallback(() => {
    void query.refetch()
  }, [query])

  const addRate = useCallback(
    async (rate: Omit<SavedRate, 'id'>) => {
      const job = await createJob(rate)
      patch((prev) => ({ ...prev, jobs: withClaim(prev.jobs, job) }))
    },
    [patch],
  )

  const updateRate = useCallback(
    async (rate: SavedRate) => {
      const job = await updateJob(rate)
      patch((prev) => ({ ...prev, jobs: withClaim(prev.jobs, job) }))
    },
    [patch],
  )

  const removeRate = useCallback(
    async (id: string) => {
      await deleteJob(id)
      if (email) await queryClient.invalidateQueries({ queryKey: bootstrapKey(email) })
    },
    [email, queryClient],
  )

  const reloadHolidays = useCallback(async () => {
    const holidays = await getHolidays()
    patch((prev) => ({ ...prev, holidays }))
  }, [patch])

  const saveTaxProfile = useCallback(
    async (profile: TaxProfileDto) => {
      const taxProfile = await saveTaxProfileApi(profile)
      patch((prev) => ({
        ...prev,
        taxProfile,
        jobs:
          taxProfile.residency === 'foreign'
            ? prev.jobs.map((job) => ({ ...job, claimsTaxFreeThreshold: false }))
            : prev.jobs,
      }))
    },
    [patch],
  )

  const saveProfile = useCallback(
    async (body: Pick<Profile, 'firstName' | 'lastName' | 'state'>) => {
      const profile = await updateProfile(body)
      const stateChanged = data?.profile.state !== profile.state
      patch((prev) => ({ ...prev, profile }))
      if (stateChanged) await reloadHolidays()
      return profile
    },
    [data?.profile.state, patch, reloadHolidays],
  )

  const value = useMemo<PayDataValue>(() => {
    const rates = data?.jobs ?? []
    const taxProfile = data?.taxProfile ?? EMPTY_PROFILE
    const coeffSets = data?.coeffSets ?? []
    const holidays = data?.holidays ?? []
    const snapshots = new Map<string, RateSnapshot>(rates.map((rate) => [rate.id, snapshotFromRate(rate)]))
    const profile: TaxProfile = {
      residency: taxProfile.residency,
      studyLoan: taxProfile.studyLoan,
      annualOffsetCents: taxProfile.annualOffsetCents,
      medicareVariation: taxProfile.medicareVariation,
    }
    const jobTax: JobTaxInfo[] = rates.map((rate) => ({
      id: rate.id,
      claimsTaxFreeThreshold: rate.claimsTaxFreeThreshold,
    }))
    return {
      loading: query.isLoading,
      error: query.isError,
      retry,
      profile: data?.profile ?? null,
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
      saveProfile,
      reloadHolidays,
    }
  }, [
    data,
    query.isLoading,
    query.isError,
    retry,
    addRate,
    updateRate,
    removeRate,
    saveTaxProfile,
    saveProfile,
    reloadHolidays,
  ])

  return <PayDataContext.Provider value={value}>{children}</PayDataContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePayData() {
  const context = useContext(PayDataContext)
  if (!context) throw new Error('usePayData must be used within PayDataProvider')
  return context
}
