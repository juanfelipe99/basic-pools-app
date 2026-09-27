import { useEffect, useState } from 'react'

import { api, ApiError, type Pool } from '../services/api'
import { Icon } from './Icon'
import './ManagePanel.css'

interface ManagePanelProps {
  pool: Pool
  adminToken: string
  onUpdated: (pool: Pool) => void
  onDeleted: () => void
}

export function ManagePanel({ pool, adminToken, onUpdated, onDeleted }: ManagePanelProps) {
  const [busy, setBusy] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!confirmingDelete) return
    const timeout = window.setTimeout(() => setConfirmingDelete(false), 4000)
    return () => window.clearTimeout(timeout)
  }, [confirmingDelete])

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch (caught) {
      setError(
        caught instanceof ApiError && caught.status === 403
          ? 'Este navegador ya no tiene permiso para gestionar la encuesta.'
          : 'No se pudo completar la acción. Inténtalo de nuevo.',
      )
    } finally {
      setBusy(false)
    }
  }

  function toggleActive() {
    void run(async () => {
      onUpdated(await api.updatePool(pool.share_code, { is_active: !pool.is_active }, adminToken))
    })
  }

  function handleDelete() {
    if (!confirmingDelete) {
      setConfirmingDelete(true)
      return
    }
    void run(async () => {
      await api.deletePool(pool.share_code, adminToken)
      onDeleted()
    })
  }

  return (
    <section className="manage" aria-labelledby="manage-title">
      <div className="manage-copy">
        <h2 id="manage-title" className="manage-title">
          <Icon name="key" size={16} />
          Gestionar
        </h2>
        <p className="hint">Solo visible en el navegador donde creaste la encuesta.</p>
      </div>

      <div className="manage-actions">
        <button type="button" className="btn" onClick={toggleActive} disabled={busy}>
          <Icon name={pool.is_active ? 'lock' : 'lock_open'} size={16} />
          {pool.is_active ? 'Cerrar votación' : 'Reabrir votación'}
        </button>
        <button
          type="button"
          className={confirmingDelete ? 'btn btn-danger is-armed' : 'btn btn-danger'}
          onClick={handleDelete}
          disabled={busy}
        >
          <Icon name="delete" size={16} />
          {confirmingDelete ? 'Confirmar eliminación' : 'Eliminar encuesta'}
        </button>
      </div>

      {error && (
        <p className="error manage-error" role="alert">
          <Icon name="error" size={16} />
          {error}
        </p>
      )}
    </section>
  )
}
