import cors from 'cors'
import express, { type NextFunction, type Request, type Response } from 'express'
import type { AppDeps } from './deps'
import { errorHandler } from './errors'
import { accountRouter } from './routes/account'
import { jobsRouter } from './routes/jobs'
import { periodsRouter } from './routes/periods'
import { reportRouter } from './routes/report'

export function createApp(deps: AppDeps) {
  const app = express()
  app.use(express.json({ limit: '100kb' }))
  if (deps.corsOrigin) app.use(cors({ origin: deps.corsOrigin }))

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true })
  })

  const api = express.Router()
  api.use(async (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization
    const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : ''
    if (!token) {
      res.status(401).json({ error: 'unauthorized' })
      return
    }
    const user = await deps.verifyToken(token)
    if (!user) {
      res.status(401).json({ error: 'unauthorized' })
      return
    }
    req.user = user
    req.db = deps.createDb(token)
    next()
  })
  api.use(accountRouter(), jobsRouter(), periodsRouter(), reportRouter())

  app.use('/api', api)
  app.use((_req, res) => {
    res.status(404).json({ error: 'not_found' })
  })
  app.use(errorHandler)
  return app
}
