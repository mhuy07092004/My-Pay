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

const saveDayResult = z.object({
  affected: z.array(z.string()),
  deleted: z.array(z.string()),
})

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

  /** Replaces every shift on one calendar day. Periods are created or removed per job. */
  router.put('/days/:date', async (req, res) => {
    const date = isoDate.parse(req.params.date)
    const body = z.object({ shifts: z.array(shiftInput).max(2) }).parse(req.body)
    const ordered = [...body.shifts].sort(
      (a, b) => a.checkIn.localeCompare(b.checkIn) || a.checkOut.localeCompare(b.checkOut),
    )
    const raw = check(
      await req.db!.rpc('save_day', {
        p_date: date,
        p_shifts: ordered,
      }),
    )
    const saved = saveDayResult.parse(raw)
    const [ctx, loaded] = await Promise.all([
      loadContext(req.db!, req.user!.id),
      Promise.all(saved.affected.map((id) => loadPeriodRows(req.db!, id))),
    ])
    const periods = loaded.flatMap(({ periods: rows, shifts }) =>
      rows.length > 0 ? [toPeriodDto(rows[0], shifts, ctx)] : [],
    )
    res.json({ periods, deleted: saved.deleted })
  })

  return router
}
