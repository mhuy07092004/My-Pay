import type { PublicHoliday, ShiftResult } from '@my-pay/engine'
import { useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HTML_LANG, isAppLanguage } from '../../src/i18n/config'
import { ApiError } from '../../src/lib/api'
import { calcDay, type RateLookup } from '../../src/lib/pay'
import type { SavedRate } from '../../src/lib/rates'
import {
  formatMoney,
  formatTime12h,
  toIsoDate,
  type Shift,
  type ShiftPart,
} from '../../src/lib/timesheet'
import { Button } from '../button/button'
import { Select } from '../select/select'
import { TimeInput } from '../time_input/time_input'
import { BreakSelector } from './break_selector'

type ShiftRowProps = {
  date: Date
  isToday?: boolean
  shift?: Shift
  rates: SavedRate[]
  rateOf: RateLookup
  holidays?: PublicHoliday[]
  open: boolean
  onToggle: () => void
  onSave: (shift: Shift) => Promise<void> | void
}

type ShiftFieldsProps = {
  part: ShiftPart
  rates: SavedRate[]
  result: ShiftResult
  onChange: (part: ShiftPart) => void
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

function OvertimeField({
  value,
  maxMinutes,
  onChange,
}: {
  value: number
  maxMinutes: number
  onChange: (minutes: number) => void
}) {
  const { t } = useTranslation()
  const id = useId()
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-4">
        <label htmlFor={id} className="text-sm text-[#E4E4E7]">
          {t('timesheet.overtime.label')}
        </label>
        <div className="flex w-32 items-center rounded-lg border border-[#27272A] bg-[#09090B] px-3 focus-within:border-[#C8E664]">
          <input
            id={id}
            type="number"
            min={0}
            max={maxMinutes / 60}
            step="0.25"
            value={value === 0 ? '' : value / 60}
            placeholder="0"
            onChange={(e) => {
              const hours = Math.max(0, Number(e.target.value) || 0)
              onChange(Math.min(Math.round(hours * 60), maxMinutes))
            }}
            className="w-full bg-transparent py-2.5 text-right text-base text-[#F4F4F5] sm:py-2 sm:text-sm focus:outline-none"
          />
          <span className="pl-2 text-sm text-[#A1A1AA]">{t('timesheet.overtime.unit')}</span>
        </div>
      </div>
      <p className="mt-1.5 text-xs text-[#71717A]">{t('timesheet.overtime.hint')}</p>
    </div>
  )
}

