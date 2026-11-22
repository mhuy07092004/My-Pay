import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SUMMARY_KINDS, hoursByRate } from '../../src/lib/pay'
import type { RateLookup } from '../../src/lib/pay'
import type { SavedRate } from '../../src/lib/rates'
import {
  formatHours,
  formatMoney,
  parseIsoDate,
  type Period,
} from '../../src/lib/timesheet'
import { estimateShifts } from '../../src/lib/pay'
import type { TaxContext } from '../../src/lib/pay'
import type { PublicHoliday } from '@my-pay/engine'

type PayslipSheetProps = {
  period: Period | null
  rates: SavedRate[]
  rateOf: RateLookup
  taxContext: TaxContext
  holidays: PublicHoliday[]
  jobColor: string
  onClose: () => void
  onSaveActual: (amount: number | undefined) => Promise<void>
}

export function PayslipSheet({
  period,
  rates,
  rateOf,
  taxContext,
  holidays,
  jobColor,
  onClose,
  onSaveActual,
}: PayslipSheetProps) {
  const { t } = useTranslation()
  const [actual, setActual] = useState('')
  const [saving, setSaving] = useState(false)

  const job = rates.find((rate) => rate.id === period?.jobId)
  const estimate = useMemo(() => {
    if (!period) return null
    return estimateShifts(
      { start: parseIsoDate(period.start), end: parseIsoDate(period.end) },
      period.payCycle ?? 'fortnightly',
      period.shifts,
      rateOf,
      taxContext,
      holidays,
    )
  }, [period, rateOf, taxContext, holidays])

  if (!period || !estimate) return null

  const rows = hoursByRate(period.shifts, estimate).filter((row) => row.minutes > 0)
  const scale = estimate.byJob[period.jobId]?.scale
  const gross = period.totals?.income ?? estimate.grossCents / 100
  const tax = period.totals?.tax ?? estimate.taxCents / 100
  const net = period.totals?.net ?? estimate.netCents / 100
  const entered = actual === '' ? period.actual : Number(actual)
  const variance = entered === undefined || Number.isNaN(entered) ? undefined : entered - net

  async function save() {
    setSaving(true)
    try {
      await onSaveActual(actual.trim() === '' ? undefined : Number(actual))
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div aria-hidden className="fixed inset-0 z-50 bg-black/60" onClick={onClose} />
      <div
        role="dialog"
        aria-label={t('timesheet.payslip.title')}
        className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-2xl border border-[#27272A] bg-[#18181B] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl md:inset-auto md:top-1/2 md:left-1/2 md:w-[28rem] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: jobColor }}>
              {job?.name ?? period.jobId}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-[#F4F4F5]">{t('timesheet.payslip.title')}</h2>
            <p className="mt-1 text-sm text-[#A1A1AA]">
              {period.start} → {period.end}
            </p>
            <p className="text-sm text-[#A1A1AA]">
              {t('timesheet.payslip.payday', { date: period.paymentDate })}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-[#71717A]">
            {t('calendar.close')}
          </button>
        </div>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-[#A1A1AA]">{t('timesheet.estimate.beforeTax')}</dt>
            <dd className="tabular-nums">${formatMoney(gross)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[#A1A1AA]">
              {t('timesheet.estimate.tax')}
              {scale ? ` · ${t(job?.claimsTaxFreeThreshold ? 'timesheet.payslip.withThreshold' : 'timesheet.payslip.noThreshold')}` : ''}
            </dt>
            <dd className="tabular-nums">${formatMoney(tax)}</dd>
          </div>
          <div className="flex justify-between border-t border-[#27272A] pt-2">
            <dt className="text-[#A1A1AA]">{t('timesheet.estimate.afterTax')}</dt>
            <dd className="font-semibold text-[#C8E664]">${formatMoney(net)}</dd>
          </div>
        </dl>
        {rows.map((row) => (
          <ul key={row.rateId} className="mt-4 space-y-1 text-sm">
            {SUMMARY_KINDS.filter((kind) => (row.byKind[kind] ?? 0) > 0).map((kind) => (
              <li key={kind} className="flex justify-between gap-3">
                <span className="text-[#A1A1AA]">{t(`timesheet.summaryKind.${kind}`)}</span>
                <span className="tabular-nums">{formatHours(row.byKind[kind] ?? 0)}</span>
              </li>
            ))}
          </ul>
        ))}
        <label className="mt-5 block text-sm text-[#A1A1AA]">
          {t('timesheet.payslip.actual')}
          <input
            inputMode="decimal"
            value={actual}
            placeholder={period.actual === undefined ? '' : String(period.actual)}
            onChange={(e) => setActual(e.target.value.replace(/[^\d.]/g, ''))}
            className="mt-1 w-full rounded-lg border border-[#27272A] bg-[#09090B] px-3 py-2.5 text-[#F4F4F5]"
          />
        </label>
        {variance !== undefined ? (
          <p className="mt-2 text-sm text-[#A1A1AA]">
            {t('timesheet.payslip.variance', { amount: formatMoney(variance) })}
          </p>
        ) : null}
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="mt-4 min-h-11 w-full rounded-lg bg-[#C8E664] text-sm font-semibold text-black disabled:opacity-50"
        >
          {t('timesheet.payslip.saveActual')}
        </button>
      </div>
    </>
  )
}
