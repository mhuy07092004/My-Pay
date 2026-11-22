import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { Saving } from '../../src/lib/api'
import { jobHoursForPrice } from '../../src/lib/calculator'
import type { SavedRate } from '../../src/lib/rates'
import { MoneyField } from '../input/money_field'
import { TextInput } from '../input/text_input'
import { JobHours } from './job_hours'

type SavingFormProps = {
  open: boolean
  initial?: Saving | null
  rates: SavedRate[]
  jobName: (id: string) => string
  jobColors: Map<string, string>
  onClose: () => void
  onSave: (body: { name: string; price: number; note?: string }) => Promise<void>
}

export function SavingForm({
  open,
  initial,
  rates,
  jobName,
  jobColors,
  onClose,
  onSave,
}: SavingFormProps) {
  const { t } = useTranslation()
  const [name, setName] = useState(initial?.name ?? '')
  const [price, setPrice] = useState(initial?.price ?? 0)
  const [note, setNote] = useState(initial?.note ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)

  if (!open) return null

  const breakdowns = jobHoursForPrice(price, rates)

  async function submit() {
    const trimmed = name.trim()
    if (!trimmed || price <= 0) {
      setError(true)
      return
    }
    setSaving(true)
    try {
      await onSave({
        name: trimmed,
        price,
        note: note.trim() || undefined,
      })
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
        aria-label={initial ? t('calculator.editTitle') : t('calculator.addTitle')}
        className="fixed inset-x-0 bottom-0 z-50 max-h-[92vh] overflow-y-auto rounded-t-2xl border border-[#27272A] bg-[#18181B] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl md:inset-auto md:top-1/2 md:left-1/2 md:w-[28rem] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-[#F4F4F5]">
            {initial ? t('calculator.editTitle') : t('calculator.addTitle')}
          </h2>
          <button type="button" onClick={onClose} className="text-sm text-[#71717A]">
            {t('calendar.close')}
          </button>
        </div>
        <div className="mt-4 space-y-4">
          <TextInput label={t('calculator.name')} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
          <MoneyField label={t('calculator.price')} value={price} onChange={setPrice} />
          <TextInput
            label={t('calculator.note')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={280}
            placeholder={t('calculator.notePlaceholder')}
          />
        </div>
        {error ? <p className="mt-2 text-sm text-[#EF4444]">{t('calculator.validation')}</p> : null}
        {price > 0 ? (
          <FormSection className="mt-4" title={t('calculator.hoursPreview')}>
            <JobHours breakdowns={breakdowns} jobName={jobName} jobColors={jobColors} />
          </FormSection>
        ) : null}
        <p className="mt-3 text-xs text-[#71717A]">{t('calculator.noTaxNote')}</p>
        <button
          type="button"
          disabled={saving}
          onClick={() => void submit()}
          className="mt-4 min-h-11 w-full rounded-lg bg-[#C8E664] text-sm font-semibold text-black disabled:opacity-50"
        >
          {t('calculator.save')}
        </button>
      </div>
    </>
  )
}

function FormSection({
  title,
  children,
  className = '',
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  )
}