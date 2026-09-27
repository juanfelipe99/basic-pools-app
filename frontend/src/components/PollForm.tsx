import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'

import { api, ApiError, type PoolCreated } from '../services/api'
import { Icon } from './Icon'
import { settle } from './motion'
import './PollForm.css'

const MAX_OPTIONS = 12

interface DraftOption {
  key: string
  text: string
}

interface PollFormProps {
  onCreated: (pool: PoolCreated) => void
  onCancel: () => void
}

let draftKey = 0
function newOption(): DraftOption {
  draftKey += 1
  return { key: `option-${draftKey}`, text: '' }
}

function describeMissing(name: string, options: DraftOption[]): string | null {
  const filled = options.map((option) => option.text.trim()).filter(Boolean)
  const unique = new Set(filled.map((text) => text.toLowerCase()))

  if (!name.trim() && filled.length < 2) return 'Escribe la pregunta y al menos dos opciones.'
  if (!name.trim()) return 'Escribe la pregunta.'
  if (filled.length < 2) return 'Añade al menos dos opciones.'
  if (unique.size !== filled.length) return 'Hay opciones repetidas.'
  return null
}

export function PollForm({ onCreated, onCancel }: PollFormProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [closesAt, setClosesAt] = useState('')
  const [options, setOptions] = useState<DraftOption[]>(() => [newOption(), newOption()])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const optionRefs = useRef(new Map<string, HTMLInputElement>())
  const ids = useId()

  const missing = describeMissing(name, options)

  useEffect(() => {
    setError(null)
  }, [name, options, closesAt])

  function updateOption(key: string, text: string) {
    setOptions((current) => current.map((option) => (option.key === key ? { ...option, text } : option)))
  }

  function addOption(focus = true) {
    if (options.length >= MAX_OPTIONS) return
    const option = newOption()
    setOptions((current) => [...current, option])
    if (focus) requestAnimationFrame(() => optionRefs.current.get(option.key)?.focus())
  }

  function removeOption(key: string) {
    setOptions((current) => (current.length > 2 ? current.filter((option) => option.key !== key) : current))
  }

  function handleOptionKey(event: KeyboardEvent<HTMLInputElement>, index: number) {
    if (event.key !== 'Enter') return
    event.preventDefault()
    const next = options[index + 1]
    if (next) optionRefs.current.get(next.key)?.focus()
    else addOption()
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (missing || submitting) return

    if (closesAt && new Date(closesAt) <= new Date()) {
      setError('La fecha de cierre tiene que ser futura.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const pool = await api.createPool({
        name: name.trim(),
        description: description.trim() || null,
        closes_at: closesAt ? new Date(closesAt).toISOString() : null,
        options: options
          .map((option) => option.text.trim())
          .filter(Boolean)
          .map((text) => ({ text })),
      })
      onCreated(pool)
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'No se pudo publicar la encuesta.')
      setSubmitting(false)
    }
  }

  return (
    <form className="poll-form" onSubmit={handleSubmit} noValidate>
      <header className="panel-header">
        <h2 className="panel-title">Nueva encuesta</h2>
        <button type="button" className="icon-btn" onClick={onCancel} aria-label="Cancelar">
          <Icon name="close" />
        </button>
      </header>

      <label className="field">
        <span className="field-label">Pregunta</span>
        <input
          className="input input-title"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="¿Dónde hacemos la cena del viernes?"
          maxLength={200}
          autoFocus
        />
      </label>

      <label className="field">
        <span className="field-label">Descripción (opcional)</span>
        <textarea
          className="input"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Contexto para quien vota"
          rows={2}
        />
      </label>

      <fieldset className="field poll-form-options">
        <legend className="field-label">Opciones</legend>
        <motion.ul className="option-list" layout transition={settle}>
          <AnimatePresence initial={false}>
            {options.map((option, index) => (
              <motion.li
                key={option.key}
                className="option-row"
                layout="position"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={settle}
              >
                <div className="option-row-inner">
                  <span className="option-index" aria-hidden="true">
                    {index + 1}
                  </span>
                  <input
                    ref={(element) => {
                      if (element) optionRefs.current.set(option.key, element)
                      else optionRefs.current.delete(option.key)
                    }}
                    className="input"
                    value={option.text}
                    onChange={(event) => updateOption(option.key, event.target.value)}
                    onKeyDown={(event) => handleOptionKey(event, index)}
                    placeholder={`Opción ${index + 1}`}
                    maxLength={200}
                    aria-label={`Opción ${index + 1}`}
                  />
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => removeOption(option.key)}
                    disabled={options.length <= 2}
                    aria-label={`Quitar opción ${index + 1}`}
                  >
                    <Icon name="remove" />
                  </button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>

        {options.length < MAX_OPTIONS && (
          <motion.button
            type="button"
            className="btn btn-ghost add-option"
            onClick={() => addOption()}
            layout="position"
            transition={settle}
          >
            <Icon name="add" size={16} />
            Añadir opción
          </motion.button>
        )}
      </fieldset>

      <motion.label className="field" layout="position" transition={settle} htmlFor={`${ids}-closes`}>
        <span className="field-label">Cierre de la votación (opcional)</span>
        <input
          id={`${ids}-closes`}
          className="input poll-form-date"
          type="datetime-local"
          value={closesAt}
          onChange={(event) => setClosesAt(event.target.value)}
        />
      </motion.label>

      <motion.footer className="poll-form-footer" layout="position" transition={settle}>
        <AnimatePresence mode="wait" initial={false}>
          {error ? (
            <motion.p key="error" className="error" role="alert" {...fade}>
              <Icon name="error" size={16} />
              {error}
            </motion.p>
          ) : (
            <motion.p key={missing ?? 'ready'} className="hint" {...fade}>
              {missing ?? 'Lista para publicar.'}
            </motion.p>
          )}
        </AnimatePresence>
        <button type="submit" className="btn btn-primary" disabled={Boolean(missing) || submitting}>
          {submitting ? 'Publicando…' : 'Publicar encuesta'}
        </button>
      </motion.footer>
    </form>
  )
}

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.15 },
}
