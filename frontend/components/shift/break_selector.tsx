import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Select } from '../select/select'

const PRESETS = [0, 10, 30, 60]
const CUSTOM = 'custom'

type BreakSelectorProps = {
  value: number
  onChange: (minutes: number) => void
}

export function BreakSelector({ value, onChange }: BreakSelectorProps) {
  const { t } = useTranslation()
  const [isCustom, setIsCustom] = useState(!PRESETS.includes(value))
  const selected = isCustom ? CUSTOM : String(value)

  const options = [
    { value: '0', label: t('timesheet.break.none') },
    { value: '10', label: t('timesheet.break.minutes', { count: 10 }) },
    { value: '30', label: t('timesheet.break.minutes', { count: 30 }) },
    { value: '60', label: t('timesheet.break.minutes', { count: 60 }) },
    { value: CUSTOM, label: t('timesheet.break.custom') },
  ]

  return (
    <div>
      <Select
        label={t('timesheet.break.label')}
        value={selected}
        options={options}
        onChange={(next) => {
          if (next === CUSTOM) {
            setIsCustom(true)
            return
          }
          setIsCustom(false)
          onChange(Number(next))
        }}
      />
      {isCustom ? (
        <input
          type="number"
          inputMode="numeric"
          min={0}
          step={1}
          value={value}
          aria-label={t('timesheet.break.customMinutes')}
          placeholder={t('timesheet.break.customMinutes')}
          onChange={(e) => {
            const parsed = Math.floor(Number(e.target.value))
            onChange(Number.isFinite(parsed) && parsed > 0 ? parsed : 0)
          }}
          className="mt-2 w-full rounded-lg border border-[#27272A] bg-[#09090B] px-3 py-2.5 text-sm text-[#F4F4F5] focus:border-[#C8E664] focus:outline-none"
        />
      ) : null}
    </div>
  )
}
