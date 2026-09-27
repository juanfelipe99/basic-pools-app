import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'

import { Icon } from './Icon'
import './CopyLink.css'

interface CopyLinkProps {
  url: string
}

export function CopyLink({ url }: CopyLinkProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timeout = window.setTimeout(() => setCopied(false), 1800)
    return () => window.clearTimeout(timeout)
  }, [copied])

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      // Clipboard API can be blocked; selecting the text lets the user copy manually
      document.getElementById('share-url')?.focus()
    }
  }

  return (
    <div className="copy-link">
      <input
        id="share-url"
        className="copy-link-url"
        value={url}
        readOnly
        onFocus={(event) => event.currentTarget.select()}
        aria-label="Link para votar"
      />
      <button type="button" className="btn btn-primary copy-link-btn" onClick={copy}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={copied ? 'copied' : 'copy'}
            className="copy-link-label"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            <Icon name={copied ? 'check' : 'content_copy'} size={16} />
            {copied ? 'Copiado' : 'Copiar link'}
          </motion.span>
        </AnimatePresence>
      </button>
    </div>
  )
}
