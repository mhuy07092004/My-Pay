import { diffDaysIso } from '@my-pay/engine'
import { Router } from 'express'
import { z } from 'zod'
import { AppError, check } from '../errors'
import { loadContext, loadPeriodRows, toPeriodDto } from '../services/periods'

export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((s) => !Number.isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0, 10) === s)

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)
const idParam = z.string().uuid()

function spanMinutes(checkIn: string, checkOut: string): number {
  const [ah, am] = checkIn.split(':').map(Number)
  const [bh, bm] = checkOut.split(':').map(Number)
  const d = bh * 60 + bm - (ah * 60 + am)
  return d > 0 ? d : d + 1440
}

const shiftInput = z
  .object({
    jobId: z.string().uuid(),
    checkIn: time,
    checkOut: time,
    breakMinutes: z.number().int().min(0).max(1440),
    publicHoliday: z.boolean(),
    overtimeMinutes: z.number().int().min(0).max(1440),
    note: z.string().max(200).nullish(),
  })
  .superRefine((shift, ctx) => {
    const span = spanMinutes(shift.checkIn, shift.checkOut)
    if (span === 0) {
      ctx.addIssue({ code: 'custom', message: 'zero_length_shift', path: ['checkOut'] })
    } else if (shift.breakMinutes >= span) {
      ctx.addIssue({ code: 'custom', message: 'invalid_break', path: ['breakMinutes'] })
    }
  })

const dayInput = z.object({
  date: isoDate,
  shifts: z.array(shiftInput).max(2),
})

const periodInput = z.object({
  startDate: isoDate,
  endDate: isoDate,
  days: z.array(dayInput).max(14).default([]),
})

const CYCLE_DAYS = { weekly: 6, fortnightly: 13 } as const

export function periodsRouter(): Router {
  const router = Router()

  async function respond(req: Express.Request, id: string) {
    const db = req.db!
    const [ctx, { periods, shifts }] = await Promise.all([
      loadContext(db, req.user!.id),
      loadPeriodRows(db, id),
    ])
    if (periods.length === 0) throw new AppError(404, 'not_found')
    return toPeriodDto(periods[0], shifts, ctx)
  }

  router.get('/periods', async (req, res) => {
    const [ctx, { periods, shifts }] = await Promise.all([
      loadContext(req.db!, req.user!.id),
      loadPeriodRows(req.db!),
    ])
    res.json({ periods: periods.map((p) => toPeriodDto(p, shifts, ctx)) })
  })

  router.get('/periods/:id', async (req, res) => {
    res.json({ period: await respond(req, idParam.parse(req.params.id)) })
  })

  router.post('/periods', async (req, res) => {
    const body = periodInput.parse(req.body)
    const db = req.db!
    const tp = check(
      await db.from('tax_profiles').select('pay_cycle').eq('user_id', req.user!.id).maybeSingle(),
    )
    const payCycle = (tp?.pay_cycle ?? 'fortnightly') as keyof typeof CYCLE_DAYS
    if (diffDaysIso(body.startDate, body.endDate) !== CYCLE_DAYS[payCycle]) {
      throw new AppError(400, 'invalid_period_length')
    }
    const id = check(
      await db.rpc('create_period', {
        p_start: body.startDate,
        p_end: body.endDate,
        p_days: body.days,
      }),
    )
    res.status(201).json({ period: await respond(req, id as string) })
  })

  router.delete('/periods/:id', async (req, res) => {
    const id = idParam.parse(req.params.id)
    check(await req.db!.from('pay_periods').delete().eq('id', id).select('id').single())
    res.status(204).end()
  })

  router.patch('/periods/:id', async (req, res) => {
    const id = idParam.parse(req.params.id)
    const { actualCents } = z
      .object({ actualCents: z.number().int().min(0).max(1_000_000_000).nullable() })
      .parse(req.body)
    check(
      await req.db!
        .from('pay_periods')
        .update({ actual_net_cents: actualCents })
        .eq('id', id)
        .select('id')
        .single(),
    )
    res.json({ period: await respond(req, id) })
  })

  /** Replaces the shifts of one day (0 to 2) in one transaction. Rates are snapshotted in the database. */
  router.put('/periods/:id/days/:date', async (req, res) => {
    const id = idParam.parse(req.params.id)
    const date = isoDate.parse(req.params.date)
    const body = z.object({ shifts: z.array(shiftInput).max(2) }).parse(req.body)
    check(
      await req.db!.rpc('save_day', {
        p_period_id: id,
        p_date: date,
        p_shifts: body.shifts,
      }),
    )
    res.json({ period: await respond(req, id) })
  })

  return router
}
