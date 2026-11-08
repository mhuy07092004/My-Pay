import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '../../../components/layout/page_header'
import { LoadError } from '../../../components/skeleton/load_error'
import { LoadingRegion, Skeleton } from '../../../components/skeleton/skeleton'
import { useTranslation } from 'react-i18next'
import { Button } from '../../../components/button/button'
import { DateRangePicker } from '../../../components/date_range_picker/date_range_picker'
import { PeriodEditor } from '../../../components/timesheet/period_editor'
import { usePayData } from '../../context/PayDataContext'
import { useTimesheet } from '../../context/TimesheetContext'
import { ApiError } from '../../lib/api'
import {
  CYCLE_DAYS,
  periodRange,
  rangesOverlap,
  toIsoDate,
  type DateRange,
  type Shift,
} from '../../lib/timesheet'

export function NewShifts() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { periods, loading: periodsLoading, error, retry, addPeriod } = useTimesheet()
  const { taxProfile, loading: payLoading } = usePayData()
  const [range, setRange] = useState<DateRange | null>(null)
  const [shifts, setShifts] = useState<Record<string, Shift>>({})
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState<
    'timesheet.newShifts.overlap' | 'timesheet.shiftOverlap' | 'timesheet.saveError' | null
  >(null)
  const busy = useRef(false)

  const days = CYCLE_DAYS[taxProfile.payCycle]
  const overlaps =
    range !== null && periods.some((p) => rangesOverlap(range, periodRange(p)))

  function handleRange(next: DateRange) {
    setRange(next)
    setShifts({})
  }

  async function handleSave() {
    if (!range || overlaps || busy.current) return
    busy.current = true
    setSaving(true)
    setFailed(null)
    try {
      await addPeriod(range, shifts)
      navigate('/dashboard/timesheet')
    } catch (err) {
      const code = err instanceof ApiError ? err.code : ''
      setFailed(
        code === 'period_overlap'
          ? 'timesheet.newShifts.overlap'
          : code === 'shift_overlap'
            ? 'timesheet.shiftOverlap'
            : 'timesheet.saveError',
      )
    } finally {
      busy.current = false
      setSaving(false)
    }
  }

  if (payLoading || periodsLoading) {
    return (
      <LoadingRegion label={t('common.loading')}>
        <Skeleton className="mb-6 h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </LoadingRegion>
    )
  }
  if (error) return <LoadError onRetry={retry} />

  return (
    <>
      <PageHeader
        backTo="/dashboard/timesheet"
        backLabel={t('timesheet.detail.back')}
        title={t('timesheet.newShifts.title')}
        actions={<DateRangePicker value={range} onChange={handleRange} fixedDays={days} />}
      />

      {range ? (
        <>
          <PeriodEditor
            key={`${toIsoDate(range.start)}_${toIsoDate(range.end)}`}
            range={range}
            payCycle={taxProfile.payCycle}
            shifts={shifts}
            onSaveShift={(iso, shift) =>
              setShifts((prev) => {
                if (!shift) {
                  const { [iso]: _removed, ...rest } = prev
                  void _removed
                  return rest
                }
                return { ...prev, [iso]: shift }
              })
            }
          />
          <div className="sticky bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-20 -mx-4 mt-6 flex flex-col items-stretch gap-2 border-t border-[#27272A] bg-[#18181B]/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 md:static md:mx-0 md:flex-row md:items-center md:justify-end md:gap-4 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
            {overlaps ? (
              <p className="text-sm text-[#EF4444]">{t('timesheet.newShifts.overlap')}</p>
            ) : null}
            {failed ? (
              <p className="text-sm text-[#EF4444]">{t(failed)}</p>
            ) : null}
            <Button
              size="lg"
              disabled={overlaps || saving}
              className="w-full bg-[#C8E664]! hover:bg-[#B5D350]! disabled:opacity-50 md:w-auto"
              onClick={() => void handleSave()}
            >
              {t('timesheet.newShifts.savePeriod')}
            </Button>
          </div>
        </>
      ) : (
        <p className="mt-6 text-[#A1A1AA]">
          {t('timesheet.newShifts.hint', { count: days })}
        </p>
      )}
    </>
  )
}

export default NewShifts
