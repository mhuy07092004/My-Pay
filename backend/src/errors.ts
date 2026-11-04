import type { ErrorRequestHandler } from 'express'
import { ZodError } from 'zod'

export class AppError extends Error {
  status: number
  code: string
  constructor(status: number, code: string) {
    super(code)
    this.status = status
    this.code = code
  }
}

type DbError = { code?: string; message?: string }

/** Throws an AppError for a Supabase/PostgREST error, if any. */
export function check<T>(result: { data: T; error: DbError | null }): T {
  if (result.error) throw fromDbError(result.error)
  return result.data
}

export function fromDbError(error: DbError): AppError {
  const message = error.message ?? ''
  switch (error.code) {
    case '23P01':
      return new AppError(409, message.includes('shifts_no_overlap') ? 'shift_overlap' : 'period_overlap')
    case '22023':
      if (message.includes('zero_length_shift')) return new AppError(400, 'zero_length_shift')
      if (message.includes('invalid_break')) return new AppError(400, 'invalid_break')
      if (message.includes('date_outside_period')) return new AppError(400, 'date_outside_period')
      if (message.includes('invalid_period_length')) return new AppError(400, 'invalid_period_length')
      return new AppError(400, 'invalid_value')
    case 'P0001':
      return new AppError(400, message.includes('foreign_resident') ? 'foreign_resident' : 'invalid_value')
    case '23505':
      return new AppError(409, message.includes('jobs_one_tax_free_threshold') ? 'tax_free_conflict' : 'conflict')
    case '23503':
      return new AppError(409, 'in_use')
    case '23514':
      return new AppError(400, 'invalid_value')
    case 'P0002':
      return new AppError(404, 'not_found')
    case 'PGRST116':
      return new AppError(404, 'not_found')
    case '42501':
      return new AppError(403, 'forbidden')
    default:
      console.error('Database error', error)
      return new AppError(500, 'internal')
  }
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: err.code })
    return
  }
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'invalid_request', issues: err.issues.map((i) => i.path.join('.')) })
    return
  }
  if (err && typeof err === 'object' && 'type' in err && err.type === 'entity.parse.failed') {
    res.status(400).json({ error: 'invalid_json' })
    return
  }
  console.error(err)
  res.status(500).json({ error: 'internal' })
}
