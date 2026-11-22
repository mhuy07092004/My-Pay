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
import { readStoredBootstrap, writeStoredBootstrap } from './bootstrapStorage'
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

/** Shows the last saved copy at once and refetches in the background. */
export function useBootstrap() {
  const { user } = useAuth()
  const email = user?.email ?? null
  return useQuery({
    queryKey: bootstrapKey(email),
    queryFn: async () => {
      const data = await fetchBootstrap()
      if (email) writeStoredBootstrap(email, data)
      return data
    },
    enabled: email !== null,
    initialData: () => (email ? readStoredBootstrap<BootstrapCache>(email) : undefined),
    initialDataUpdatedAt: 0,
  })
}

export function usePatchBootstrap() {
  const { user } = useAuth()
  const email = user?.email ?? null
  const queryClient = useQueryClient()
  return useCallback(
    (update: (prev: BootstrapCache) => BootstrapCache) => {
      if (!email) return
      const prev = queryClient.getQueryData<BootstrapCache>(bootstrapKey(email))
      if (!prev) return
      const next = update(prev)
      queryClient.setQueryData<BootstrapCache>(bootstrapKey(email), next)
      writeStoredBootstrap(email, next)
    },
    [email, queryClient],
  )
}
