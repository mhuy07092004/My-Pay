import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { formatPillHours, type DayEntry } from '../../src/lib/calendar'
import type { SavedRate } from '../../src/lib/rates'
import { formatTime12h } from '../../src/lib/timesheet'

export type DayDetailState = {
  iso: string
  entry: DayEntry | undefined
  anchor: DOMRect
  dateLabel: string
}

type DayDetailProps = {
  state: DayDetailState | null
  onClose: () => void
  rates: SavedRate[]
  jobColors: Map<string, string>
  locale: string
  labels: {
    viewPeriod: string
    noShift: string
    break: (count: number) => string
    close: string
  }
}

const POPOVER_W = 288

function popoverPosition(anchor: DOMRect): { top: number; left: number } {
  const margin = 8
  let left = anchor.left
  if (left + POPOVER_W > window.innerWidth - margin) {
    left = anchor.right - POPOVER_W
  }
  left = Math.max(margin, left)
  let top = anchor.bottom + margin
  const maxH = 320
  if (top + maxH > window.innerHeight - margin) {
    top = Math.max(margin, anchor.top - maxH - margin)
  }
  return { top, left }
}

export function DayDetail({
  state,
  onClose,
  rates,
  jobColors,
  locale,
  labels,
}: DayDetailProps) {
  useEffect(() => {
    if (!state) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [state, onClose])

  if (!state) return null

  const popoverPos = popoverPosition(state.anchor)

  const rateName = (id: string) => rates.find((r) => r.id === id)?.name ?? id

  const body = (
    <>
      <p className="text-base font-semibold text-[#F4F4F5]">{state.dateLabel}</p>
      {!state.entry || state.entry.parts.length === 0 ? (
        <p className="mt-3 text-sm text-[#A1A1AA]">{labels.noShift}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {state.entry.parts.map((part, i) => {
            const color = jobColors.get(part.rateId) ?? '#C8E664'
            const range = `${formatTime12h(part.checkIn, locale)} → ${formatTime12h(part.checkOut, locale)}`
            const breakNote =
              part.breakMinutes > 0 ? ` · ${labels.break(part.breakMinutes)}` : ''
            return (
              <li
                key={i}
                className="rounded-lg border border-[#27272A] bg-[#121212] p-3"
              >
                <p className="flex items-center gap-2 text-sm font-semibold" style={{ color }}>
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  {rateName(part.rateId)}
                </p>
                <p className="mt-1 text-sm text-[#A1A1AA]">
                  {range}
                  {breakNote}
                </p>
                <p className="mt-1 text-sm font-semibold tabular-nums text-[#C8E664]">
                  {formatPillHours(part.minutes)}
                </p>
              </li>
            )
          })}
        </ul>
      )}
      {state.entry ? (
        <Link
          to={`/dashboard/timesheet/${state.entry.periodId}`}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[#2A3018] px-3 text-sm font-semibold text-[#C8E664] hover:bg-[#353d1f]"
          onClick={onClose}
        >
          {labels.viewPeriod}
        </Link>
      ) : null}
    </>
  )

  return (
    <>
      <div
        aria-hidden
        className="fixed inset-0 z-50 bg-black/60 md:hidden"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-label={state.dateLabel}
        className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl border border-[#27272A] bg-[#18181B] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl md:hidden"
      >
        <button
          type="button"
          onClick={onClose}
          className="mb-2 w-full text-right text-xs text-[#71717A]"
        >
          {labels.close}
        </button>
        {body}
      </div>

      <div
        aria-hidden
        className="fixed inset-0 z-40 hidden md:block"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-label={state.dateLabel}
        style={{ top: popoverPos.top, left: popoverPos.left, width: POPOVER_W }}
        className="fixed z-50 hidden max-h-80 overflow-y-auto rounded-xl border border-[#27272A] bg-[#18181B] p-4 shadow-2xl md:block"
      >
        {body}
      </div>
    </>
  )
}
