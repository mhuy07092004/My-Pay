const memory = new Map<string, string>()

function area(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

export function readJson<T>(key: string): T | null {
  try {
    const raw = area()?.getItem(key) ?? memory.get(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function writeJson(key: string, value: unknown): void {
  const raw = JSON.stringify(value)
  memory.set(key, raw)
  try {
    area()?.setItem(key, raw)
  } catch {
    /* private mode keeps the in-memory copy */
  }
}

export function removeKey(key: string): void {
  memory.delete(key)
  try {
    area()?.removeItem(key)
  } catch {
    /* ignore */
  }
}
