import type { CoeffSet, PublicHoliday } from '@my-pay/engine'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  createSaving,
  deleteSaving,
  getBootstrap,
  listSavings,
  updateSaving,
  type BootstrapResponse,
  type PeriodPayload,
  type Profile,
  type Saving,
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

export function savingsKey(email: string | null) {
  return ['savings', email] as const
}

export function useSavings() {
  const { user } = useAuth()
  const email = user?.email ?? null
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: savingsKey(email),
    queryFn: listSavings,
    enabled: email !== null,
  })

  const patch = useCallback(
    (next: Saving[]) => {
      if (!email) return
      queryClient.setQueryData<Saving[]>(savingsKey(email), next)
    },
    [email, queryClient],
  )

  const add = useCallback(
    async (body: { name: string; price: number; note?: string }) => {
      const saving = await createSaving(body)
      patch([saving, ...(queryClient.getQueryData<Saving[]>(savingsKey(email)) ?? [])])
      return saving
    },
    [email, patch, queryClient],
  )

  const update = useCallback(
    async (id: string, body: { name: string; price: number; note?: string }) => {
      const saving = await updateSaving(id, body)
      const prev = queryClient.getQueryData<Saving[]>(savingsKey(email)) ?? []
      patch(prev.map((item) => (item.id === id ? saving : item)))
      return saving
    },
    [email, patch, queryClient],
  )

  const remove = useCallback(
    async (id: string) => {
      await deleteSaving(id)
      const prev = queryClient.getQueryData<Saving[]>(savingsKey(email)) ?? []
      patch(prev.filter((item) => item.id !== id))
    },
    [email, patch, queryClient],
  )

  return {
    savings: query.data ?? [],
    loading: query.isLoading,
    error: query.isError,
    add,
    update,
    remove,
    retry: () => void query.refetch(),
  }
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
