const STORAGE_KEY = 'mypay.bootstrap'
/** Bump when BootstrapCache changes shape, so copies saved by an older build are ignored. */
const STORAGE_VERSION = 1

type Stored<T> = { v: number; email: string; data: T }

export function readStoredBootstrap<T>(email: string): T | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return undefined
    const stored = JSON.parse(raw) as Stored<T>
    return stored.v === STORAGE_VERSION && stored.email === email ? stored.data : undefined
  } catch {
    return undefined
  }
}

export function writeStoredBootstrap<T>(email: string, data: T) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: STORAGE_VERSION, email, data }))
  } catch {
    // Storage full or blocked. The next load fetches from the API.
  }
}

export function clearStoredBootstrap() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage blocked.
  }
}
