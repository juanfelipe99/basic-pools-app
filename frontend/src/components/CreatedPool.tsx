import { Link } from 'react-router'

import { shareUrl, type PoolCreated } from '../services/api'
import { CopyLink } from './CopyLink'
import { Icon } from './Icon'
import './CreatedPool.css'

interface CreatedPoolProps {
  pool: PoolCreated
  onCreateAnother: () => void
}

export function CreatedPool({ pool, onCreateAnother }: CreatedPoolProps) {
  return (
    <div className="created-pool">
      <header className="created-pool-header">
        <span className="created-pool-badge">
          <Icon name="check" size={16} />
        </span>
        <div>
          <h2 className="panel-title">Encuesta publicada</h2>
          <p className="created-pool-name">{pool.name}</p>
        </div>
      </header>

      <div className="field">
        <span className="field-label">Comparte este link para que voten</span>
        <CopyLink url={shareUrl(pool.share_code)} />
      </div>

      <p className="hint">
        Desde este navegador puedes cerrar la votación o eliminar la encuesta cuando quieras.
      </p>

      <footer className="created-pool-actions">
        <button type="button" className="btn btn-ghost" onClick={onCreateAnother}>
          Crear otra
        </button>
        <Link to={`/p/${pool.share_code}`} className="btn">
          Ver encuesta
          <Icon name="arrow_forward" size={16} />
        </Link>
      </footer>
    </div>
  )
}
