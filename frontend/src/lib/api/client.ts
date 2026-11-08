import { USE_MOCK } from '../mock/flag'
import { supabase } from '../supabaseClient'

export class ApiError extends Error {
  status: number
  code: string
  constructor(status: number, code: string) {
    super(code)
    this.status = status
    this.code = code
  }
}

export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  if (USE_MOCK) {
    const { handleMock } = await import('../mock/mockApi')
    return handleMock<T>(path, options)
  }
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  const response = await fetch(`/api${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  })
  const payload = (await response.json().catch(() => ({}))) as { error?: string }
  if (!response.ok) throw new ApiError(response.status, payload.error ?? 'internal')
  return payload as T
}
