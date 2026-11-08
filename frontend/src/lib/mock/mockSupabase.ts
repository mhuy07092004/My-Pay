import type { Session } from '@supabase/supabase-js'
import type { AppSupabase } from '../supabaseClient'
import { readJson, removeKey, writeJson } from './storage'

const USERS_KEY = 'mypay-mock:users'
const SESSION_KEY = 'mypay-mock:session'

type StoredUser = {
  id: string
  email: string
  password: string
  firstName: string
  lastName: string
  createdAt: string
}

const DEMO: StoredUser = {
  id: '00000000-0000-4000-8000-0000000000aa',
  email: 'demo@mypay.test',
  password: 'demopass',
  firstName: 'Demo',
  lastName: 'Nguyen',
  createdAt: '2026-01-01T00:00:00.000Z',
}

type Listener = (event: string, session: Session | null) => void
const listeners = new Set<Listener>()

function loadUsers(): StoredUser[] {
  const users = readJson<StoredUser[]>(USERS_KEY) ?? []
  if (users.some((user) => user.email === DEMO.email)) return users
  const next = [...users, DEMO]
  writeJson(USERS_KEY, next)
  return next
}

function toSession(user: StoredUser): Session {
  return {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 60 * 60,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
    token_type: 'bearer',
    user: {
      id: user.id,
      aud: 'authenticated',
      role: 'authenticated',
      email: user.email,
      email_confirmed_at: user.createdAt,
      phone: '',
      confirmed_at: user.createdAt,
      last_sign_in_at: new Date().toISOString(),
      app_metadata: {},
      user_metadata: { first_name: user.firstName, last_name: user.lastName },
      identities: [],
      created_at: user.createdAt,
      updated_at: user.createdAt,
      is_anonymous: false,
    },
  } as Session
}

function readSession(): Session | null {
  return readJson<Session>(SESSION_KEY)
}

function emit(session: Session | null) {
  for (const listener of listeners) listener(session ? 'SIGNED_IN' : 'SIGNED_OUT', session)
}

export function currentMockIdentity(): { email: string; firstName: string; lastName: string } | null {
  const session = readSession()
  const email = session?.user?.email
  if (!email) return null
  const meta = (session.user.user_metadata ?? {}) as { first_name?: string; last_name?: string }
  return {
    email,
    firstName: meta.first_name ?? '',
    lastName: meta.last_name ?? '',
  }
}

export const mockSupabase: AppSupabase = {
  auth: {
    async getSession() {
      return { data: { session: readSession() } }
    },
    onAuthStateChange(callback) {
      const session = readSession()
      callback('INITIAL_SESSION', session)
      listeners.add(callback)
      return { data: { subscription: { unsubscribe: () => listeners.delete(callback) } } }
    },
    async signInWithPassword(credentials) {
      const email = credentials.email.trim().toLowerCase()
      const user = loadUsers().find((item) => item.email === email && item.password === credentials.password)
      if (!user) {
        return {
          data: { session: null },
          error: { code: 'invalid_credentials', message: 'Invalid login credentials' },
        }
      }
      const session = toSession(user)
      writeJson(SESSION_KEY, session)
      emit(session)
      return { data: { session }, error: null }
    },
    async signUp(credentials) {
      const email = credentials.email.trim().toLowerCase()
      if (!email.includes('@')) {
        return {
          data: { session: null },
          error: { code: 'email_address_invalid', message: 'Invalid email' },
        }
      }
      if (credentials.password.length < 6) {
        return {
          data: { session: null },
          error: { code: 'weak_password', message: 'Password should be at least 6 characters' },
        }
      }
      const users = loadUsers()
      if (users.some((item) => item.email === email)) {
        return {
          data: { session: null },
          error: { code: 'email_exists', message: 'User already registered' },
        }
      }
      const meta = credentials.options?.data ?? {}
      const user: StoredUser = {
        id: crypto.randomUUID(),
        email,
        password: credentials.password,
        firstName: typeof meta.first_name === 'string' ? meta.first_name : '',
        lastName: typeof meta.last_name === 'string' ? meta.last_name : '',
        createdAt: new Date().toISOString(),
      }
      writeJson(USERS_KEY, [...users, user])
      const session = toSession(user)
      writeJson(SESSION_KEY, session)
      emit(session)
      return { data: { session }, error: null }
    },
    async signOut() {
      removeKey(SESSION_KEY)
      emit(null)
      return { error: null }
    },
    async resetPasswordForEmail() {
      return { error: null }
    },
    async updateUser(attributes) {
      const session = readSession()
      const email = session?.user?.email
      const users = loadUsers()
      const user = email ? users.find((item) => item.email === email) : undefined
      if (!user) return { error: { message: 'No session' } }
      if (attributes.password !== undefined) {
        if (attributes.password.length < 6) {
          return {
            error: { code: 'weak_password', message: 'Password should be at least 6 characters' },
          }
        }
        user.password = attributes.password
      }
      if (attributes.data?.first_name !== undefined) user.firstName = attributes.data.first_name
      if (attributes.data?.last_name !== undefined) user.lastName = attributes.data.last_name
      writeJson(USERS_KEY, users)
      const next = toSession(user)
      writeJson(SESSION_KEY, next)
      emit(next)
      return { error: null }
    },
  },
}
