import type { PublicHoliday, ShiftResult } from '@my-pay/engine'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../../src/lib/api'
import type { DayPartDetail, PaydayMark } from '../../src/lib/calendar'
import { calcDay, type RateLookup } from '../../src/lib/pay'
import type { SavedRate } from '../../src/lib/rates'
import { formatMoney, type Shift, type ShiftPart } from '../../src/lib/timesheet'
import { Button } from '../button/button'
import { ShiftFields } from '../shift/shift_fields'

export type DayEditorState = {
  iso: string
  dateLabel: string
  anchor: DOMRect
  parts: DayPartDetail[]
  template?: Pick<ShiftPart, 'checkIn' | 'checkOut' | 'breakMinutes' | 'rateId'>
  holidayName?: string
  paydays: PaydayMark[]
}

type DayEditorProps = {
  state: DayEditorState | null
  rates: SavedRate[]
  rateOf: RateLookup
  holidays: PublicHoliday[]
  jobColors: Map<string, string>
  jobName: (id: string) => string
  onClose: () => void
  onSave: (shift: Shift | null) => Promise<void>
  onOpenPayslip: (periodId: string) => void
}

const POPOVER_W = 420

function popoverPosition(anchor: DOMRect): { top: number; left: number } {
  const margin = 8
  let left = anchor.left
  if (left + POPOVER_W > window.innerWidth - margin) left = window.innerWidth - POPOVER_W - margin
  left = Math.max(margin, left)
  let top = anchor.bottom + margin
  const maxH = Math.min(640, window.innerHeight - 16)
  if (top + maxH > window.innerHeight - margin) top = Math.max(margin, anchor.top - maxH - margin)
  return { top, left }
}

function toPart(part: DayPartDetail | ShiftPart): ShiftPart {
  return {
    checkIn: part.checkIn,
    checkOut: part.checkOut,
    breakMinutes: part.breakMinutes,
    rateId: part.rateId,
    publicHoliday: part.publicHoliday,
    overtimeMinutes: part.overtimeMinutes,
    rateSnapshot: part.rateSnapshot,
  }
}

function initialDraft(state: DayEditorState, rates: SavedRate[]): Shift {
  const pick = rates.find((rate) => !rate.archived) ?? rates[0]
  const blank = (checkIn: string, checkOut: string): ShiftPart => ({
    checkIn,
    checkOut,
    breakMinutes: state.template?.breakMinutes ?? 0,
    rateId: state.template?.rateId ?? pick?.id ?? '',
    publicHoliday: false,
    overtimeMinutes: 0,
  })
  if (state.parts.length === 0) {
    return state.template
      ? { ...blank(state.template.checkIn, state.template.checkOut), rateId: state.template.rateId }
      : blank('09:00', '17:00')
  }
  const [first, second] = state.parts
  return second ? { ...toPart(first), second: toPart(second) } : toPart(first)
}

export function DayEditor(props: DayEditorProps) {
  if (!props.state) return null
  return <DayEditorBody key={`${props.state.iso}:${props.state.parts.length}`} {...props} state={props.state} />
}

