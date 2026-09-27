import { motion } from 'motion/react'

import type { PoolOption } from '../services/api'
import { Icon } from './Icon'
import { settle } from './motion'
import './OptionList.css'

interface OptionListProps {
  options: PoolOption[]
  totalVotes: number
  selectable: boolean
  selectedId: number | null
  votedId: number | null
  onSelect: (optionId: number) => void
}

function percent(votes: number, total: number): number {
  return total === 0 ? 0 : Math.round((votes / total) * 100)
}

export function OptionList({ options, totalVotes, selectable, selectedId, votedId, onSelect }: OptionListProps) {
  const leader = Math.max(0, ...options.map((option) => option.votes_count))

  return (
    <ul className="option-results" role={selectable ? 'radiogroup' : 'list'} aria-label="Opciones">
      {options.map((option, index) => {
        const share = percent(option.votes_count, totalVotes)
        const selected = selectedId === option.id
        const voted = votedId === option.id
        const leading = totalVotes > 0 && option.votes_count === leader
        const className = [
          'result',
          selectable && 'is-selectable',
          selected && 'is-selected',
          voted && 'is-voted',
          leading && 'is-leading',
        ]
          .filter(Boolean)
          .join(' ')

        return (
          <motion.li
            key={option.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0, transition: { ...settle, delay: 0.04 * index } }}
          >
            <button
              type="button"
              className={className}
              role={selectable ? 'radio' : undefined}
              aria-checked={selectable ? selected : undefined}
              disabled={!selectable}
              onClick={() => onSelect(option.id)}
            >
              <motion.span
                className="result-bar"
                initial={false}
                animate={{ width: `${share}%` }}
                transition={{ type: 'spring', duration: 0.8, bounce: 0 }}
                aria-hidden="true"
              />
              <span className="result-mark" aria-hidden="true">
                {voted ? (
                  <Icon name="check" size={16} />
                ) : (
                  selectable && <span className="result-radio" />
                )}
              </span>
              <span className="result-text">{option.text}</span>
              <span className="result-count">
                {option.votes_count} {option.votes_count === 1 ? 'voto' : 'votos'}
              </span>
              <span className="result-share">{share}%</span>
            </button>
          </motion.li>
        )
      })}
    </ul>
  )
}
