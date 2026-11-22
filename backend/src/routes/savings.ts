import { Router } from 'express'
import { z } from 'zod'
import { AppError, check } from '../errors'
import { savingFromRow } from '../mappers'

const idParam = z.string().uuid()

const savingInput = z.object({
  name: z.string().trim().min(1).max(80),
  priceCents: z.number().int().min(0).max(100_000_000),
  note: z
    .string()
    .trim()
    .max(280)
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
})

export function savingsRouter(): Router {
  const router = Router()

  router.get('/savings', async (req, res) => {
    const rows =
      check(
        await req
          .db!.from('savings')
          .select('*')
          .order('created_at', { ascending: false }),
      ) ?? []
    res.json({ savings: rows.map(savingFromRow) })
  })

  router.post('/savings', async (req, res) => {
    const body = savingInput.parse(req.body)
    const row = check(
      await req
        .db!.from('savings')
        .insert({
          user_id: req.user!.id,
          name: body.name,
          price_cents: body.priceCents,
          note: body.note ?? null,
        })
        .select('*')
        .single(),
    )
    res.status(201).json({ saving: savingFromRow(row) })
  })

  router.patch('/savings/:id', async (req, res) => {
    const id = idParam.parse(req.params.id)
    const body = savingInput.parse(req.body)
    const updated = check(
      await req
        .db!.from('savings')
        .update({
          name: body.name,
          price_cents: body.priceCents,
          note: body.note ?? null,
        })
        .eq('id', id)
        .select('*')
        .single(),
    )
    if (!updated) throw new AppError(404, 'not_found')
    res.json({ saving: savingFromRow(updated) })
  })

  router.delete('/savings/:id', async (req, res) => {
    const id = idParam.parse(req.params.id)
    check(await req.db!.from('savings').delete().eq('id', id).select('id').single())
    res.status(204).end()
  })

  return router
}