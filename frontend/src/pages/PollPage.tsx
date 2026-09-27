import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import { CopyLink } from '../components/CopyLink'
import { Icon } from '../components/Icon'
import { ManagePanel } from '../components/ManagePanel'
import { fadeIn, settle } from '../components/motion'
import { OptionList } from '../components/OptionList'
import { Topbar } from '../components/Topbar'
import { usePoll } from '../hooks/usePoll'
import { api, ApiError, shareUrl, type Pool } from '../services/api'
import {
  getAdminToken,
  getVotedOption,
  removeOwnedPool,
  saveVotedOption,
  UNKNOWN_OPTION,
} from '../services/storage'
import './PollPage.css'

const closeFormat = new Intl.DateTimeFormat('es', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

function describeStatus(pool: Pool): string {
  if (!pool.is_open) return 'Votación cerrada'
  if (pool.closes_at) return `Abierta hasta el ${closeFormat.format(new Date(pool.closes_at))}`
  return 'Abierta'
}

export function PollPage() {
  const { shareCode = '' } = useParams()
  const navigate = useNavigate()
  const { pool, setPool, status, error, refresh } = usePoll(shareCode)
  const [adminToken] = useState(() => getAdminToken(shareCode))
  const [votedId, setVotedId] = useState(() => getVotedOption(shareCode))
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [voteMessage, setVoteMessage] = useState<{ tone: 'ok' | 'info' | 'error'; text: string } | null>(
    null,
  )

  useEffect(() => {
    if (status === 'not-found') removeOwnedPool(shareCode)
  }, [status, shareCode])

  if (status === 'loading') {
    return (
      <div className="shell">
        <Topbar />
        <main className="poll-page">
          <p className="hint poll-loading">Cargando encuesta…</p>
        </main>
      </div>
    )
  }

  if (status === 'not-found' || status === 'error' || !pool) {
    return (
      <div className="shell">
        <Topbar />
        <motion.main className="poll-page poll-empty" {...fadeIn} transition={settle}>
          <Icon name={status === 'not-found' ? 'search_off' : 'cloud_off'} size={28} />
          <h1 className="poll-empty-title">
            {status === 'not-found' ? 'Esta encuesta no existe o fue eliminada.' : 'No se pudo cargar la encuesta.'}
          </h1>
          <p className="hint">
            {status === 'not-found'
              ? 'Revisa que el link esté completo.'
              : (error ?? 'Revisa tu conexión e inténtalo de nuevo.')}
          </p>
          <div className="poll-empty-actions">
            {status === 'error' && (
              <button type="button" className="btn" onClick={() => void refresh()}>
                Reintentar
              </button>
            )}
            <Link to="/" className="btn btn-primary">
              Crear una encuesta
            </Link>
          </div>
        </motion.main>
      </div>
    )
  }

  const canVote = pool.is_open && votedId === null

  async function handleVote() {
    if (selectedId === null || submitting) return
    setSubmitting(true)
    setVoteMessage(null)
    try {
      await api.vote(shareCode, selectedId)
      saveVotedOption(shareCode, selectedId)
      setVotedId(selectedId)
      setVoteMessage({ tone: 'ok', text: 'Tu voto quedó registrado.' })
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 409 && pool?.is_open) {
        saveVotedOption(shareCode, UNKNOWN_OPTION)
        setVotedId(UNKNOWN_OPTION)
        setVoteMessage({ tone: 'info', text: 'Ya se registró un voto desde tu conexión.' })
      } else if (caught instanceof ApiError && caught.status === 409) {
        setVoteMessage({ tone: 'info', text: 'La votación está cerrada.' })
      } else {
        setVoteMessage({ tone: 'error', text: 'No se pudo registrar el voto. Inténtalo de nuevo.' })
      }
    } finally {
      setSubmitting(false)
      setSelectedId(null)
      void refresh()
    }
  }

  return (
    <div className="shell">
      <Topbar />
      <motion.main className="poll-page" {...fadeIn} transition={settle}>
        <header className="poll-header">
          <p className={pool.is_open ? 'poll-status is-open' : 'poll-status'}>
            <span className="poll-status-dot" aria-hidden="true" />
            {describeStatus(pool)}
          </p>
          <h1 className="poll-title">{pool.name}</h1>
          {pool.description && <p className="poll-description">{pool.description}</p>}
        </header>

        <OptionList
          options={pool.options}
          totalVotes={pool.total_votes}
          selectable={canVote}
          selectedId={selectedId}
          votedId={votedId}
          onSelect={setSelectedId}
        />

        <div className="poll-vote-bar">
          <p className="poll-total">
            {pool.total_votes} {pool.total_votes === 1 ? 'voto' : 'votos'} en total
          </p>
          <AnimatePresence mode="wait" initial={false}>
            {canVote ? (
              <motion.div key="vote" {...fadeIn} transition={settle}>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={selectedId === null || submitting}
                  onClick={() => void handleVote()}
                >
                  {submitting ? 'Votando…' : 'Votar'}
                </button>
              </motion.div>
            ) : (
              voteMessage && (
                <motion.p
                  key={voteMessage.text}
                  className={`poll-vote-message is-${voteMessage.tone}`}
                  role="status"
                  {...fadeIn}
                  transition={settle}
                >
                  <Icon name={voteMessage.tone === 'ok' ? 'check' : 'info'} size={16} />
                  {voteMessage.text}
                </motion.p>
              )
            )}
          </AnimatePresence>
        </div>

        {canVote && voteMessage?.tone === 'error' && (
          <p className="error" role="alert">
            <Icon name="error" size={16} />
            {voteMessage.text}
          </p>
        )}

        <section className="poll-share" aria-label="Compartir">
          <span className="field-label">Comparte el link para que más personas voten</span>
          <CopyLink url={shareUrl(pool.share_code)} />
        </section>

        {adminToken && (
          <ManagePanel
            pool={pool}
            adminToken={adminToken}
            onUpdated={setPool}
            onDeleted={() => {
              removeOwnedPool(pool.share_code)
              navigate('/', { replace: true })
            }}
          />
        )}
      </motion.main>
    </div>
  )
}
