import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'

import type { PoolCreated } from '../services/api'
import { saveOwnedPool } from '../services/storage'
import { CreatedPool } from './CreatedPool'
import { Icon } from './Icon'
import { morph, settle } from './motion'
import { PollForm } from './PollForm'
import './Composer.css'

type Stage = { name: 'idle' } | { name: 'form' } | { name: 'created'; pool: PoolCreated }

interface ComposerProps {
  onStageChange?: (open: boolean) => void
}

export function Composer({ onStageChange }: ComposerProps) {
  const [stage, setStage] = useState<Stage>({ name: 'idle' })
  const open = stage.name !== 'idle'

  useEffect(() => {
    onStageChange?.(open)
  }, [open, onStageChange])

  useEffect(() => {
    if (stage.name !== 'form') return
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setStage({ name: 'idle' })
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [stage.name])

  function handleCreated(pool: PoolCreated) {
    saveOwnedPool({
      shareCode: pool.share_code,
      name: pool.name,
      adminToken: pool.admin_token,
      createdAt: pool.created_at,
    })
    setStage({ name: 'created', pool })
  }

  return (
    // A single element morphs between pill and panel so there is never a second shape on screen
    <motion.div
      layout
      className={open ? 'composer is-open' : 'composer'}
      style={{ borderRadius: open ? 16 : 999 }}
      initial={false}
      animate={{
        backgroundColor: open ? 'var(--surface)' : 'var(--ink)',
        borderColor: open ? 'var(--line)' : 'var(--ink)',
      }}
      transition={morph}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {stage.name === 'idle' ? (
          <motion.button
            key="trigger"
            type="button"
            className="composer-trigger"
            onClick={() => setStage({ name: 'form' })}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.2, delay: 0.25 } }}
            exit={{ opacity: 0, transition: { duration: 0.08 } }}
          >
            <Icon name="add" />
            Crear encuesta
          </motion.button>
        ) : (
          <motion.div
            key={stage.name}
            className="composer-content"
            aria-label={stage.name === 'form' ? 'Nueva encuesta' : 'Encuesta publicada'}
            role="region"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: { ...settle, delay: 0.28 } }}
            exit={{ opacity: 0, transition: { duration: 0.1 } }}
          >
            {stage.name === 'form' ? (
              <PollForm onCreated={handleCreated} onCancel={() => setStage({ name: 'idle' })} />
            ) : (
              <CreatedPool pool={stage.pool} onCreateAnother={() => setStage({ name: 'form' })} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
