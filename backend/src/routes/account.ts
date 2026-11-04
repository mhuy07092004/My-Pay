import { Router } from 'express'
import { z } from 'zod'
import { AppError, check } from '../errors'
import { AU_STATES, taxProfileFromRow, holidayFromRow } from '../mappers'
import { loadRules } from '../services/periods'

const profileInput = z.object({
  firstName: z.string().trim().max(60),
  lastName: z.string().trim().max(60),
  state: z.enum(AU_STATES),
})

const taxProfileInput = z.object({
  residency: z.enum(['resident', 'foreign']),
  studyLoan: z.boolean(),
  annualOffsetCents: z.number().int().min(0).max(100_000_000),
  medicareVariation: z.enum(['none', 'full', 'half']),
  payCycle: z.enum(['weekly', 'fortnightly']),
})

export function accountRouter(): Router {
  const router = Router()

  async function readProfile(req: Express.Request) {
    const row = check(await req.db!.from('profiles').select('*').eq('id', req.user!.id).maybeSingle())
    return {
      firstName: row?.first_name ?? '',
      lastName: row?.last_name ?? '',
      email: req.user!.email ?? '',
      state: row?.state ?? 'NSW',
    }
  }

  router.get('/me', async (req, res) => {
    res.json({ profile: await readProfile(req) })
  })

  router.patch('/me', async (req, res) => {
    const body = profileInput.parse(req.body)
    check(
      await req.db!
        .from('profiles')
        .upsert({
          id: req.user!.id,
          first_name: body.firstName,
          last_name: body.lastName,
          state: body.state,
        })
        .select('id')
        .single(),
    )
    res.json({ profile: await readProfile(req) })
  })

  router.get('/tax-profile', async (req, res) => {
    const row = check(
      await req.db!.from('tax_profiles').select('*').eq('user_id', req.user!.id).maybeSingle(),
    )
    res.json({ taxProfile: taxProfileFromRow(row) })
  })

  router.put('/tax-profile', async (req, res) => {
    const body = taxProfileInput.parse(req.body)
    const db = req.db!
    // A foreign resident cannot claim the tax-free threshold.
    if (body.residency === 'foreign') {
      const claimed = check(await db.from('jobs').select('id').eq('claims_tax_free_threshold', true))
      for (const job of claimed ?? []) {
        const { error } = await db.rpc('set_tax_free_threshold', { p_job_id: job.id, p_claim: false })
        if (error) check({ data: null, error })
      }
    }
    const row = check(
      await db
        .from('tax_profiles')
        .upsert({
          user_id: req.user!.id,
          residency: body.residency,
          study_loan: body.studyLoan,
          annual_offset_cents: body.annualOffsetCents,
          medicare_variation: body.medicareVariation,
          pay_cycle: body.payCycle,
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single(),
    )
    if (!row) throw new AppError(500, 'internal')
    res.json({ taxProfile: taxProfileFromRow(row) })
  })

  /** Gazetted public holidays for the user's state. */
  router.get('/holidays', async (req, res) => {
    const profile = check(await req.db!.from('profiles').select('state').eq('id', req.user!.id).maybeSingle())
    const rows =
      check(
        await req.db!
          .from('public_holidays')
          .select('holiday_date,name,starts_at')
          .eq('state', profile?.state ?? 'NSW')
          .order('holiday_date'),
      ) ?? []
    res.json({ holidays: rows.map(holidayFromRow) })
  })

  /** Tax coefficient sets, for live previews on the client. */
  router.get('/rules', async (req, res) => {
    res.json({ coeffSets: await loadRules(req.db!) })
  })

  return router
}
