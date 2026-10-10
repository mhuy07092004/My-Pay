import type { ReactNode } from 'react'
import { Reveal } from '../motion/reveal'

type FeatureBlockProps = {
  eyebrow: string
  title: string
  description: string
  reverse?: boolean
  children: ReactNode
}

export function FeatureBlock({ eyebrow, title, description, reverse, children }: FeatureBlockProps) {
  return (
    <section className="mt-28 grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
      <Reveal className={reverse ? 'lg:order-2' : undefined} x={reverse ? 16 : -16} y={0}>
        <p className="text-xs font-medium uppercase tracking-wider text-[#C8E664]">{eyebrow}</p>
        <h2 className="mt-3 text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h2>
        <p className="mt-4 max-w-[48ch] text-pretty text-sm/6 text-[#A1A1AA] sm:text-base/7">
          {description}
        </p>
      </Reveal>
      <Reveal className={`min-w-0 ${reverse ? 'lg:order-1' : ''}`} delay={0.1}>
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3 sm:p-4">
          {children}
        </div>
      </Reveal>
    </section>
  )
}
