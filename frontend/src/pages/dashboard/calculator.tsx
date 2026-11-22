import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SavingCard } from '../../../components/calculator/saving_card'
import { SavingForm } from '../../../components/calculator/saving_form'
import { Button } from '../../../components/button/button'
import { PageHeader } from '../../../components/layout/page_header'
import { LoadError } from '../../../components/skeleton/load_error'
import { LoadingRegion, Skeleton } from '../../../components/skeleton/skeleton'
import { usePayData } from '../../context/PayDataContext'
import { jobColorMap } from '../../lib/calendar'
import { jobHoursForPrice, formatDuration } from '../../lib/calculator'
import type { Saving } from '../../lib/api'
import { useSavings } from '../../lib/queries'
import { formatMoney } from '../../lib/timesheet'

const EXAMPLE_PRICE = 2000

export function Calculator() {
  const { t } = useTranslation()
  const { rates } = usePayData()
  const { savings, loading, error, retry, add, update, remove } = useSavings()
  const jobColors = useMemo(() => jobColorMap(rates), [rates])
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Saving | null>(null)

  const activeJobs = useMemo(() => rates.filter((rate) => !rate.archived), [rates])

  const jobName = useCallback(
    (id: string) => rates.find((rate) => rate.id === id)?.name ?? id,
    [rates],
  )

  const example = useMemo(() => jobHoursForPrice(EXAMPLE_PRICE, rates), [rates])

  function openAdd() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(saving: Saving) {
    setEditing(saving)
    setFormOpen(true)
  }

  return (
    <>
      <PageHeader
        title={t('calculator.title')}
        description={t('calculator.subtitle')}
        actions={
          <Button type="button" size="sm" onClick={openAdd}>
            {t('calculator.addNew')}
          </Button>
        }
      />
      {error ? <LoadError onRetry={retry} /> : null}
      {error ? null : (
        <>
          {activeJobs.length === 0 ? (
            <p className="rounded-xl border border-[#27272A] bg-[#18181B] p-4 text-sm text-[#A1A1AA]">
              {t('calculator.noJobs')}{' '}
              <Link to="/dashboard/settings" className="font-medium text-[#C8E664] hover:underline">
                {t('calculator.goSettings')}
              </Link>
            </p>
          ) : null}

          {loading ? (
            <LoadingRegion label={t('common.loading')}>
              <div className="space-y-3">
                <Skeleton className="h-32 rounded-xl" />
                <Skeleton className="h-32 rounded-xl" />
              </div>
            </LoadingRegion>
          ) : savings.length === 0 ? (
            <section className="rounded-xl border border-[#27272A] bg-[#18181B] p-4 sm:p-5">
              <h2 className="text-sm font-semibold text-[#F4F4F5]">{t('calculator.exampleTitle')}</h2>
              <p className="mt-2 text-sm text-[#A1A1AA]">{t('calculator.exampleBody', { price: EXAMPLE_PRICE })}</p>
              <p className="mt-2 text-lg font-semibold text-[#C8E664]">${formatMoney(EXAMPLE_PRICE)} AUD</p>
              <ul className="mt-3 space-y-2 text-sm text-[#E4E4E7]">
                {example.map((row) => (
                  <li key={row.jobId}>
                    <span className="font-semibold" style={{ color: jobColors.get(row.jobId) }}>
                      {jobName(row.jobId)}
                    </span>
                    {': '}
                    {row.weekday
                      ? t('calculator.exampleLine', {
                          hours: formatDuration(row.weekday.totalMinutes),
                          rate: formatMoney(row.weekday.rate),
                        })
                      : t('calculator.noWeekdayRate')}
                  </li>
                ))}
              </ul>
              <Button type="button" className="mt-4" onClick={openAdd}>
                {t('calculator.addNew')}
              </Button>
            </section>
          ) : (
            <div className="space-y-4">
              {savings.map((saving) => (
                <SavingCard
                  key={saving.id}
                  saving={saving}
                  rates={rates}
                  jobName={jobName}
                  jobColors={jobColors}
                  onEdit={() => openEdit(saving)}
                  onDelete={() => remove(saving.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
      {formOpen ? (
        <SavingForm
          key={editing?.id ?? 'new'}
          open
          initial={editing}
          rates={rates}
          jobName={jobName}
          jobColors={jobColors}
          onClose={() => setFormOpen(false)}
          onSave={async (body) => {
            if (editing) await update(editing.id, body)
            else await add(body)
          }}
        />
      ) : null}
    </>
  )
}

export default Calculator