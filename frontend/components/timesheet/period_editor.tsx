import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MOCK_RATES, TAX_RATE } from '../../mock/timesheet'
import {
  calcTotalPay,
  eachDayInRange,
  formatMoney,
  isSameDay,
  startOfDay,
  toIsoDate,
  type DateRange,
  type Shift,
} from '../../src/lib/timesheet'
import { Card } from '../card/card'
import { FortnightEstimate } from '../shift/fortnight_estimate'
import { ShiftRow } from '../shift/shift_row'

type PeriodEditorProps = {
  range: DateRange
  shifts: Record<string, Shift>
  onSaveShift: (isoDate: string, shift: Shift) => void
}

export function PeriodEditor({ range, shifts, onSaveShift }: PeriodEditorProps) {
  const { t } = useTranslation()
  const today = useMemo(() => startOfDay(new Date()), [])
  const [openDay, setOpenDay] = useState<string | null>(null)
  const days = useMemo(() => eachDayInRange(range), [range])

  const rateOf = (id: string) =>
    (MOCK_RATES.find((r) => r.id === id) ?? MOCK_RATES[0]).hourlyRate

  const beforeTax = days.reduce((sum, day) => {
    const shift = shifts[toIsoDate(day)]
    return shift ? sum + calcTotalPay(shift, rateOf) : sum
  }, 0)
  const tax = beforeTax * TAX_RATE
  const afterTax = beforeTax - tax

  return (
    <>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section>
          <h2 className="mb-3 text-sm font-semibold text-[#A1A1AA]">
            {t('timesheet.dailyShifts')}
          </h2>
          <div className="space-y-3">
            {days.map((day) => {
              const iso = toIsoDate(day)
              return (
                <ShiftRow
                  key={iso}
                  date={day}
                  isToday={isSameDay(day, today)}
                  shift={shifts[iso]}
                  rates={MOCK_RATES}
                  open={openDay === iso}
                  onToggle={() => setOpenDay((cur) => (cur === iso ? null : iso))}
                  onSave={(shift) => {
                    onSaveShift(iso, shift)
                    setOpenDay(null)
                  }}
                />
              )
            })}
          </div>
        </section>

        <FortnightEstimate
          beforeTax={beforeTax}
          tax={tax}
          afterTax={afterTax}
          className="lg:sticky lg:top-8 lg:self-start"
        />
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
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Card
            label={t('timesheet.earnings.beforeTax')}
            value={formatMoney(beforeTax)}
            prefix="$"
            valueClassName="text-[#F4F4F5]"
          />
          <Card
            label={t('timesheet.earnings.tax')}
            value={formatMoney(tax)}
            prefix="$"
            valueClassName="text-[#F4F4F5]"
          />
          <Card
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
