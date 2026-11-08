import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { usePayData } from '../../src/context/PayDataContext'
import { estimateShifts, hoursByRate } from '../../src/lib/pay'
import {
  eachDayInRange,
  formatHours,
  isSameDay,
  recentShiftTemplate,
  startOfDay,
  toIsoDate,
  type DateRange,
  type PayCycle,
  type Shift,
} from '../../src/lib/timesheet'
import { FortnightEstimate } from '../shift/fortnight_estimate'
import { ShiftRow } from '../shift/shift_row'
import { HoursSummary } from './hours_summary'

type PeriodEditorProps = {
  range: DateRange
  payCycle: PayCycle
  shifts: Record<string, Shift>
  onSaveShift: (isoDate: string, shift: Shift | null) => Promise<void> | void
  /** Extra panel shown under the estimate on laptop, after the days on mobile. */
  aside?: ReactNode
}

export function PeriodEditor({ range, payCycle, shifts, onSaveShift, aside }: PeriodEditorProps) {
  const { t } = useTranslation()
  const { rates, rateOf, taxContext, loading, holidays } = usePayData()
  const today = useMemo(() => startOfDay(new Date()), [])
  const [openDay, setOpenDay] = useState<string | null>(null)
  const [focusDay, setFocusDay] = useState<{ iso: string; token: number } | null>(null)
  const [error, setError] = useState(false)
  const days = useMemo(() => eachDayInRange(range), [range])

  const estimate = useMemo(
    () => estimateShifts(range, payCycle, shifts, rateOf, taxContext, holidays),
    [range, payCycle, shifts, rateOf, taxContext, holidays],
  )
  const rateHours = useMemo(() => hoursByRate(shifts, estimate), [shifts, estimate])
  const beforeTax = estimate.grossCents / 100
  const tax = estimate.taxCents / 100
  const afterTax = estimate.netCents / 100

  useEffect(() => {
    if (!focusDay) return
    document.getElementById(`shift-day-${focusDay.iso}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }, [focusDay])

  if (!loading && rates.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-[#27272A] bg-[#18181B] p-5">
        <p className="text-sm font-semibold text-[#F4F4F5]">{t('timesheet.noRates.title')}</p>
        <p className="mt-2 text-sm text-[#A1A1AA]">{t('timesheet.noRates.body')}</p>
        <Link
          to="/dashboard/settings"
          className="mt-4 inline-block text-sm font-medium text-[#C8E664] hover:text-[#B5D350]"
        >
          {t('timesheet.noRates.cta')} →
        </Link>
      </div>
    )
  }

  const weeks =
    payCycle === 'fortnightly' && days.length > 7
      ? [
          { n: 1, days: days.slice(0, 7) },
          { n: 2, days: days.slice(7) },
        ]
      : [{ n: 1, days }]

  async function persist(iso: string, shift: Shift | null) {
    setError(false)
    try {
      await onSaveShift(iso, shift)
      if (shift === null) {
        setOpenDay(null)
        return
      }
      const idx = days.findIndex((day) => toIsoDate(day) === iso)
      const next = idx >= 0 && idx < days.length - 1 ? toIsoDate(days[idx + 1]) : null
      setOpenDay(next)
      if (next) setFocusDay((cur) => ({ iso: next, token: (cur?.token ?? 0) + 1 }))
    } catch {
      setError(true)
    }
  }

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6">
        <section className="order-2 lg:order-none">
          <h2 className="mb-3 text-sm font-semibold text-[#A1A1AA]">
            {t('timesheet.dailyShifts')}
          </h2>
          {error ? (
            <p className="mb-3 text-sm text-[#EF4444]" role="alert">
              {t('timesheet.saveError')}
            </p>
          ) : null}
          <div className="space-y-5">
            {rates.length > 0
              ? weeks.map((week) => {
                  const minutes = week.days.reduce(
                    (sum, day) => sum + (estimate.byDay[toIsoDate(day)]?.minutes ?? 0),
                    0,
                  )
                  return (
                    <div key={week.n} className="space-y-3">
                      {payCycle === 'fortnightly' ? (
                        <div className="flex items-center justify-between px-1">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">
                            {t('timesheet.hours.week', { n: week.n })}
                          </h3>
                          <p className="text-xs tabular-nums text-[#A1A1AA]">
                            {t('timesheet.hours.badge', { hours: formatHours(minutes) })}
                          </p>
                        </div>
                      ) : null}
                      {week.days.map((day) => {
                        const iso = toIsoDate(day)
                        const template = shifts[iso] ? undefined : recentShiftTemplate(iso, shifts)
                        const templateKey = template
                          ? `${template.checkIn}-${template.checkOut}-${template.breakMinutes}-${template.rateId}`
                          : 'default'
                        return (
                          <div key={iso} id={`shift-day-${iso}`} className="scroll-mt-28">
                            <ShiftRow
                              key={shifts[iso] ? iso : `${iso}-${openDay === iso ? templateKey : 'closed'}`}
                              date={day}
                              isToday={isSameDay(day, today)}
                              shift={shifts[iso]}
                              template={template}
                              rates={rates}
                              rateOf={rateOf}
                              holidays={holidays}
                              open={openDay === iso}
                              onToggle={() => setOpenDay((cur) => (cur === iso ? null : iso))}
                              onSave={(shift) => persist(iso, shift)}
                              onDelete={shifts[iso] ? () => persist(iso, null) : undefined}
                            />
                          </div>
                        )
                      })}
                    </div>
                  )
                })
              : null}
          </div>
        </section>

        <div className="contents lg:sticky lg:top-8 lg:block lg:self-start lg:space-y-4">
          <FortnightEstimate
            beforeTax={beforeTax}
            tax={tax}
            afterTax={afterTax}
            minutes={estimate.minutes}
            payCycle={payCycle}
            compactOnMobile
            className="order-1 self-start max-lg:sticky max-lg:top-[calc(3.5rem+env(safe-area-inset-top))] max-lg:z-20"
          />
          {aside ? <div className="order-3">{aside}</div> : null}
        </div>
      </div>

      <HoursSummary
        rows={rateHours}
        nameOf={(id) => rates.find((rate) => rate.id === id)?.name ?? id}
      />
    </>
  )
}
