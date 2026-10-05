import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SEED_RATES, type SavedRate } from '../../mock/rates'
import { Button } from '../button/button'
import { RateForm } from './rate_form'

export function RatesCard() {
  const { t } = useTranslation()
  const [rates, setRates] = useState<SavedRate[]>(SEED_RATES)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  return (
    <section className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
      <h2 className="text-lg font-semibold tracking-tight">
        {t('settings.rates.title')}
      </h2>

      <ul className="mt-4 space-y-2">
        {rates.map((rate) => (
          <li key={rate.id}>
            <div className="flex items-center justify-between gap-3 rounded-lg border border-[#27272A] bg-[#09090B] px-4 py-3 text-sm">
              <span className="font-medium">
                {rate.id === 'fast-food' ? t('settings.rates.fastFood') : rate.name}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-[#A1A1AA]">
                  ${rate.pay.ordinary.saturday.toFixed(2)}
                  {t('settings.rates.perHour')}
                </span>
                <Button
                  variant="white"
                  size="sm"
                  onClick={() => {
                    setAdding(false)
                    setEditingId(editingId === rate.id ? null : rate.id)
                  }}
                >
                  {t('settings.rates.adjust')}
                </Button>
              </div>
            </div>
            {editingId === rate.id ? (
              <RateForm
                initial={rate}
                onCancel={() => setEditingId(null)}
                onConfirm={(updated) => {
                  setRates((prev) =>
                    prev.map((r) => (r.id === updated.id ? updated : r)),
                  )
                  setEditingId(null)
                }}
              />
            ) : null}
          </li>
        ))}
      </ul>

      {adding ? (
        <RateForm
          onCancel={() => setAdding(false)}
          onConfirm={(rate) => {
            setRates((prev) => [...prev, rate])
            setAdding(false)
          }}
        />
      ) : (
        <Button className="mt-4" onClick={() => {
            setEditingId(null)
            setAdding(true)
          }}>
          + {t('settings.rates.add')}
        </Button>
      )}
    </section>
  )
}
