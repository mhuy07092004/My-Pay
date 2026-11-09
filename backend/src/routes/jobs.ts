import { Router, type Request } from 'express'
import { z } from 'zod'
import type { Db } from '../deps'
import { AppError, check } from '../errors'
import { jobFromRow, rateFromRow, rateToColumns } from '../mappers'

const cents = z.number().int().min(0).max(1_000_000)

export const rateInput = z.object({
  weekday: cents,
  night1: cents,
  night2: cents,
  saturday: cents,
  sunday: cents,
  publicHoliday: cents,
  otFirst2: cents,
  otAfter2: cents,
  otSunday: cents,
  otPublicHoliday: cents,
})

const jobInput = z.object({
  name: z.string().trim().min(1).max(80),
  kind: z.enum(['preset', 'custom']),
  status: z.string().max(20).default(''),
  level: z.string().max(5).default(''),
  age: z.string().max(5).default(''),
  overtimeEnabled: z.boolean(),
  claimsTaxFreeThreshold: z.boolean().optional(),
  rate: rateInput,
})

const idParam = z.string().uuid()

function jobColumns(body: z.infer<typeof jobInput>) {
  return {
    name: body.name,
    kind: body.kind,
    status: body.status,
    level: body.level,
    age: body.age,
    overtime_enabled: body.overtimeEnabled,
    ...rateToColumns(body.rate),
  }
}

async function setClaim(db: Db, jobId: string, claim: boolean) {
  const { error } = await db.rpc('set_tax_free_threshold', { p_job_id: jobId, p_claim: claim })
  if (error) check({ data: null, error })
}

async function getJob(db: Db, id: string) {
  const row = check(await db.from('jobs').select('*').eq('id', id).maybeSingle())
  if (!row) throw new AppError(404, 'not_found')
  return jobFromRow(row)
}

export function jobsRouter(): Router {
  const router = Router()

  router.get('/jobs', async (req: Request, res) => {
    const includeArchived = req.query.archived === '1'
    let query = req.db!.from('jobs').select('*').order('created_at')
    if (!includeArchived) query = query.is('archived_at', null)
    const rows = check(await query) ?? []
    res.json({ jobs: rows.map(jobFromRow) })
  })

  router.post('/jobs', async (req, res) => {
    const body = jobInput.parse(req.body)
    const row = check(
      await req.db!
        .from('jobs')
        .insert({ user_id: req.user!.id, ...jobColumns(body) })
        .select('*')
        .single(),
    )
    if (body.claimsTaxFreeThreshold) await setClaim(req.db!, row.id, true)
    res.status(201).json({ job: await getJob(req.db!, row.id) })
  })

  router.patch('/jobs/:id', async (req, res) => {
    const id = idParam.parse(req.params.id)
    const body = jobInput.parse(req.body)
    check(await req.db!.from('jobs').update(jobColumns(body)).eq('id', id).select('id').single())
    if (body.claimsTaxFreeThreshold !== undefined) await setClaim(req.db!, id, body.claimsTaxFreeThreshold)
    res.json({ job: await getJob(req.db!, id) })
  })

  router.post('/jobs/:id/claim-tax-free-threshold', async (req, res) => {
    const id = idParam.parse(req.params.id)
    const { claim } = z.object({ claim: z.boolean().default(true) }).parse(req.body ?? {})
    await setClaim(req.db!, id, claim)
    res.json({ job: await getJob(req.db!, id) })
  })

  /** Hard-delete a job that has no shifts. Otherwise hide it and drop its claim. */
  router.delete('/jobs/:id', async (req, res) => {
    const id = idParam.parse(req.params.id)
    const db = req.db!
    const job = check(await db.from('jobs').select('id').eq('id', id).maybeSingle())
    if (!job) throw new AppError(404, 'not_found')
    const used = check(await db.from('shifts').select('id').eq('job_id', id).limit(1)) ?? []
    if (used.length > 0) {
      check(
        await db
          .from('jobs')
          .update({ archived_at: new Date().toISOString(), claims_tax_free_threshold: false })
          .eq('id', id)
          .select('id')
          .single(),
      )
    } else {
      check(await db.from('jobs').delete().eq('id', id).select('id').single())
    }
    res.status(204).end()
  })

  /** Preset rates from the award table, for the rate form. */
  router.get('/award-rates', async (req, res) => {
    const q = z
      .object({
        status: z.enum(['fullTime', 'partTime', 'casual']),
        level: z.coerce.number().int().min(1).max(3),
        age: z.coerce.number().int().min(10).max(120),
      })
      .parse(req.query)
    const age = Math.min(Math.max(q.age, 15), 21)
    const today = new Date().toISOString().slice(0, 10)
    const rows = check(
      await req.db!
        .from('award_rates')
        .select('*')
        .eq('award', 'MA000003')
        .eq('status', q.status)
        .eq('level', q.level)
        .eq('age', age)
        .order('effective_from', { ascending: false }),
    )
    if (!rows || rows.length === 0) throw new AppError(404, 'not_found')
    // Latest set already in effect; before any set is effective, the earliest one.
    const chosen = rows.find((r) => r.effective_from <= today) ?? rows[rows.length - 1]
    res.json({ rate: rateFromRow({ ...chosen, overtime_enabled: true }) })
  })

  return router
}