function DayEditorBody({
  state,
  rates,
  rateOf,
  holidays,
  jobColors,
  jobName,
  onClose,
  onSave,
  onOpenPayslip,
}: DayEditorProps & { state: DayEditorState }) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<Shift>(() => initialDraft(state, rates))
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<'timesheet.shiftOverlap' | 'timesheet.saveError' | null>(null)
  const busy = useRef(false)

  useEffect(() => {
    if (!state) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [state, onClose])

  const calc = useMemo(() => {
    if (!state || !draft) return null
    return calcDay(state.iso, draft, rateOf, false, holidays)
  }, [state, draft, rateOf, holidays])

  if (!draft || !calc) return null

  const hasSecond = Boolean(draft.second)
  const existed = state.parts.length > 0
  const pos = popoverPosition(state.anchor)

  async function handleSave() {
    if (busy.current) return
    busy.current = true
    setSaving(true)
    setError(null)
    try {
      await onSave(draft)
      onClose()
    } catch (err) {
      setError(err instanceof ApiError && err.code === 'shift_overlap' ? 'timesheet.shiftOverlap' : 'timesheet.saveError')
    } finally {
      busy.current = false
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!existed || busy.current) return
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    busy.current = true
    setSaving(true)
    setError(null)
    try {
      await onSave(null)
      onClose()
    } catch (err) {
      setError(err instanceof ApiError && err.code === 'shift_overlap' ? 'timesheet.shiftOverlap' : 'timesheet.saveError')
    } finally {
      busy.current = false
      setSaving(false)
    }
  }

  const body = (
    <>
      <p className="text-base font-semibold text-[#F4F4F5]">{state.dateLabel}</p>
      {state.holidayName ? (
        <p className="mt-1 text-xs text-[#A1A1AA]">{state.holidayName}</p>
      ) : null}
      {state.paydays.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {state.paydays.map((payday) => (
            <button
              key={`${payday.jobId}-${payday.periodId ?? 'next'}`}
              type="button"
              disabled={!payday.periodId}
              onClick={() => payday.periodId && onOpenPayslip(payday.periodId)}
              className="rounded-full border px-2.5 py-1 text-xs font-semibold disabled:opacity-60"
              style={{
                color: jobColors.get(payday.jobId) ?? '#C8E664',
                borderColor: jobColors.get(payday.jobId) ?? '#C8E664',
              }}
            >
              {t('timesheet.paydayChip', { job: jobName(payday.jobId) })}
            </button>
          ))}
        </div>
      ) : null}
      <div className="mt-4">
        {hasSecond ? (
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#C8E664]">
            {t('timesheet.shiftNumber', { n: 1 })}
          </p>
        ) : null}
        <ShiftFields
          part={draft}
          rates={rates}
          result={calc.parts[0] ?? emptyResult}
          onChange={(part) => setDraft((current) => (current ? { ...current, ...part } : current))}
        />
      </div>
      <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-2 text-sm text-[#F4F4F5]">
        <input
          type="checkbox"
          checked={hasSecond}
          onChange={(e) =>
            setDraft((current) => {
              if (!current) return current
              if (!e.target.checked) {
                const { second: _removed, ...rest } = current
                void _removed
                return rest
              }
              const pick = rates.find((rate) => !rate.archived) ?? rates[0]
              return {
                ...current,
                second: {
                  checkIn: '18:00',
                  checkOut: '22:00',
                  breakMinutes: 0,
                  rateId: pick?.id ?? current.rateId,
                  publicHoliday: false,
                  overtimeMinutes: 0,
                },
              }
            })
          }
          className="h-5 w-5 accent-[#C8E664] sm:h-4 sm:w-4"
        />
        {t('timesheet.moreShifts')}
      </label>
      {draft.second ? (
        <div className="mt-4 border-t border-[#27272A] pt-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#C8E664]">
            {t('timesheet.shiftNumber', { n: 2 })}
          </p>
          <ShiftFields
            part={draft.second}
            rates={rates}
            result={calc.parts[1] ?? emptyResult}
            onChange={(second) => setDraft((current) => (current ? { ...current, second } : current))}
          />
        </div>
      ) : null}
      {error ? (
        <p className="mt-3 text-sm text-[#EF4444]" role="alert">
          {t(error)}
        </p>
      ) : null}
    </>
  )

  const actions = (
    <div className="flex items-center justify-between gap-3 border-t border-[#27272A] bg-[#18181B] pt-3">
      <p className="text-lg font-semibold text-[#C8E664]">${formatMoney(calc.cents / 100)}</p>
      <div className="flex items-center gap-2">
        {existed ? (
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleDelete()}
            className="min-h-11 px-2 text-sm text-[#A1A1AA] hover:text-[#EF4444] disabled:opacity-50"
          >
            {confirmDelete ? t('timesheet.deleteShiftConfirm') : t('timesheet.deleteShift')}
          </button>
        ) : (
          <button type="button" onClick={onClose} className="min-h-11 px-2 text-sm text-[#A1A1AA]">
            {t('calendar.close')}
          </button>
        )}
        <Button disabled={saving} className="min-h-11" onClick={() => void handleSave()}>
          {t('timesheet.saveShift')}
        </Button>
      </div>
    </div>
  )

  return (
    <>
      <div aria-hidden className="fixed inset-0 z-50 bg-black/60 md:hidden" onClick={onClose} />
      <div
        role="dialog"
        aria-label={state.dateLabel}
        className="fixed inset-x-0 bottom-0 z-50 flex max-h-[90vh] flex-col rounded-t-2xl border border-[#27272A] bg-[#18181B] shadow-2xl md:hidden"
      >
        <div className="flex-1 overflow-y-auto p-4">{body}</div>
        <div className="px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">{actions}</div>
      </div>
      <div aria-hidden className="fixed inset-0 z-40 hidden md:block" onClick={onClose} />
      <div
        role="dialog"
        aria-label={state.dateLabel}
        style={{ top: pos.top, left: pos.left, width: POPOVER_W }}
        className="fixed z-50 hidden max-h-[min(40rem,calc(100vh-1rem))] flex-col overflow-hidden rounded-xl border border-[#27272A] bg-[#18181B] shadow-2xl md:flex"
      >
        <div className="flex-1 overflow-y-auto p-4">{body}</div>
        <div className="px-4 pb-4">{actions}</div>
      </div>
    </>
  )
}

const emptyResult: ShiftResult = { cents: 0, minutes: 0, lines: [], otFirst2Minutes: 0 }
