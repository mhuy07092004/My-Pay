import type { CoeffSet, PublicHoliday } from '@my-pay/engine'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  getBootstrap,
  type BootstrapResponse,
  type PeriodPayload,
  type Profile,
  type TaxProfileDto,
} from './api'
import { savedRateFromJob, type SavedRate } from './rates'

export type BootstrapCache = {
  profile: Profile
  taxProfile: TaxProfileDto
  jobs: SavedRate[]
  holidays: PublicHoliday[]
  coeffSets: CoeffSet[]
  periods: PeriodPayload[]
}

export function bootstrapKey(email: string | null) {
  return ['bootstrap', email] as const
}

export async function fetchBootstrap(): Promise<BootstrapCache> {
  const raw: BootstrapResponse = await getBootstrap()
  return { ...raw, jobs: raw.jobs.map(savedRateFromJob) }
}

export function useBootstrap() {
  const { user } = useAuth()
  const email = user?.email ?? null
  return useQuery({
    queryKey: bootstrapKey(email),
    queryFn: fetchBootstrap,
    enabled: email !== null,
  })
}

export function usePatchBootstrap() {
  const { user } = useAuth()
  const email = user?.email ?? null
  const queryClient = useQueryClient()
  return useCallback(
    (update: (prev: BootstrapCache) => BootstrapCache) => {
      if (!email) return
      queryClient.setQueryData<BootstrapCache>(bootstrapKey(email), (prev) => (prev ? update(prev) : prev))
    },
    [email, queryClient],
  )
}
