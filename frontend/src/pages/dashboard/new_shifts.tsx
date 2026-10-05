import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '../../../components/button/button'
import { DateRangePicker } from '../../../components/date_range_picker/date_range_picker'
import { PeriodEditor } from '../../../components/timesheet/period_editor'
import { useTimesheet } from '../../context/TimesheetContext'
import {
  periodRange,
  rangesOverlap,
  toIsoDate,
  type DateRange,
  type Shift,
} from '../../lib/timesheet'

export function NewShifts() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { periods, addPeriod } = useTimesheet()
  const [range, setRange] = useState<DateRange | null>(null)
  const [shifts, setShifts] = useState<Record<string, Shift>>({})

  const overlaps =
    range !== null && periods.some((p) => rangesOverlap(range, periodRange(p)))

  function handleRange(next: DateRange) {
    setRange(next)
    setShifts({})
  }

  function handleSave() {
    if (!range || overlaps) return
    addPeriod({ start: toIsoDate(range.start), end: toIsoDate(range.end), shifts })
    navigate('/dashboard/timesheet')
  }

  return (
    <>
      <Link
        to="/dashboard/timesheet"
        className="text-sm text-[#A1A1AA] transition-colors hover:text-[#F4F4F5]"
      >
        ← {t('timesheet.detail.back')}
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('timesheet.newShifts.title')}
        </h1>
        <DateRangePicker value={range} onChange={handleRange} />
      </div>

      {range ? (
        <>
          <PeriodEditor
            key={`${toIsoDate(range.start)}_${toIsoDate(range.end)}`}
            range={range}
            shifts={shifts}
            onSaveShift={(iso, shift) => setShifts((prev) => ({ ...prev, [iso]: shift }))}
          />
          <div className="mt-6 flex items-center justify-end gap-4 pb-8">
            {overlaps ? (
              <p className="text-sm text-[#EF4444]">{t('timesheet.newShifts.overlap')}</p>
            ) : null}
            <Button
              size="lg"
              disabled={overlaps}
              className="bg-[#C8E664]! hover:bg-[#B5D350]! disabled:opacity-50"
              onClick={handleSave}
            >
              {t('timesheet.newShifts.savePeriod')}
            </Button>
          </div>
        </>
      ) : (
        <p className="mt-6 text-[#A1A1AA]">{t('timesheet.newShifts.hint')}</p>
      )}
    </>
  )
}

export default NewShifts
