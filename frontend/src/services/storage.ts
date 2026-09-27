export interface OwnedPool {
  shareCode: string
  name: string
  adminToken: string
  createdAt: string
}

const OWNED_KEY = 'pools.owned'
const VOTES_KEY = 'pools.votes'

// 0 means "this browser already voted, but the chosen option is unknown"
export const UNKNOWN_OPTION = 0

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage can be full or disabled (private mode); the app still works without it
  }
}

export function getOwnedPools(): OwnedPool[] {
  return read<OwnedPool[]>(OWNED_KEY, [])
}

export function saveOwnedPool(pool: OwnedPool): void {
  const others = getOwnedPools().filter((owned) => owned.shareCode !== pool.shareCode)
  write(OWNED_KEY, [pool, ...others])
}

export function removeOwnedPool(shareCode: string): void {
  write(
    OWNED_KEY,
    getOwnedPools().filter((owned) => owned.shareCode !== shareCode),
  )
}

export function getAdminToken(shareCode: string): string | null {
  return getOwnedPools().find((owned) => owned.shareCode === shareCode)?.adminToken ?? null
}

export function getVotedOption(shareCode: string): number | null {
  return read<Record<string, number>>(VOTES_KEY, {})[shareCode] ?? null
}

export function saveVotedOption(shareCode: string, optionId: number): void {
  write(VOTES_KEY, { ...read<Record<string, number>>(VOTES_KEY, {}), [shareCode]: optionId })
}
