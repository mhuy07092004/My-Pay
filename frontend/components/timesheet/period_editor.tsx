import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { usePayData } from '../../src/context/PayDataContext'
import { estimateShifts } from '../../src/lib/pay'
import {
  eachDayInRange,
  formatMoney,
  isSameDay,
  startOfDay,
  toIsoDate,
  type DateRange,
  type PayCycle,
  type Shift,
} from '../../src/lib/timesheet'
import { Card } from '../card/card'
import { FortnightEstimate } from '../shift/fortnight_estimate'
import { ShiftRow } from '../shift/shift_row'

type PeriodEditorProps = {
  range: DateRange
  payCycle: PayCycle
  shifts: Record<string, Shift>
  onSaveShift: (isoDate: string, shift: Shift) => Promise<void> | void
  /** Extra panel shown under the estimate on laptop, after the days on mobile. */
  aside?: ReactNode
}

export function PeriodEditor({ range, payCycle, shifts, onSaveShift, aside }: PeriodEditorProps) {
  const { t } = useTranslation()
  const { rates, rateOf, taxContext, loading, holidays } = usePayData()
  const today = useMemo(() => startOfDay(new Date()), [])
  const [openDay, setOpenDay] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const days = useMemo(() => eachDayInRange(range), [range])

  const estimate = useMemo(
    () => estimateShifts(range, payCycle, shifts, rateOf, taxContext, holidays),
    [range, payCycle, shifts, rateOf, taxContext, holidays],
  )
  const beforeTax = estimate.grossCents / 100
  const tax = estimate.taxCents / 100
  const afterTax = estimate.netCents / 100

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
          <div className="space-y-3">
            {rates.length > 0
              ? days.map((day) => {
                  const iso = toIsoDate(day)
                  return (
                    <ShiftRow
                      key={iso}
                      date={day}
                      isToday={isSameDay(day, today)}
                      shift={shifts[iso]}
                      rates={rates}
                      rateOf={rateOf}
                      holidays={holidays}
                      open={openDay === iso}
                      onToggle={() => setOpenDay((cur) => (cur === iso ? null : iso))}
                      onSave={async (shift) => {
                        setError(false)
                        try {
                          await onSaveShift(iso, shift)
                          setOpenDay(null)
                        } catch {
                          setError(true)
                        }
                      }}
                    />
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
            compactOnMobile
            className="order-1 self-start max-lg:sticky max-lg:top-[calc(3.5rem+env(safe-area-inset-top))] max-lg:z-20"
          />
          {aside ? <div className="order-3">{aside}</div> : null}
        </div>
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">
            {t('timesheet.earnings.title')}
          </h2>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">
            {t('timesheet.earnings.whole')}
          </p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3 sm:gap-4">
          <Card
            layout="responsive"
            label={t('timesheet.earnings.beforeTax')}
            value={formatMoney(beforeTax)}
            prefix="$"
            valueClassName="text-[#F4F4F5]"
          />
          <Card
            layout="responsive"
            label={t('timesheet.earnings.tax')}
            value={formatMoney(tax)}
            prefix="$"
            valueClassName="text-[#F4F4F5]"
          />
          <Card
            layout="responsive"
            label={t('timesheet.earnings.afterTax')}
            value={formatMoney(afterTax)}
            prefix="$"
            valueClassName="text-[#C8E664]"
          />
        </div>
        <p className="mt-4 text-xs text-[#71717A]">{t('timesheet.earnings.note')}</p>
      </section>
    </>
  )
}
