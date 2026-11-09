import { useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '../../../components/button/button'
import { MoneyField } from '../../../components/input/money_field'
import { PageHeader } from '../../../components/layout/page_header'
import { LoadError } from '../../../components/skeleton/load_error'
import { LoadingRegion, Skeleton } from '../../../components/skeleton/skeleton'
import { PeriodEditor } from '../../../components/timesheet/period_editor'
import { useTimesheet } from '../../context/TimesheetContext'
import { HTML_LANG, isAppLanguage } from '../../i18n/config'
import { periodRange } from '../../lib/timesheet'

export function PeriodDetail() {
  const { periodId } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { periods, loading, error, retry, saveShift, setActual, removePeriod } = useTimesheet()
  const period = periods.find((p) => p.id === periodId)
  const [actualDraft, setActualDraft] = useState<number | null>(null)
  const [saveFailed, setSaveFailed] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteFailed, setDeleteFailed] = useState(false)
  const busy = useRef(false)

  if (loading) {
    return (
      <LoadingRegion label={t('common.loading')}>
        <Skeleton className="mb-6 h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </LoadingRegion>
    )
  }
  if (error) return <LoadError onRetry={retry} />
  if (!period) return <Navigate to="/dashboard/timesheet" replace />
  const actualValue = actualDraft ?? period.actual ?? 0

  const locale = isAppLanguage(i18n.language) ? HTML_LANG[i18n.language] : 'en'
  const fmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' })
  const range = periodRange(period)

  async function saveActual() {
    if (busy.current) return
    busy.current = true
    setSaveFailed(false)
    try {
      await setActual(period!.id, actualValue > 0 ? actualValue : undefined)
    } catch {
      setSaveFailed(true)
    } finally {
      busy.current = false
    }
  }

  async function destroy() {
    if (busy.current) return
    busy.current = true
    setDeleteFailed(false)
    try {
      await removePeriod(period!.id)
      navigate('/dashboard/timesheet')
    } catch {
      setDeleteFailed(true)
      busy.current = false
    }
  }

  return (
    <>
      <PageHeader
        backTo="/dashboard/timesheet"
        backLabel={t('timesheet.detail.back')}
        title={`${fmt.format(range.start)} → ${fmt.format(range.end)}`}
      />

      <PeriodEditor
        range={range}
        payCycle={period.payCycle ?? 'fortnightly'}
        shifts={period.shifts}
        actual={period.actual}
        onSaveShift={(iso, shift) => saveShift(period.id, iso, shift)}
        aside={
          <section className="rounded-xl border border-[#27272A] bg-[#18181B] p-4 sm:p-5">
            <MoneyField
              label={t('timesheet.detail.actualReceived')}
              value={actualValue}
              onChange={setActualDraft}
            />
            {saveFailed ? (
              <p className="mt-3 text-sm text-[#EF4444]" role="alert">
                {t('timesheet.saveError')}
              </p>
            ) : null}
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              {confirmDelete ? (
                <Button variant="white" className="w-full sm:w-auto" onClick={() => void destroy()}>
                  {t('timesheet.detail.deleteConfirm')}
                </Button>
              ) : (
                <Button variant="white" className="w-full sm:w-auto" onClick={() => setConfirmDelete(true)}>
                  {t('timesheet.detail.delete')}
                </Button>
              )}
              <Button
                className="w-full bg-[#C8E664]! hover:bg-[#B5D350]! sm:w-auto"
                onClick={() => void saveActual()}
              >
                {t('timesheet.detail.saveActual')}
              </Button>
            </div>
            {deleteFailed ? (
              <p className="mt-3 text-sm text-[#EF4444]" role="alert">
                {t('timesheet.saveError')}
              </p>
            ) : null}
          </section>
        }
      />
    </>
  )
}

export default PeriodDetail
