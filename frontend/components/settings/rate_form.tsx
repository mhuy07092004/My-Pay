import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CUSTOM_ID,
  EMPTY_PAY,
  LEVEL_OPTIONS,
  PRESET_ID,
  STATUS_OPTIONS,
  getPresetPay,
  type PayRates,
  type SavedRate,
  type Status,
} from '../../mock/rates'
import { Button } from '../button/button'
import { MoneyField } from '../input/money_field'
import { TextInput } from '../input/text_input'
import { Select } from '../select/select'

type RateFormProps = {
  initial?: SavedRate
  onConfirm: (rate: SavedRate) => void
  onCancel: () => void
}

export function RateForm({ initial, onConfirm, onCancel }: RateFormProps) {
  const { t } = useTranslation()
  const [rateId, setRateId] = useState(
    initial?.kind === 'custom' ? CUSTOM_ID : PRESET_ID,
  )
  const [customName, setCustomName] = useState(
    initial?.kind === 'custom' ? initial.name : '',
  )
  const [status, setStatus] = useState(initial?.status ?? '')
  const [level, setLevel] = useState(initial?.level ?? '')
  const [age, setAge] = useState(initial?.age ?? '')
  const [pay, setPay] = useState<PayRates>(initial?.pay ?? EMPTY_PAY)
  const [overtime, setOvertime] = useState(initial?.overtimeEnabled ?? false)

  const isCustom = rateId === CUSTOM_ID

  function recompute(s: string, l: string, a: string) {
    if (s && l && a) setPay(getPresetPay(s as Status, l, Number(a)))
    else setPay(EMPTY_PAY)
  }

  function changeRate(id: string) {
    setRateId(id)
    setPay(EMPTY_PAY)
    if (id === PRESET_ID) recompute(status, level, age)
  }

  const setOrd = (key: keyof PayRates['ordinary'], v: number) =>
    setPay((p) => ({ ...p, ordinary: { ...p.ordinary, [key]: v } }))
  const setOt = (key: keyof PayRates['overtime'], v: number) =>
    setPay((p) => ({ ...p, overtime: { ...p.overtime, [key]: v } }))

  const name = isCustom ? customName.trim() : t('settings.rates.fastFood')
  const canConfirm = isCustom ? name !== '' : Boolean(status && level && age)

  const pick = [{ value: '', label: t('settings.rates.select') }]

  return (
    <div className="mt-4 rounded-xl border border-[#27272A] bg-[#09090B] p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Select
          label={t('settings.rates.rate')}
          value={rateId}
          options={[
            { value: PRESET_ID, label: t('settings.rates.fastFood') },
            { value: CUSTOM_ID, label: t('settings.rates.custom') },
          ]}
          onChange={changeRate}
        />
        {isCustom ? (
          <TextInput
            label={t('settings.rates.name')}
            placeholder={t('settings.rates.namePlaceholder')}
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
          />
        ) : (
          <>
            <Select
              label={t('settings.rates.status')}
              value={status}
              options={[
                ...pick,
                ...STATUS_OPTIONS.map((s) => ({
                  value: s,
                  label: t(`settings.rates.${s}`),
                })),
              ]}
              onChange={(v) => {
                setStatus(v)
                recompute(v, level, age)
              }}
            />
            <Select
              label={t('settings.rates.level')}
              value={level}
              options={[
                ...pick,
                ...LEVEL_OPTIONS.map((l) => ({ value: l, label: l })),
              ]}
              onChange={(v) => {
                setLevel(v)
                recompute(status, v, age)
              }}
            />
            <TextInput
              label={t('settings.rates.ages')}
              inputMode="numeric"
              value={age}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, '').slice(0, 3)
                setAge(v)
                recompute(status, level, v)
              }}
            />
          </>
        )}
      </div>

      <h3 className="mt-6 text-sm font-semibold text-[#A1A1AA]">
        {t('settings.rates.ordinary')}
      </h3>
      <div className="mt-3 space-y-3">
        <MoneyField label={t('settings.rates.night1')} value={pay.ordinary.night1} onChange={(v) => setOrd('night1', v)} />
        <MoneyField label={t('settings.rates.night2')} value={pay.ordinary.night2} onChange={(v) => setOrd('night2', v)} />
        <MoneyField label={t('settings.rates.saturday')} value={pay.ordinary.saturday} onChange={(v) => setOrd('saturday', v)} />
        <MoneyField label={t('settings.rates.sunday')} value={pay.ordinary.sunday} onChange={(v) => setOrd('sunday', v)} />
        <MoneyField label={t('settings.rates.publicHoliday')} value={pay.ordinary.publicHoliday} onChange={(v) => setOrd('publicHoliday', v)} />
      </div>

      <label className="mt-6 flex cursor-pointer items-center gap-2 text-sm text-[#F4F4F5]">
        <input
          type="checkbox"
          checked={overtime}
          onChange={(e) => setOvertime(e.target.checked)}
          className="h-4 w-4 accent-[#C8E664]"
        />
        {t('settings.rates.overtime')}
      </label>
      {overtime ? (
        <div className="mt-3 space-y-3">
          <MoneyField label={t('settings.rates.first2')} value={pay.overtime.first2} onChange={(v) => setOt('first2', v)} />
          <MoneyField label={t('settings.rates.after2')} value={pay.overtime.after2} onChange={(v) => setOt('after2', v)} />
          <MoneyField label={t('settings.rates.sunday')} value={pay.overtime.sunday} onChange={(v) => setOt('sunday', v)} />
          <MoneyField label={t('settings.rates.publicHoliday')} value={pay.overtime.publicHoliday} onChange={(v) => setOt('publicHoliday', v)} />
        </div>
      ) : null}

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="white" onClick={onCancel}>
          {t('settings.rates.cancel')}
        </Button>
        <Button
          disabled={!canConfirm}
          className="disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() =>
            onConfirm({
              id: initial?.id ?? `${rateId}-${Date.now()}`,
              name,
              pay,
              overtimeEnabled: overtime,
              kind: isCustom ? 'custom' : 'preset',
              status,
              level,
              age,
            })
          }
        >
          {t('settings.rates.confirm')}
        </Button>
      </div>
    </div>
  )
}
