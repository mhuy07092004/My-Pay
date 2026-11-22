import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { DayEditor, type DayEditorState } from '../../../components/calendar/day_editor'
import { JobLegend } from '../../../components/calendar/job_legend'
import { MonthGrid } from '../../../components/calendar/month_grid'
import { MonthStats } from '../../../components/calendar/month_stats'
import { PaydayPanel } from '../../../components/calendar/payday_panel'
import { PayslipSheet } from '../../../components/calendar/payslip_sheet'
import { YearGrid } from '../../../components/calendar/year_grid'
import { PageHeader } from '../../../components/layout/page_header'
import { LoadError } from '../../../components/skeleton/load_error'
import { LoadingRegion, Skeleton } from '../../../components/skeleton/skeleton'
import { usePayData } from '../../context/PayDataContext'
import { useTimesheet } from '../../context/TimesheetContext'
import { HTML_LANG, isAppLanguage } from '../../i18n/config'
import {
  addMonths,
  indexShifts,
  jobColorMap,
  jobIdsInMonth,
  monthKey,
  parseMonthKey,
  paydaysInRange,
  startOfMonth,
  type DayEntry,
  type PaydayMark,
} from '../../lib/calendar'
import { monthEndIso, monthStartIso } from '@my-pay/engine'
import { compareStart, parseIsoDate, recentShiftTemplate, startOfDay, type Shift } from '../../lib/timesheet'

type ViewMode = 'month' | 'year'

const chevronProps = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

function parseViewFromParams(params: URLSearchParams): { mode: ViewMode; month: Date; year: number } {
  const y = params.get('y')
  const m = params.get('m')
  const today = startOfMonth(new Date())
  if (y && !m) {
    const year = Number(y)
    if (Number.isFinite(year) && year >= 1970 && year <= 2100) return { mode: 'year', month: today, year }
  }
  if (m) {
    const parsed = parseMonthKey(m)
    if (parsed) return { mode: 'month', month: parsed, year: parsed.getFullYear() }
  }
  return { mode: 'month', month: today, year: today.getFullYear() }
}

function flatShifts(periods: { shifts: Record<string, Shift> }[]): Record<string, Shift> {
  const flat: Record<string, Shift> = {}
  for (const period of periods) {
    for (const [iso, shift] of Object.entries(period.shifts)) {
      const current = flat[iso]
      if (!current) flat[iso] = shift
      else if (!current.second) {
        const [first, second] = [current, shift].sort(compareStart)
        flat[iso] = { ...first, second }
      }
    }
  }
  return flat
}

