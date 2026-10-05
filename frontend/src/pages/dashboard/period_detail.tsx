import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '../../../components/button/button'
import { MoneyField } from '../../../components/input/money_field'
import { PeriodEditor } from '../../../components/timesheet/period_editor'
import { useTimesheet } from '../../context/TimesheetContext'
import { HTML_LANG, isAppLanguage } from '../../i18n/config'
import { periodRange } from '../../lib/timesheet'

export function PeriodDetail() {
  const { periodId } = useParams()
  const { t, i18n } = useTranslation()
  const { periods, saveShift, setActual } = useTimesheet()
  const period = periods.find((p) => p.id === periodId)
  const [actualDraft, setActualDraft] = useState<number>(period?.actual ?? 0)

  if (!period) return <Navigate to="/dashboard/timesheet" replace />

  const locale = isAppLanguage(i18n.language) ? HTML_LANG[i18n.language] : 'en'
  const fmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' })
  const range = periodRange(period)

  return (
    <>
      <Link
        to="/dashboard/timesheet"
        className="text-sm text-[#A1A1AA] transition-colors hover:text-[#F4F4F5]"
      >
        ← {t('timesheet.detail.back')}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        {fmt.format(range.start)} → {fmt.format(range.end)}
      </h1>

      <PeriodEditor
        range={range}
        shifts={period.shifts}
        onSaveShift={(iso, shift) => saveShift(period.id, iso, shift)}
      />

      <section className="mt-8 max-w-md rounded-xl border border-[#27272A] bg-[#18181B] p-5 pb-5">
        <MoneyField
          label={t('timesheet.detail.actualReceived')}
          value={actualDraft}
          onChange={setActualDraft}
        />
        <div className="mt-4 flex justify-end">
          <Button
            className="bg-[#C8E664]! hover:bg-[#B5D350]!"
            onClick={() => setActual(period.id, actualDraft > 0 ? actualDraft : undefined)}
          >
            {t('timesheet.detail.saveActual')}
          </Button>
        </div>
      </section>
      <div className="pb-8" />
    </>
  )
}

export default PeriodDetail
