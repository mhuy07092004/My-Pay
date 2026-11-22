import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HTML_LANG, isAppLanguage } from '../../src/i18n/config'
import { parseIsoDate, toIsoDate } from '../../src/lib/timesheet'

type DatePickerProps = {
  label: string
  value: string
  onChange: (iso: string) => void
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function buildMonthCells(month: Date): (Date | null)[] {
  const offset = (month.getDay() + 6) % 7
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const cells: (Date | null)[] = Array.from({ length: offset }, () => null)
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), day))
  }
  return cells
}

export function DatePicker({ label, value, onChange }: DatePickerProps) {
  const { t, i18n } = useTranslation()
  const locale = isAppLanguage(i18n.language) ? HTML_LANG[i18n.language] : 'en'
  const root = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const selected = value ? parseIsoDate(value) : new Date()
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(selected))
  const monthTitle = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' })
  const short = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' })

  useEffect(() => {
    if (!open) return
    function onPointer(event: MouseEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [open])

  return (
    <div ref={root} className="relative">
      <span className="mb-1.5 block text-sm text-[#A1A1AA]">{label}</span>
      <button
        type="button"
        onClick={() => {
          setViewMonth(startOfMonth(value ? parseIsoDate(value) : new Date()))
          setOpen((prev) => !prev)
        }}
        className="flex min-h-11 w-full items-center rounded-lg border border-[#27272A] bg-[#09090B] px-3 text-left text-sm text-[#F4F4F5]"
      >
        {value ? short.format(parseIsoDate(value)) : t('settings.rates.schedulePick')}
      </button>
      {open ? (
        <div className="absolute z-20 mt-2 w-full rounded-xl border border-[#27272A] bg-[#18181B] p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <button type="button" className="px-2 text-[#F4F4F5]" onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}>
              ‹
            </button>
            <p className="text-sm capitalize text-[#F4F4F5]">{monthTitle.format(viewMonth)}</p>
            <button type="button" className="px-2 text-[#F4F4F5]" onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}>
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {buildMonthCells(viewMonth).map((day, index) =>
              day ? (
                <button
                  key={toIsoDate(day)}
                  type="button"
                  onClick={() => {
                    onChange(toIsoDate(day))
                    setOpen(false)
                  }}
                  className={`h-9 rounded-md text-sm ${
                    value === toIsoDate(day) ? 'bg-[#C8E664] text-black' : 'text-[#F4F4F5] hover:bg-[#27272A]'
                  }`}
                >
                  {day.getDate()}
                </button>
              ) : (
                <span key={`empty-${index}`} />
              ),
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
