import type { Session } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '../lib/supabaseClient'

export type AuthUser = {
  email: string
  firstName: string
  lastName: string
}

export type SignUpInput = {
  firstName: string
  lastName: string
  email: string
  password: string
}

type AuthContextValue = {
  user: AuthUser | null
  /** True until the stored session has been read. */
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  /** Resolves true when the project requires email confirmation first. */
  signUp: (input: SignUpInput) => Promise<{ needsConfirmation: boolean }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function toUser(session: Session | null): AuthUser | null {
  const u = session?.user
  if (!u?.email) return null
  const meta = u.user_metadata as { first_name?: string; last_name?: string }
  return {
    email: u.email,
    firstName: meta.first_name ?? u.email.split('@')[0],
    lastName: meta.last_name ?? '',
  }
}

function authError(error: { code?: string; message: string }): Error {
  switch (error.code) {
    case 'invalid_credentials':
      return new Error('auth.errors.invalidCredentials')
    case 'user_already_exists':
    case 'email_exists':
      return new Error('auth.errors.emailInUse')
    case 'weak_password':
      return new Error('auth.errors.weakPassword')
    case 'email_address_invalid':
      return new Error('auth.errors.invalidEmail')
    default:
      return new Error('auth.errors.unexpected')
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const seenUser = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    const id = session?.user?.id ?? null
    if (seenUser.current !== undefined && seenUser.current !== id) queryClient.clear()
    seenUser.current = id
  }, [session, queryClient])

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setLoading(false)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw authError(error)
  }, [])

  const signUp = useCallback(async (input: SignUpInput) => {
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { first_name: input.firstName, last_name: input.lastName } },
    })
    if (error) throw authError(error)
    return { needsConfirmation: data.session === null }
  }, [])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user: toUser(session), loading, login, signUp, logout }),
    [session, loading, login, signUp, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
