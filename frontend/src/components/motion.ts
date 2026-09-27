import type { Transition } from 'motion/react'

export const morph: Transition = { type: 'spring', duration: 0.6, bounce: 0.12 }

export const settle: Transition = { type: 'spring', duration: 0.45, bounce: 0 }

export const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
}
