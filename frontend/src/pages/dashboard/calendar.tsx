import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { DayDetail, type DayDetailState } from '../../../components/calendar/day_detail'
import { JobLegend } from '../../../components/calendar/job_legend'
import { MonthGrid } from '../../../components/calendar/month_grid'
import { MonthStats } from '../../../components/calendar/month_stats'
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
  startOfMonth,
  type DayEntry,
} from '../../lib/calendar'
import { parseIsoDate, startOfDay } from '../../lib/timesheet'

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

function parseViewFromParams(params: URLSearchParams): {
  mode: ViewMode
  month: Date
  year: number
} {
  const y = params.get('y')
  const m = params.get('m')
  const today = startOfMonth(new Date())
  if (y && !m) {
    const year = Number(y)
    if (Number.isFinite(year) && year >= 1970 && year <= 2100) {
      return { mode: 'year', month: today, year }
    }
  }
  if (m) {
    const parsed = parseMonthKey(m)
    if (parsed) {
      return { mode: 'month', month: parsed, year: parsed.getFullYear() }
    }
  }
  return { mode: 'month', month: today, year: today.getFullYear() }
}

export function Calendar() {
  const { t, i18n } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { periods, loading, error, retry } = useTimesheet()
  const { rates } = usePayData()
  const locale = isAppLanguage(i18n.language) ? HTML_LANG[i18n.language] : 'en'
  const today = useMemo(() => startOfDay(new Date()), [])

  const parsed = useMemo(() => parseViewFromParams(searchParams), [searchParams])
  const { mode: viewMode, month: viewMonth, year: viewYear } = parsed
  const [detail, setDetail] = useState<DayDetailState | null>(null)

  const index = useMemo(() => indexShifts(periods), [periods])
  const jobColors = useMemo(() => jobColorMap(rates), [rates])

  const monthTitleFmt = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }),
    [locale],
  )
  const dayTitleFmt = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }),
    [locale],
  )

  const setMonthView = useCallback(
    (month: Date) => {
      setSearchParams({ m: monthKey(month) }, { replace: true })
    },
    [setSearchParams],
  )

  const setYearView = useCallback(
    (year: number) => {
      setSearchParams({ y: String(year) }, { replace: true })
    },
    [setSearchParams],
  )

  const goToday = useCallback(() => {
    const now = startOfMonth(new Date())
    setMonthView(now)
  }, [setMonthView])

  const goPrev = useCallback(() => {
    if (viewMode === 'year') {
      setYearView(viewYear - 1)
      return
    }
    setMonthView(addMonths(viewMonth, -1))
  }, [viewMode, viewYear, viewMonth, setYearView, setMonthView])

  const goNext = useCallback(() => {
    if (viewMode === 'year') {
      setYearView(viewYear + 1)
      return
    }
    setMonthView(addMonths(viewMonth, 1))
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
    const active = rates.filter((r) => !r.archived)
    const monthIds = jobIdsInMonth(index.byMonth, monthKey(viewMonth))
    const archivedWithShifts = rates.filter((r) => r.archived && monthIds.has(r.id))
    const seen = new Set<string>()
    const list = [...active, ...archivedWithShifts].filter((r) => {
      if (seen.has(r.id)) return false
      seen.add(r.id)
      return true
    })
    if (viewMode === 'year') {
      return rates.filter((r) => {
        if (!r.archived) return true
        for (let m = 1; m <= 12; m += 1) {
          const key = `${viewYear}-${String(m).padStart(2, '0')}`
          if (index.byMonth.get(key)?.has(r.id)) return true
        }
        return false
      })
    }
    return list
  }, [rates, index.byMonth, viewMonth, viewMode, viewYear])

  const onDayClick = useCallback(
    (iso: string, entry: DayEntry | undefined, anchor: DOMRect) => {
      const date = parseIsoDate(iso)
      setDetail({
        iso,
        entry,
        anchor,
        dateLabel: dayTitleFmt.format(date),
      })
    },
    [dayTitleFmt],
  )

  const toolbar = (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={goToday}
        className="min-h-10 rounded-lg border border-[#27272A] bg-[#121212] px-3 text-sm font-medium text-[#F4F4F5] hover:bg-[#1E1E1E]"
      >
        {t('calendar.today')}
      </button>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label={viewMode === 'year' ? t('calendar.prevYear') : t('calendar.prevMonth')}
          onClick={goPrev}
          className="rounded-lg p-2 text-[#F4F4F5] hover:bg-[#27272A]"
        >
          <svg {...chevronProps}>
            <path d="M15 6l-6 6 6 6" />
          </svg>
        </button>
        <button
          type="button"
          aria-label={viewMode === 'year' ? t('calendar.nextYear') : t('calendar.nextMonth')}
          onClick={goNext}
          className="rounded-lg p-2 text-[#F4F4F5] hover:bg-[#27272A]"
        >
          <svg {...chevronProps}>
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>
      {viewMode === 'month' ? (
        <div className="flex items-baseline gap-2">
          <h2 className="text-lg font-semibold capitalize text-[#F4F4F5]">
            {monthTitleFmt.format(viewMonth)}
          </h2>
          <button
            type="button"
            onClick={() => setYearView(viewMonth.getFullYear())}
            className="text-sm font-medium text-[#C8E664] hover:text-[#B5D350]"
          >
            {viewMonth.getFullYear()}
          </button>
        </div>
      ) : (
        <h2 className="text-lg font-semibold text-[#F4F4F5]">{viewYear}</h2>
      )}
      {viewMode === 'year' ? (
        <button
          type="button"
          onClick={() => setMonthView(startOfMonth(new Date(viewYear, 0, 1)))}
          className="text-sm text-[#A1A1AA] hover:text-[#F4F4F5]"
        >
          {t('calendar.backToMonth')}
        </button>
      ) : null}
    </div>
  )

  return (
    <>
      <PageHeader title={t('calendar.title')} actions={toolbar} />
      {error ? <LoadError onRetry={retry} /> : null}
      {error ? null : (
        <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_18rem] xl:gap-6">
          <div className="space-y-4">
            <div className="hidden lg:block xl:hidden">
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
            </div>
            <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-3 sm:p-4">
              <JobLegend
                jobs={legendJobs}
                jobColors={jobColors}
                title={t('calendar.legend')}
              />
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
                  <YearGrid
                    year={viewYear}
                    index={index}
                    jobColors={jobColors}
                    locale={locale}
                    onPickMonth={setMonthView}
                  />
                </div>
              ) : (
                <div className="mt-4">
                  <MonthGrid
                    viewMonth={viewMonth}
                    index={index}
                    jobColors={jobColors}
                    locale={locale}
                    today={today}
                    onDayClick={onDayClick}
                  />
                </div>
              )}
            </div>
          </div>
          <aside className="mt-4 hidden xl:mt-0 xl:block">
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
          </aside>
        </div>
      )}
      <DayDetail
        state={detail}
        onClose={() => setDetail(null)}
        rates={rates}
        jobColors={jobColors}
        locale={locale}
        labels={{
          viewPeriod: t('calendar.viewPeriod'),
          noShift: t('calendar.noShift'),
          break: (count) => t('calendar.break', { count }),
          close: t('calendar.close'),
        }}
      />
    </>
  )
}

export default Calendar
