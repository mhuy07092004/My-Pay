import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HTML_LANG, isAppLanguage } from '../../src/i18n/config'
import {
  calcTotalPay,
  formatMoney,
  formatTime12h,
  type Shift,
  type ShiftPart,
} from '../../src/lib/timesheet'
import { Button } from '../button/button'
import { Select } from '../select/select'
import { TimeInput } from '../time_input/time_input'
import { BreakSelector } from './break_selector'

export type ShiftRate = {
  id: string
  name: string
  hourlyRate: number
}

type ShiftRowProps = {
  date: Date
  isToday?: boolean
  shift?: Shift
  rates: ShiftRate[]
  open: boolean
  onToggle: () => void
  onSave: (shift: Shift) => void
}

type ShiftFieldsProps = {
  part: ShiftPart
  rates: ShiftRate[]
  onChange: (part: ShiftPart) => void
}

function ShiftFields({ part, rates, onChange }: ShiftFieldsProps) {
  const { t } = useTranslation()

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
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

      <div className="mt-4">
        <BreakSelector
          value={part.breakMinutes}
          onChange={(breakMinutes) => onChange({ ...part, breakMinutes })}
        />
      </div>

      <div className="mt-4">
        <Select
          label={t('timesheet.rate.label')}
          value={part.rateId}
          options={rates.map((r) => ({ value: r.id, label: r.name }))}
          onChange={(rateId) => onChange({ ...part, rateId })}
        />
        <p className="mt-1.5 text-xs text-[#71717A]">{t('timesheet.rate.hint')}</p>
      </div>
    </>
  )
}

export function ShiftRow({
  date,
  isToday = false,
  shift,
  rates,
  open,
  onToggle,
  onSave,
}: ShiftRowProps) {
  const { t, i18n } = useTranslation()
  const locale = isAppLanguage(i18n.language) ? HTML_LANG[i18n.language] : 'en'
  const defaultPart = (checkIn: string, checkOut: string): ShiftPart => ({
    checkIn,
    checkOut,
    breakMinutes: 0,
    rateId: rates[0].id,
  })
  const [draft, setDraft] = useState<Shift>(
    shift ?? defaultPart('09:00', '17:00'),
  )

  const weekday = new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(date)
  const dayMonth = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
  }).format(date)

  const rateOf = (id: string) =>
    (rates.find((r) => r.id === id) ?? rates[0]).hourlyRate
  const savedPay = shift ? calcTotalPay(shift, rateOf) : 0
  const draftPay = calcTotalPay(draft, rateOf)
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
    </p>
  )

  if (!open) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-xl border border-[#27272A] bg-[#18181B] px-5 py-4 text-left transition-colors hover:bg-[#1E1E1E]"
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

  return (
    <div className="rounded-xl border border-[#C8E664] bg-[#18181B] p-5">
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
          onChange={(part) => setDraft((d) => ({ ...d, ...part }))}
        />
      </div>

      <label className="mt-5 flex cursor-pointer items-center gap-2 text-sm text-[#F4F4F5]">
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
          className="h-4 w-4 accent-[#C8E664]"
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
            onChange={(second) => setDraft((d) => ({ ...d, second }))}
          />
        </div>
      ) : null}

      <div className="mt-6 flex items-center justify-between gap-4">
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
          className="bg-[#C8E664]! hover:bg-[#B5D350]!"
          onClick={() => onSave(draft)}
        >
          {t('timesheet.saveShift')}
        </Button>
      </div>
    </div>
  )
}
