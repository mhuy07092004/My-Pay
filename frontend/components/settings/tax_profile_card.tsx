import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePayData } from '../../src/context/PayDataContext'
import type { TaxProfileDto } from '../../src/lib/api'
import { toCents, toDollars } from '../../src/lib/rates'
import { Button } from '../button/button'
import { MoneyField } from '../input/money_field'
import { Select } from '../select/select'

export function TaxProfileCard() {
  const { t } = useTranslation()
  const { taxProfile, saveTaxProfile } = usePayData()
  const [draft, setDraft] = useState<TaxProfileDto>(taxProfile)
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const busy = useRef(false)

  const set = <K extends keyof TaxProfileDto>(key: K, value: TaxProfileDto[K]) => {
    setState('idle')
    setDraft((d) => ({ ...d, [key]: value }))
  }
  const noExemption = draft.residency === 'foreign'

  async function handleSave() {
    if (busy.current) return
    busy.current = true
    setState('saving')
    try {
      await saveTaxProfile({
        ...draft,
        medicareVariation: noExemption ? 'none' : draft.medicareVariation,
      })
      setState('saved')
    } catch {
      setState('error')
    } finally {
      busy.current = false
    }
  }

  return (
    <section className="rounded-xl border border-[#27272A] bg-[#18181B] p-4 sm:p-6">
      <h2 className="text-lg font-semibold tracking-tight">{t('settings.tax.title')}</h2>
      <p className="mt-1 text-xs text-[#71717A]">{t('settings.tax.note')}</p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Select
          label={t('settings.tax.residency')}
          value={draft.residency}
          options={[
            { value: 'resident', label: t('settings.tax.resident') },
            { value: 'foreign', label: t('settings.tax.foreign') },
          ]}
          onChange={(v) => set('residency', v as TaxProfileDto['residency'])}
        />
        <Select
          label={t('settings.tax.payCycle')}
          value={draft.payCycle}
          options={[
            { value: 'weekly', label: t('settings.tax.weekly') },
            { value: 'fortnightly', label: t('settings.tax.fortnightly') },
          ]}
          onChange={(v) => set('payCycle', v as TaxProfileDto['payCycle'])}
        />
        {noExemption ? null : (
          <Select
            label={t('settings.tax.medicare')}
            value={draft.medicareVariation}
            options={[
              { value: 'none', label: t('settings.tax.medicareNone') },
              { value: 'full', label: t('settings.tax.medicareFull') },
              { value: 'half', label: t('settings.tax.medicareHalf') },
            ]}
            onChange={(v) => set('medicareVariation', v as TaxProfileDto['medicareVariation'])}
          />
        )}
      </div>

      <label className="mt-5 flex min-h-11 cursor-pointer items-center gap-3 text-sm text-[#F4F4F5]">
        <input
          type="checkbox"
          checked={draft.studyLoan}
          onChange={(e) => set('studyLoan', e.target.checked)}
          className="h-5 w-5 shrink-0 accent-[#C8E664] sm:h-4 sm:w-4"
        />
        {t('settings.tax.studyLoan')}
      </label>

      {noExemption ? null : (
        <div className="mt-4">
          <MoneyField
            label={t('settings.tax.offset')}
            value={toDollars(draft.annualOffsetCents)}
            onChange={(v) => set('annualOffsetCents', toCents(v))}
          />
          <p className="mt-1.5 text-xs text-[#71717A]">{t('settings.tax.offsetHint')}</p>
        </div>
      )}

      <div className="mt-5 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
        {state === 'saved' ? (
          <span className="text-sm text-[#C8E664]">{t('settings.tax.saved')}</span>
        ) : null}
        {state === 'error' ? (
          <span className="text-sm text-[#EF4444]" role="alert">
            {t('settings.tax.saveError')}
          </span>
        ) : null}
        <Button className="min-h-11 sm:min-h-0" disabled={state === 'saving'} onClick={() => void handleSave()}>
          {t('settings.tax.save')}
        </Button>
      </div>
    </section>
  )
}
