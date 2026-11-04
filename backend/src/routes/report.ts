import {
  REPORT_RANGES,
  buildIncomeSeries,
  buildReportStats,
  computePeriod,
  type ReportContext,
} from '@my-pay/engine'
import { Router } from 'express'
import { z } from 'zod'
import { loadContext, loadPeriodRows, toPeriodInput, toReportPeriod } from '../services/periods'
import { isoDate } from './periods'

function sydneyToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney' }).format(new Date())
}

export function reportRouter(): Router {
  const router = Router()

  router.get('/report', async (req, res) => {
    const q = z
      .object({
        range: z.enum(REPORT_RANGES as [string, ...string[]]).default('year'),
        today: isoDate.optional(),
      })
      .parse(req.query)
    const today = q.today ?? sydneyToday()

    const [pc, { periods, shifts }] = await Promise.all([
      loadContext(req.db!, req.user!.id),
      loadPeriodRows(req.db!),
    ])
    const ctx: ReportContext = {
      jobs: pc.jobTax,
      profile: pc.taxProfile,
      coeffSets: pc.coeffSets,
      holidays: pc.holidays,
    }
    const reportPeriods = periods.map((p) => toReportPeriod(p, shifts))

    const series = buildIncomeSeries(reportPeriods, q.range as never, today, ctx)
    const stats = buildReportStats(reportPeriods, today, ctx)

    // Dashboard: gross earned from all shifts up to today.
    let grossToDateCents = 0
    for (const p of periods) {
      grossToDateCents += computePeriod(toPeriodInput(p, shifts), pc.jobTax, pc.taxProfile, pc.coeffSets, {
        upTo: today,
        holidays: pc.holidays,
      }).grossCents
    }

    res.json({ series, stats, grossToDateCents })
  })

  return router
}