export function Timesheet() {
  const { t, i18n } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { periods, loading, error, retry, saveDay, setActual } = useTimesheet()
  const { rates, rateOf, taxContext, holidays } = usePayData()
  const locale = isAppLanguage(i18n.language) ? HTML_LANG[i18n.language] : 'en'
  const today = useMemo(() => startOfDay(new Date()), [])
  const parsed = useMemo(() => parseViewFromParams(searchParams), [searchParams])
  const { mode: viewMode, month: viewMonth, year: viewYear } = parsed
  const [editor, setEditor] = useState<DayEditorState | null>(null)
  const [payslipId, setPayslipId] = useState<string | null>(searchParams.get('period'))

  const index = useMemo(() => indexShifts(periods), [periods])
  const jobColors = useMemo(() => jobColorMap(rates), [rates])
  const monthFrom = monthStartIso(viewMonth.getFullYear(), viewMonth.getMonth())
  const monthTo = monthEndIso(viewMonth.getFullYear(), viewMonth.getMonth())
  const paydays = useMemo(
    () => paydaysInRange(rates, periods, monthFrom, monthTo),
    [rates, periods, monthFrom, monthTo],
  )
  const paydayMap = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const mark of paydays) {
      const list = map.get(mark.paymentDate) ?? []
      list.push(mark.jobId)
      map.set(mark.paymentDate, list)
    }
    return map
  }, [paydays])

  const monthTitleFmt = useMemo(() => new Intl.DateTimeFormat(locale, { month: 'long' }), [locale])
  const dayTitleFmt = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }),
    [locale],
  )

  const setMonthView = useCallback(
    (month: Date) => {
      const next = new URLSearchParams(searchParams)
      next.delete('y')
      next.set('m', monthKey(month))
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams],
  )
  const setYearView = useCallback(
    (year: number) => {
      const next = new URLSearchParams(searchParams)
      next.delete('m')
      next.set('y', String(year))
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams],
  )
  const goToday = useCallback(() => setMonthView(startOfMonth(new Date())), [setMonthView])
  const goPrev = useCallback(() => {
    if (viewMode === 'year') setYearView(viewYear - 1)
    else setMonthView(addMonths(viewMonth, -1))
  }, [viewMode, viewYear, viewMonth, setYearView, setMonthView])
  const goNext = useCallback(() => {
    if (viewMode === 'year') setYearView(viewYear + 1)
    else setMonthView(addMonths(viewMonth, 1))
  }, [viewMode, viewYear, viewMonth, setYearView, setMonthView])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goPrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goNext()
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault()
        goToday()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goPrev, goNext, goToday])

  const legendJobs = useMemo(() => {
    const active = rates.filter((rate) => !rate.archived)
    const monthIds = jobIdsInMonth(index.byMonth, monthKey(viewMonth))
    const archivedWithShifts = rates.filter((rate) => rate.archived && monthIds.has(rate.id))
    const seen = new Set<string>()
    return [...active, ...archivedWithShifts].filter((rate) => {
      if (seen.has(rate.id)) return false
      seen.add(rate.id)
      return true
    })
  }, [rates, index.byMonth, viewMonth])

  const jobName = useCallback(
    (id: string) => rates.find((rate) => rate.id === id)?.name ?? id,
    [rates],
  )

  const onDayClick = useCallback(
    (iso: string, entry: DayEntry | undefined, anchor: DOMRect) => {
      const flat = flatShifts(periods)
      setEditor({
        iso,
        anchor,
        dateLabel: dayTitleFmt.format(parseIsoDate(iso)),
        parts: entry?.parts ?? [],
        template: recentShiftTemplate(iso, flat),
        holidayName: holidays.find((holiday) => holiday.date === iso)?.name,
        paydays: paydays.filter((mark) => mark.paymentDate === iso),
      })
    },
    [dayTitleFmt, holidays, paydays, periods],
  )

  function openPayslip(mark: PaydayMark) {
    if (!mark.periodId) return
    setEditor(null)
    setPayslipId(mark.periodId)
  }

  const payslip = periods.find((period) => period.id === payslipId) ?? null

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={goToday} className="min-h-10 rounded-lg border border-[#27272A] bg-[#121212] px-3 text-sm font-medium text-[#F4F4F5] hover:bg-[#1E1E1E]">
        {t('calendar.today')}
      </button>
      <div className="flex items-center gap-1">
        <button type="button" aria-label={t('calendar.prevMonth')} onClick={goPrev} className="rounded-lg p-2 text-[#F4F4F5] hover:bg-[#27272A]">
          <svg {...chevronProps}><path d="M15 6l-6 6 6 6" /></svg>
        </button>
        <button type="button" aria-label={t('calendar.nextMonth')} onClick={goNext} className="rounded-lg p-2 text-[#F4F4F5] hover:bg-[#27272A]">
          <svg {...chevronProps}><path d="M9 6l6 6-6 6" /></svg>
        </button>
      </div>
      {viewMode === 'month' ? (
        <div className="flex items-baseline gap-2">
          <h2 className="text-lg font-semibold capitalize text-[#F4F4F5]">{monthTitleFmt.format(viewMonth)}</h2>
          <button type="button" onClick={() => setYearView(viewMonth.getFullYear())} className="text-sm font-medium text-[#C8E664]">
            {viewMonth.getFullYear()}
          </button>
        </div>
      ) : (
        <h2 className="text-lg font-semibold text-[#F4F4F5]">{viewYear}</h2>
      )}
    </div>
  )

  return (
    <>
      <PageHeader title={t('timesheet.periods.title')} actions={toolbar} />
      {error ? <LoadError onRetry={retry} /> : null}
      {error ? null : (
        <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_20rem] xl:gap-6">
          <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-3 sm:p-4">
            <JobLegend jobs={legendJobs} jobColors={jobColors} title={t('calendar.legend')} />
            {loading ? (
              <LoadingRegion label={t('common.loading')}>
                <div className="mt-4 grid grid-cols-7 gap-1.5">
                  {Array.from({ length: 42 }).map((_, i) => (
                    <Skeleton key={i} className="min-h-[4.5rem] rounded-lg" />
                  ))}
                </div>
              </LoadingRegion>
            ) : viewMode === 'year' ? (
              <div className="mt-4">
                <YearGrid year={viewYear} index={index} jobColors={jobColors} locale={locale} onPickMonth={setMonthView} />
              </div>
            ) : (
              <div className="mt-4">
                <MonthGrid
                  viewMonth={viewMonth}
                  index={index}
                  jobColors={jobColors}
                  paydays={paydayMap}
                  locale={locale}
                  today={today}
                  onDayClick={onDayClick}
                />
              </div>
            )}
          </div>
          <div className="mt-4 space-y-4 xl:mt-0">
            {viewMode === 'month' && !loading ? (
              <MonthStats
                viewMonth={viewMonth}
                index={index}
                rates={rates}
                jobColors={jobColors}
                labels={{
                  title: t('calendar.stats.title'),
                  vsLastMonth: t('calendar.stats.vsLastMonth'),
                  total: t('calendar.stats.total'),
                }}
              />
            ) : null}
            {viewMode === 'month' ? (
              <PaydayPanel marks={paydays} jobName={jobName} jobColors={jobColors} onOpen={openPayslip} />
            ) : null}
          </div>
        </div>
      )}
      <DayEditor
        state={editor}
        rates={rates}
        rateOf={rateOf}
        holidays={holidays}
        jobColors={jobColors}
        jobName={jobName}
        onClose={() => setEditor(null)}
        onSave={(shift) => (editor ? saveDay(editor.iso, shift) : Promise.resolve())}
        onOpenPayslip={(id) => {
          setEditor(null)
          setPayslipId(id)
        }}
      />
      <PayslipSheet
        period={payslip}
        rates={rates}
        rateOf={rateOf}
        taxContext={taxContext}
        holidays={holidays}
        jobColor={jobColors.get(payslip?.jobId ?? '') ?? '#C8E664'}
        onClose={() => setPayslipId(null)}
        onSaveActual={(amount) => (payslip ? setActual(payslip.id, amount) : Promise.resolve())}
      />
    </>
  )
}

export default Timesheet
