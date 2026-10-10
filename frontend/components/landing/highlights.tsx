import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { RevealItem, RevealList } from '../motion/reveal'

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  )
}

export function Highlights() {
  const { t } = useTranslation()
  const items = [
    {
      key: 'calendar',
      title: t('features.calendar.title'),
      body: t('features.calendar.body'),
      icon: (
        <Icon>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M3 10h18M8 3v4M16 3v4" />
        </Icon>
      ),
    },
    {
      key: 'estimate',
      title: t('features.estimate.title'),
      body: t('features.estimate.body'),
      icon: (
        <Icon>
          <path d="M19 5 5 19" />
          <circle cx="7" cy="7" r="2.5" />
          <circle cx="17" cy="17" r="2.5" />
        </Icon>
      ),
    },
    {
      key: 'actual',
      title: t('features.actual.title'),
      body: t('features.actual.body'),
      icon: (
        <Icon>
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12 3 3 5-6" />
        </Icon>
      ),
    },
  ]

  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">
      <RevealList className="grid gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.08] md:grid-cols-3">
        {items.map((item) => (
          <RevealItem
            key={item.key}
            className="group flex flex-col gap-3 bg-[#0C0C0E] p-6 transition-colors duration-300 hover:bg-[#111113] sm:p-8"
          >
            <span className="text-[#C8E664]">{item.icon}</span>
            <h3 className="text-base font-medium tracking-tight">{item.title}</h3>
            <p className="text-sm/6 text-[#A1A1AA]">{item.body}</p>
          </RevealItem>
        ))}
      </RevealList>
    </section>
  )
}
