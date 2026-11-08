import { Router } from 'express'
import { loadBootstrap } from '../services/periods'

export function bootstrapRouter(): Router {
  const router = Router()

  router.get('/bootstrap', async (req, res) => {
    const body = await loadBootstrap(req.db!, req.user!)
    res.set('Cache-Control', 'private, no-store')
    res.json(body)
  })

  return router
}
