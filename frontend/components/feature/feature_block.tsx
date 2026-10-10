import type { ReactNode } from 'react'

type FeatureBlockProps = {
  eyebrow: string
  title: string
  description: string
  reverse?: boolean
  children: ReactNode
}

export function FeatureBlock({ eyebrow, title, description, reverse, children }: FeatureBlockProps) {
  return (
    <section className="feature-reveal mt-20 grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
      <div className={reverse ? 'lg:order-2' : undefined}>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#C8E664]">{eyebrow}</p>
        <h2 className="mt-3 text-balance text-xl font-bold sm:text-2xl">{title}</h2>
        <p className="mt-3 max-w-[48ch] text-pretty text-sm/6 text-[#A1A1AA] sm:text-base/7">
          {description}
        </p>
      </div>
      <div className={`min-w-0 ${reverse ? 'lg:order-1' : ''}`}>{children}</div>
    </section>
  )
}
