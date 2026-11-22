import type { ShiftResult } from '@my-pay/engine'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import type { SavedRate } from '../../src/lib/rates'
import { formatMoney, type ShiftPart } from '../../src/lib/timesheet'
import { Select } from '../select/select'
import { TimeInput } from '../time_input/time_input'
import { BreakSelector } from './break_selector'

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
            className="w-full bg-transparent py-2.5 text-right text-base text-[#F4F4F5] focus:outline-none sm:py-2 sm:text-sm"
          />
          <span className="pl-2 text-sm text-[#A1A1AA]">{t('timesheet.overtime.unit')}</span>
        </div>
      </div>
      <p className="mt-1.5 text-xs text-[#71717A]">{t('timesheet.overtime.hint')}</p>
    </div>
  )
}

export function ShiftFields({ part, rates, result, onChange }: ShiftFieldsProps) {
  const { t } = useTranslation()
  const phId = useId()
  const selectable = rates.filter((rate) => !rate.archived || rate.id === part.rateId)
  const rate = selectable.find((item) => item.id === part.rateId) ?? selectable[0]
  const showJob = selectable.filter((item) => !item.archived).length > 1 || part.rateId !== selectable[0]?.id

  return (
    <>
      {showJob ? (
        <div className="mb-4">
          <Select
            label={t('timesheet.rate.label')}
            value={part.rateId}
            options={selectable.map((item) => ({ value: item.id, label: item.name }))}
            onChange={(rateId) => {
              const next = rates.find((item) => item.id === rateId)
              onChange({
                ...part,
                rateId,
                overtimeMinutes: next?.overtimeEnabled ? part.overtimeMinutes : 0,
              })
            }}
          />
        </div>
      ) : null}
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
      <div className="mt-4">
        <BreakSelector
          value={part.breakMinutes}
          onChange={(breakMinutes) => onChange({ ...part, breakMinutes })}
        />
      </div>
      <label htmlFor={phId} className="mt-3 flex min-h-11 cursor-pointer items-center gap-2 text-sm text-[#F4F4F5]">
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
