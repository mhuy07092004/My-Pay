import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '../../../components/card/card'
import { DateRangePicker } from '../../../components/date_range_picker/date_range_picker'
import { FortnightEstimate } from '../../../components/shift/fortnight_estimate'
import { ShiftRow } from '../../../components/shift/shift_row'
import { MOCK_RATES, TAX_RATE, createSeedShifts } from '../../../mock/timesheet'
import {
  addDays,
  calcTotalPay,
  eachDayInRange,
  formatMoney,
  isSameDay,
  startOfDay,
  toIsoDate,
  type DateRange,
  type Shift,
} from '../../lib/timesheet'

export function Timesheet() {
  const { t } = useTranslation()
  const today = useMemo(() => startOfDay(new Date()), [])
  const [range, setRange] = useState<DateRange>(() => ({
    start: addDays(today, -13),
    end: today,
  }))
  const [shifts, setShifts] = useState<Record<string, Shift>>(() =>
    createSeedShifts(today),
  )
  const [openDay, setOpenDay] = useState<string | null>(toIsoDate(today))

  const days = useMemo(() => eachDayInRange(range), [range])

  const rateOf = (id: string) =>
    (MOCK_RATES.find((r) => r.id === id) ?? MOCK_RATES[0]).hourlyRate

  const beforeTax = days.reduce((sum, day) => {
    const shift = shifts[toIsoDate(day)]
    if (!shift) return sum
    return sum + calcTotalPay(shift, rateOf)
  }, 0)
  const tax = beforeTax * TAX_RATE
  const afterTax = beforeTax - tax

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('timesheet.title')}
        </h1>
        <DateRangePicker value={range} onChange={setRange} />
      </div>

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
                    setShifts((prev) => ({ ...prev, [iso]: shift }))
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
        <p className="mt-4 pb-8 text-xs text-[#71717A]">
          {t('timesheet.earnings.note')}
        </p>
      </section>
    </>
  )
}

export default Timesheet