function ShiftFields({ part, rates, result, onChange }: ShiftFieldsProps) {
  const { t } = useTranslation()
  const phId = useId()
  const rate = rates.find((r) => r.id === part.rateId) ?? rates[0]

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <TimeInput
          label={t('timesheet.checkIn')}
          value={part.checkIn}
          onChange={(checkIn) => onChange({ ...part, checkIn })}
        />
        <TimeInput
          label={t('timesheet.checkOut')}
          value={part.checkOut}
          onChange={(checkOut) => onChange({ ...part, checkOut })}
        />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
      <div>
        <BreakSelector
          value={part.breakMinutes}
          onChange={(breakMinutes) => onChange({ ...part, breakMinutes })}
        />
      </div>

      <div>
        <Select
          label={t('timesheet.rate.label')}
          value={part.rateId}
          options={rates
            .filter((r) => !r.archived || r.id === part.rateId)
            .map((r) => ({ value: r.id, label: r.name }))}
          onChange={(rateId) => {
            const next = rates.find((r) => r.id === rateId)
            onChange({
              ...part,
              rateId,
              overtimeMinutes: next?.overtimeEnabled ? part.overtimeMinutes : 0,
            })
          }}
        />
        <p className="mt-1.5 text-xs text-[#71717A]">{t('timesheet.rate.hint')}</p>
      </div>
      </div>

      <label
        htmlFor={phId}
        className="mt-2 flex min-h-11 cursor-pointer items-center gap-2 text-sm text-[#F4F4F5]"
      >
        <input
          id={phId}
          type="checkbox"
          checked={part.publicHoliday ?? false}
          onChange={(e) => onChange({ ...part, publicHoliday: e.target.checked })}
          className="h-5 w-5 accent-[#C8E664] sm:h-4 sm:w-4"
        />
        {t('timesheet.publicHoliday')}
      </label>

      {rate?.overtimeEnabled ? (
        <OvertimeField
          value={part.overtimeMinutes ?? 0}
          maxMinutes={result.minutes}
          onChange={(overtimeMinutes) => onChange({ ...part, overtimeMinutes })}
        />
      ) : null}

      {result.lines.length > 0 ? (
        <ul className="mt-4 space-y-1 text-xs text-[#A1A1AA]">
          {result.lines.map((line) => (
            <li key={line.kind} className="flex justify-between gap-3">
              <span>
                {formatDuration(line.minutes)} · {t(`timesheet.kind.${line.kind}`)}
              </span>
              <span>${formatMoney(line.rateCents / 100)}/hr</span>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  )
}

export function ShiftRow({
  date,
  isToday = false,
  shift,
  rates,
  rateOf,
  holidays = [],
  open,
  onToggle,
  onSave,
}: ShiftRowProps) {
  const { t, i18n } = useTranslation()
  const locale = isAppLanguage(i18n.language) ? HTML_LANG[i18n.language] : 'en'
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<'timesheet.shiftOverlap' | 'timesheet.saveError' | null>(null)
  const busy = useRef(false)
  const pickRate = rates.find((r) => !r.archived) ?? rates[0]
  const defaultPart = (checkIn: string, checkOut: string): ShiftPart => ({
    checkIn,
    checkOut,
    breakMinutes: 0,
    rateId: pickRate.id,
    publicHoliday: false,
    overtimeMinutes: 0,
  })
  const [draft, setDraft] = useState<Shift>(
    shift ?? defaultPart('09:00', '17:00'),
  )

  const iso = toIsoDate(date)
  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(date)
  const dayMonth = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
  }).format(date)

  // Saved shifts show the rates frozen when they were saved; drafts use current rates.
  const holidayName = holidays.find((h) => h.date === iso)?.name
  const saved = shift ? calcDay(iso, shift, rateOf, true, holidays) : null
  const draftCalc = calcDay(iso, draft, rateOf, false, holidays)
  const savedPay = (saved?.cents ?? 0) / 100
  const draftPay = draftCalc.cents / 100
  const range = (part: ShiftPart) =>
    `${formatTime12h(part.checkIn, locale)} → ${formatTime12h(part.checkOut, locale)}`

  const heading = (
    <p className="text-sm font-semibold uppercase tracking-wide text-[#F4F4F5]">
      {weekday} {dayMonth}
      {isToday ? (
        <span className="ml-2 rounded-full bg-[#2A3018] px-2 py-0.5 text-[10px] text-[#C8E664]">
          {t('timesheet.today')}
        </span>
      ) : null}
      {holidayName ? (
        <span className="ml-2 rounded-full bg-[#27272A] px-2 py-0.5 text-[10px] normal-case tracking-normal text-[#F4F4F5]">
          {holidayName}
        </span>
      ) : null}
    </p>
  )

  if (!open) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="flex min-h-16 w-full items-center justify-between gap-3 rounded-xl border border-[#27272A] bg-[#18181B] px-4 py-4 text-left sm:px-5 transition-colors hover:bg-[#1E1E1E]"
      >
        <div>
          {heading}
          {shift ? (
            <>
              <p className="mt-1 text-sm text-[#A1A1AA]">{range(shift)}</p>
              {shift.second ? (
                <p className="text-sm text-[#A1A1AA]">{range(shift.second)}</p>
              ) : null}
            </>
          ) : (
            <p className="mt-1 text-sm text-[#A1A1AA]">{t('timesheet.noShift')}</p>
          )}
        </div>
        {shift ? (
          <p className="text-base font-semibold text-[#F4F4F5]">
            ${formatMoney(savedPay)}
          </p>
        ) : null}
      </button>
    )
  }

  const hasSecond = Boolean(draft.second)

  async function handleSave() {
    if (busy.current) return
    busy.current = true
    setSaving(true)
    setError(null)
    try {
      await onSave(draft)
    } catch (err) {
      setError(err instanceof ApiError && err.code === 'shift_overlap' ? 'timesheet.shiftOverlap' : 'timesheet.saveError')
    } finally {
      busy.current = false
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-[#C8E664] bg-[#18181B] p-4 sm:p-5">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between text-left"
      >
        {heading}
        <p className="text-base font-semibold text-[#F4F4F5]">
          ${formatMoney(draftPay)}
        </p>
      </button>

      <div className="mt-5">
        {hasSecond ? (
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#C8E664]">
            {t('timesheet.shiftNumber', { n: 1 })}
          </p>
        ) : null}
        <ShiftFields
          part={draft}
          rates={rates}
          result={draftCalc.parts[0]}
          onChange={(part) => setDraft((d) => ({ ...d, ...part }))}
        />
      </div>

      <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-2 text-sm text-[#F4F4F5]">
        <input
          type="checkbox"
          checked={hasSecond}
          onChange={(e) =>
            setDraft((d) => {
              if (!e.target.checked) {
                const { second: _removed, ...rest } = d
                void _removed
                return rest
              }
              return { ...d, second: defaultPart('18:00', '22:00') }
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
            result={draftCalc.parts[1]}
            onChange={(second) => setDraft((d) => ({ ...d, second }))}
          />
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">
            {t('timesheet.thisShift')}
          </p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-[#C8E664]">
            ${formatMoney(draftPay)}
          </p>
        </div>
        <Button
          size="lg"
          disabled={saving}
          className="w-full bg-[#C8E664]! hover:bg-[#B5D350]! disabled:opacity-50 sm:w-auto"
          onClick={() => void handleSave()}
        >
          {t('timesheet.saveShift')}
        </Button>
      </div>
      {error ? (
        <p className="mt-3 text-sm text-[#EF4444]" role="alert">
          {t(error)}
        </p>
      ) : null}
    </div>
  )
}
