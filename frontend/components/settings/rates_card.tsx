import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePayData } from '../../src/context/PayDataContext'
import { Button } from '../button/button'
import { RateForm } from './rate_form'

export function RatesCard() {
  const { t } = useTranslation()
  const { rates, addRate, updateRate, removeRate } = usePayData()
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const active = rates.filter((rate) => !rate.archived)

  return (
    <section className="rounded-xl border border-[#27272A] bg-[#18181B] p-4 sm:p-6">
      <h2 className="text-lg font-semibold tracking-tight">
        {t('settings.rates.title')}
      </h2>

      <ul className="mt-4 space-y-2">
        {active.map((rate) => (
          <li key={rate.id}>
            <div className="flex flex-col gap-2 rounded-lg border border-[#27272A] bg-[#09090B] px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <span className="flex flex-wrap items-center gap-2 font-medium">
                {rate.name}
                {rate.claimsTaxFreeThreshold ? (
                  <span className="rounded-full bg-[#2A3018] px-2 py-0.5 text-[10px] font-semibold text-[#C8E664]">
                    {t('settings.rates.taxFreeBadge')}
                  </span>
                ) : null}
              </span>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#A1A1AA]">
                  ${rate.pay.ordinary.weekday.toFixed(2)}
                  {t('settings.rates.perHour')}
                </span>
                <Button
                  variant="white"
                  size="sm"
                  onClick={() => {
                    setAdding(false)
                    setConfirmId(null)
                    setEditingId(editingId === rate.id ? null : rate.id)
                  }}
                >
                  {t('settings.rates.adjust')}
                </Button>
                <Button
                  variant="white"
                  size="sm"
                  onClick={() => {
                    if (confirmId === rate.id) {
                      void removeRate(rate.id).then(() => setConfirmId(null))
                      return
                    }
                    setEditingId(null)
                    setConfirmId(rate.id)
                  }}
                >
                  {confirmId === rate.id ? t('settings.rates.deleteConfirm') : t('settings.rates.delete')}
                </Button>
              </div>
            </div>
            {editingId === rate.id ? (
              <RateForm
                initial={rate}
                onCancel={() => setEditingId(null)}
                onConfirm={async (updated) => {
                  await updateRate(updated)
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
          onConfirm={async (rate) => {
            const { id: _id, ...body } = rate
            void _id
            await addRate(body)
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
