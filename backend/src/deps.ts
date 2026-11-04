import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Env } from './env'

export type Db = SupabaseClient
export type AuthUser = { id: string; email?: string }

/** External dependencies, injectable so routes can be tested without Supabase. */
export type AppDeps = {
  corsOrigin: string | undefined
  verifyToken: (token: string) => Promise<AuthUser | null>
  createDb: (token: string) => Db
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser
      db?: Db
    }
  }
}

export function supabaseDeps(env: Env): AppDeps {
  const options = { auth: { persistSession: false, autoRefreshToken: false } }
  const base = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, options)
  return {
    corsOrigin: env.CORS_ORIGIN,
    async verifyToken(token) {
      const { data, error } = await base.auth.getClaims(token)
      if (error || !data?.claims?.sub) return null
      const email = data.claims.email
      return { id: data.claims.sub, email: typeof email === 'string' ? email : undefined }
    },
    createDb(token) {
      return createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
        ...options,
        global: { headers: { Authorization: `Bearer ${token}` } },
      })
    },
  }
}
