import { motion, useReducedMotion } from 'framer-motion'
import type { ReactNode } from 'react'

const EASE = [0.22, 1, 0.36, 1] as const

type RevealProps = {
  children: ReactNode
  className?: string
  delay?: number
  /** Horizontal offset in px for sideways slide. */
  x?: number
  y?: number
  /** Animate on mount instead of when scrolled into view. */
  immediate?: boolean
}

export function Reveal({ children, className, delay = 0, x = 0, y = 14, immediate }: RevealProps) {
  const reduce = useReducedMotion()
  const hidden = reduce ? { opacity: 0 } : { opacity: 0, x, y }
  const shown = { opacity: 1, x: 0, y: 0 }
  const transition = { duration: 0.6, ease: EASE, delay }

  if (immediate) {
    return (
      <motion.div className={className} initial={hidden} animate={shown} transition={transition}>
        {children}
      </motion.div>
    )
  }

  return (
    <motion.div
      className={className}
      initial={hidden}
      whileInView={shown}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={transition}
    >
      {children}
    </motion.div>
  )
}

export function RevealList({
  children,
  className,
  as = 'ul',
}: {
  children: ReactNode
  className?: string
  as?: 'ul' | 'ol' | 'div'
}) {
  const Tag = motion[as]
  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      variants={{ hidden: {}, shown: { transition: { staggerChildren: 0.08 } } }}
    >
      {children}
    </Tag>
  )
}

export function RevealItem({
  children,
  className,
  as = 'li',
}: {
  children: ReactNode
  className?: string
  as?: 'li' | 'div'
}) {
  const reduce = useReducedMotion()
  const Tag = motion[as]
  return (
    <Tag
      className={className}
      variants={{
        hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 12 },
        shown: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
      }}
    >
      {children}
    </Tag>
  )
}
