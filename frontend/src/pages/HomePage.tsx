import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { useCallback, useState } from 'react'
import { Link } from 'react-router'

import { Composer } from '../components/Composer'
import { Icon } from '../components/Icon'
import { morph } from '../components/motion'
import { Topbar } from '../components/Topbar'
import { getOwnedPools, type OwnedPool } from '../services/storage'
import './HomePage.css'

const dateFormat = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' })

export function HomePage() {
  const [composerOpen, setComposerOpen] = useState(false)
  const [owned, setOwned] = useState<OwnedPool[]>(getOwnedPools)

  const handleStageChange = useCallback((open: boolean) => {
    setComposerOpen(open)
    setOwned(getOwnedPools())
  }, [])

  return (
    <div className="shell">
      <Topbar />

      <LayoutGroup>
        <main className="home">
          <AnimatePresence initial={false}>
            {!composerOpen && (
              <motion.div
                key="intro"
                className="home-intro"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto', transition: morph }}
                exit={{ opacity: 0, height: 0, transition: morph }}
              >
                <h1 className="home-title">Pregunta algo. Comparte el link.</h1>
                <p className="home-lede">
                  Encuestas sin registro: quien tenga el link vota una sola vez y ve los resultados al momento.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="home-composer">
            <Composer onStageChange={handleStageChange} />
          </div>

          <AnimatePresence initial={false}>
            {!composerOpen && owned.length > 0 && (
              <motion.section
                key="owned"
                className="owned"
                aria-labelledby="owned-title"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 0.2, duration: 0.25 } }}
                exit={{ opacity: 0, transition: { duration: 0.12 } }}
              >
                <h2 id="owned-title" className="owned-title">
                  Creadas en este navegador
                </h2>
                <ul className="owned-list">
                  {owned.slice(0, 5).map((pool) => (
                    <li key={pool.shareCode}>
                      <Link to={`/p/${pool.shareCode}`} className="owned-item">
                        <span className="owned-name">{pool.name}</span>
                        <span className="owned-date">{dateFormat.format(new Date(pool.createdAt))}</span>
                        <Icon name="arrow_forward" size={16} className="owned-arrow" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.section>
            )}
          </AnimatePresence>
        </main>
      </LayoutGroup>
    </div>
  )
}
