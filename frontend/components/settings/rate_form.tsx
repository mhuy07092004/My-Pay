import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePayData } from '../../src/context/PayDataContext'
import { getAwardRate } from '../../src/lib/api'
import {
  CUSTOM_ID,
  EMPTY_PAY,
  LEVEL_OPTIONS,
  PRESET_ID,
  STATUS_OPTIONS,
  type PayRates,
  type SavedRate,
} from '../../src/lib/rates'
import { Button } from '../button/button'
import { MoneyField } from '../input/money_field'
import { TextInput } from '../input/text_input'
import { Select } from '../select/select'

type RateFormProps = {
  initial?: SavedRate
  /** Called with id '' for a new rate. Throw to keep the form open. */
  onConfirm: (rate: SavedRate) => Promise<void>
  onCancel: () => void
}

export function RateForm({ initial, onConfirm, onCancel }: RateFormProps) {
  const { t } = useTranslation()
  const { rates, taxProfile } = usePayData()
  const [rateId, setRateId] = useState(
    initial?.kind === 'custom' ? CUSTOM_ID : PRESET_ID,
  )
  const [customName, setCustomName] = useState(initial?.name ?? '')
  const [status, setStatus] = useState(initial?.status ?? '')
  const [level, setLevel] = useState(initial?.level ?? '')
  const [age, setAge] = useState(initial?.age ?? '')
  const [pay, setPay] = useState<PayRates>(initial?.pay ?? EMPTY_PAY)
  const [overtime, setOvertime] = useState(initial?.overtimeEnabled ?? false)
  const isForeign = taxProfile.residency === 'foreign'
  const [claimTft, setClaimTft] = useState(
    initial?.claimsTaxFreeThreshold ??
      (!isForeign && rates.filter((r) => !r.archived).every((r) => !r.claimsTaxFreeThreshold)),
  )
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)
  const busy = useRef(false)
  const lookup = useRef(0)

  const isCustom = rateId === CUSTOM_ID

  function recompute(s: string, l: string, a: string) {
    const ticket = ++lookup.current
    if (s && l && a) {
      getAwardRate(s, l, Number(a))
        .then((next) => {
          if (ticket === lookup.current) setPay(next)
        })
        .catch(() => {
          if (ticket === lookup.current) setPay(EMPTY_PAY)
        })
    } else {
      setPay(EMPTY_PAY)
    }
  }

  function changeRate(id: string) {
    setRateId(id)
    lookup.current++
    setPay(EMPTY_PAY)
    if (id === PRESET_ID) recompute(status, level, age)
  }

  const setOrd = (key: keyof PayRates['ordinary'], v: number) =>
    setPay((p) => ({ ...p, ordinary: { ...p.ordinary, [key]: v } }))
  const setOt = (key: keyof PayRates['overtime'], v: number) =>
    setPay((p) => ({ ...p, overtime: { ...p.overtime, [key]: v } }))

  const name = customName.trim() || (isCustom ? '' : t('settings.rates.fastFood'))
  const canConfirm = isCustom ? name !== '' : Boolean(status && level && age)

  const pick = [{ value: '', label: t('settings.rates.select') }]

  async function handleConfirm() {
    if (busy.current) return
    busy.current = true
    setSaving(true)
    setFailed(false)
    try {
      await onConfirm({
        id: initial?.id ?? '',
        name,
        pay,
        overtimeEnabled: overtime,
        kind: isCustom ? 'custom' : 'preset',
        status,
        level,
        age,
        claimsTaxFreeThreshold: !isForeign && claimTft,
      })
    } catch {
      setFailed(true)
    } finally {
      busy.current = false
      setSaving(false)
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-[#27272A] bg-[#09090B] p-4 sm:p-5">
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
        <TextInput
          label={t('settings.rates.name')}
          placeholder={isCustom ? t('settings.rates.namePlaceholder') : t('settings.rates.fastFood')}
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
        />
        {isCustom ? null : (
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
      <div className="mt-3 grid gap-x-8 gap-y-1 md:grid-cols-2">
        <MoneyField label={t('settings.rates.weekday')} value={pay.ordinary.weekday} onChange={(v) => setOrd('weekday', v)} />
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
          className="h-5 w-5 accent-[#C8E664] sm:h-4 sm:w-4"
        />
        {t('settings.rates.overtime')}
      </label>
      {overtime ? (
        <div className="mt-3 grid gap-x-8 gap-y-1 md:grid-cols-2">
          <MoneyField label={t('settings.rates.first2')} value={pay.overtime.first2} onChange={(v) => setOt('first2', v)} />
          <MoneyField label={t('settings.rates.after2')} value={pay.overtime.after2} onChange={(v) => setOt('after2', v)} />
          <MoneyField label={t('settings.rates.sunday')} value={pay.overtime.sunday} onChange={(v) => setOt('sunday', v)} />
          <MoneyField label={t('settings.rates.publicHoliday')} value={pay.overtime.publicHoliday} onChange={(v) => setOt('publicHoliday', v)} />
        </div>
      ) : null}

      {isForeign ? null : (
        <div className="mt-6">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-[#F4F4F5]">
            <input
              type="checkbox"
              checked={claimTft}
              onChange={(e) => setClaimTft(e.target.checked)}
              className="h-5 w-5 accent-[#C8E664] sm:h-4 sm:w-4"
            />
            {t('settings.rates.claimTaxFree')}
          </label>
          <p className="mt-1.5 text-xs text-[#71717A]">{t('settings.rates.claimTaxFreeHint')}</p>
        </div>
      )}

      {failed ? (
        <p className="mt-4 text-sm text-[#EF4444]" role="alert">
          {t('settings.rates.saveError')}
        </p>
      ) : null}

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="white" className="min-h-11 sm:min-h-0" onClick={onCancel}>
          {t('settings.rates.cancel')}
        </Button>
        <Button
          disabled={!canConfirm || saving}
          className="min-h-11 disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-0"
          onClick={() => void handleConfirm()}
        >
          {t('settings.rates.confirm')}
        </Button>
      </div>
    </div>
  )
}
