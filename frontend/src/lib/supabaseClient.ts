import { createClient, type Session } from '@supabase/supabase-js'
import { USE_MOCK } from './mock/flag'

type AuthFailure = { code?: string; message: string }

/** Auth surface the app actually calls. Real client and the local mock both satisfy it. */
export type AppSupabase = {
  auth: {
    getSession(): Promise<{ data: { session: Session | null } }>
    onAuthStateChange(
      callback: (event: string, session: Session | null) => void,
    ): { data: { subscription: { unsubscribe(): void } } }
    signInWithPassword(credentials: {
      email: string
      password: string
    }): Promise<{ data: { session: Session | null }; error: AuthFailure | null }>
    signUp(credentials: {
      email: string
      password: string
      options?: { data?: { first_name?: string; last_name?: string } }
    }): Promise<{ data: { session: Session | null }; error: AuthFailure | null }>
    signOut(): Promise<{ error: AuthFailure | null }>
    updateUser(attributes: {
      data?: { first_name?: string; last_name?: string }
    }): Promise<{ error: AuthFailure | null }>
  }
}

async function createSupabase(): Promise<AppSupabase> {
  if (USE_MOCK) {
    const { mockSupabase } = await import('./mock/mockSupabase')
    return mockSupabase
  }
  return createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  ) as AppSupabase
}

export const supabase = await createSupabase()
