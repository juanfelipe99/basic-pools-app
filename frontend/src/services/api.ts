const configured = import.meta.env.VITE_API_URL
const API_URL = (configured || (import.meta.env.DEV ? '/api' : '')).replace(/\/$/, '')

export interface PoolOption {
  id: number
  text: string
  position: number
  votes_count: number
  created_at: string
  updated_at: string
}

export interface Pool {
  id: number
  share_code: string
  name: string
  description: string | null
  is_active: boolean
  is_open: boolean
  closes_at: string | null
  user_id: number | null
  options: PoolOption[]
  total_votes: number
  created_at: string
  updated_at: string
}

export interface PoolCreated extends Pool {
  admin_token: string
}

export interface PoolInput {
  name: string
  description: string | null
  closes_at: string | null
  options: { text: string }[]
}

export interface PoolChanges {
  is_active?: boolean
}

export interface Vote {
  id: number
  pool_id: number
  option_id: number
  created_at: string
}

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

interface RequestOptions {
  method?: string
  body?: unknown
  adminToken?: string
}

async function request<T>(path: string, { method = 'GET', body, adminToken }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (adminToken) headers['X-Admin-Token'] = adminToken

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor.')
  }

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorDetail(response))
  }
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

async function readErrorDetail(response: Response): Promise<string> {
  try {
    const data: { detail?: unknown } = await response.json()
    if (typeof data.detail === 'string') return data.detail
    if (Array.isArray(data.detail) && data.detail[0]?.msg) return String(data.detail[0].msg)
  } catch {
    // Body was not JSON; fall through to the generic message
  }
  return `Error ${response.status}`
}

export const api = {
  createPool: (input: PoolInput) =>
    request<PoolCreated>('/pools', { method: 'POST', body: input }),

  getPool: (shareCode: string) =>
    request<Pool>(`/pools/${encodeURIComponent(shareCode)}`),

  updatePool: (shareCode: string, changes: PoolChanges, adminToken: string) =>
    request<Pool>(`/pools/${encodeURIComponent(shareCode)}`, {
      method: 'PATCH',
      body: changes,
      adminToken,
    }),

  deletePool: (shareCode: string, adminToken: string) =>
    request<void>(`/pools/${encodeURIComponent(shareCode)}`, { method: 'DELETE', adminToken }),

  vote: (shareCode: string, optionId: number) =>
    request<Vote>(`/pools/${encodeURIComponent(shareCode)}/votes`, {
      method: 'POST',
      body: { option_id: optionId },
    }),
}

export function shareUrl(shareCode: string): string {
  return `${window.location.origin}/p/${shareCode}`
}
