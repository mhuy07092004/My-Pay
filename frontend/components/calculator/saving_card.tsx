import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Saving } from '../../src/lib/api'
import { jobHoursForPrice } from '../../src/lib/calculator'
import type { SavedRate } from '../../src/lib/rates'
import { formatMoney } from '../../src/lib/timesheet'
import { JobHours } from './job_hours'

type SavingCardProps = {
  saving: Saving
  rates: SavedRate[]
  jobName: (id: string) => string
  jobColors: Map<string, string>
  onEdit: () => void
  onDelete: () => Promise<void>
}

export function SavingCard({ saving, rates, jobName, jobColors, onEdit, onDelete }: SavingCardProps) {
  const { t } = useTranslation()
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const breakdowns = jobHoursForPrice(saving.price, rates)

  async function remove() {
    if (!confirm) {
      setConfirm(true)
      return
    }
    setDeleting(true)
    try {
      await onDelete()
    } finally {
      setDeleting(false)
      setConfirm(false)
    }
  }

  return (
    <article className="rounded-xl border border-[#27272A] bg-[#18181B] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[#F4F4F5]">{saving.name}</h3>
          <p className="mt-1 text-lg font-semibold tabular-nums text-[#C8E664]">${formatMoney(saving.price)}</p>
          {saving.note ? <p className="mt-2 text-sm text-[#A1A1AA]">{saving.note}</p> : null}
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg border border-[#27272A] px-2.5 py-1.5 text-xs font-medium text-[#E4E4E7] hover:bg-[#27272A]"
          >
            {t('calculator.edit')}
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={() => void remove()}
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
              confirm
                ? 'border-[#7F1D1D] bg-[#7F1D1D]/30 text-[#EF4444]'
                : 'border-[#27272A] text-[#EF4444] hover:bg-[#27272A]'
            }`}
          >
            {confirm ? t('calculator.deleteConfirm') : t('calculator.delete')}
          </button>
        </div>
      </div>
      <div className="mt-4">
        <JobHours breakdowns={breakdowns} jobName={jobName} jobColors={jobColors} />
      </div>
    </article>
  )
}