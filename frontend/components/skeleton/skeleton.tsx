import type { ReactNode } from 'react'

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-block animate-pulse rounded bg-[#27272A] motion-reduce:animate-none ${className}`}
      aria-hidden
    />
  )
}

export function LoadingRegion({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}
