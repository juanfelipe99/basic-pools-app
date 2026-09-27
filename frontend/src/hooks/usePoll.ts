import { useCallback, useEffect, useRef, useState } from 'react'

import { api, ApiError, type Pool } from '../services/api'

export type PollStatus = 'loading' | 'ready' | 'not-found' | 'error'

const REFRESH_MS = 4000

export function usePoll(shareCode: string) {
  const [pool, setPool] = useState<Pool | null>(null)
  const [status, setStatus] = useState<PollStatus>('loading')
  const [error, setError] = useState<string | null>(null)
  const inFlight = useRef(false)

  const refresh = useCallback(async () => {
    if (inFlight.current) return
    inFlight.current = true
    try {
      setPool(await api.getPool(shareCode))
      setStatus('ready')
      setError(null)
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 404) {
        setStatus('not-found')
      } else {
        setError(caught instanceof ApiError ? caught.message : 'No se pudo cargar la encuesta.')
        setStatus((current) => (current === 'loading' ? 'error' : current))
      }
    } finally {
      inFlight.current = false
    }
  }, [shareCode])

  useEffect(() => {
    setStatus('loading')
    setPool(null)
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (status !== 'ready') return
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh()
    }, REFRESH_MS)
    return () => window.clearInterval(interval)
  }, [status, refresh])

  return { pool, setPool, status, error, refresh }
}
