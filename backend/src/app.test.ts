import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from './app'
import type { AppDeps, Db } from './deps'

type Rows = Record<string, unknown[]>

/** Minimal in-memory stand-in for a Supabase client: ignores filters, returns fixtures. */
function fakeDb(
  tables: Rows,
  inserted: Array<{ table: string; row: unknown }> = [],
  rpcs: Array<{ fn: string; args: unknown }> = [],
): Db {
  const from = (table: string) => {
    let mode: 'select' | 'insert' = 'select'
    let payload: unknown = null
    const chain: Record<string, unknown> = {}
    const result = () => {
      const rows = mode === 'insert' ? [payload] : (tables[table] ?? [])
      return { rows }
    }
    const done = (one: boolean) => {
      const { rows } = result()
      return Promise.resolve({ data: one ? (rows[0] ?? null) : rows, error: null })
    }
    for (const m of ['select', 'eq', 'in', 'is', 'order', 'gt', 'lte', 'range', 'limit', 'update', 'delete', 'upsert']) {
      chain[m] = () => chain
    }
    chain.insert = (row: unknown) => {
      mode = 'insert'
      payload = { id: '11111111-1111-4111-8111-111111111111', ...(row as object) }
      inserted.push({ table, row })
      tables[table] = [payload]
      return chain
    }
    chain.single = () => done(true)
    chain.maybeSingle = () => done(true)
    chain.then = (resolve: (v: unknown) => unknown) => done(false).then(resolve)
    return chain
  }
  return {
    from,
    rpc: async (fn: string, args: unknown) => {
      rpcs.push({ fn, args })
      return { data: '11111111-1111-4111-8111-111111111111', error: null }
    },
  } as unknown as Db
}

function makeApp(tables: Rows = {}) {
  const inserted: Array<{ table: string; row: unknown }> = []
  const rpcs: Array<{ fn: string; args: unknown }> = []
  const deps: AppDeps = {
    corsOrigin: '*',
    verifyToken: async (token) => (token === 'good' ? { id: 'user-1', email: 'a@b.com' } : null),
    createDb: () => fakeDb(tables, inserted, rpcs),
  }
  return { app: createApp(deps), inserted, rpcs }
}

const auth = { Authorization: 'Bearer good' }

describe('auth', () => {
  it('rejects requests without a token', async () => {
    const { app } = makeApp()
    const res = await request(app).get('/api/jobs')
    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'unauthorized' })
  })

  it('rejects an invalid token', async () => {
    const { app } = makeApp()
    const res = await request(app).get('/api/jobs').set('Authorization', 'Bearer nope')
    expect(res.status).toBe(401)
  })

  it('exposes /api/health without auth', async () => {
    const { app } = makeApp()
    expect((await request(app).get('/api/health')).status).toBe(200)
  })
})

describe('validation', () => {
  it('400 on a malformed period body', async () => {
    const { app } = makeApp()
    const res = await request(app).post('/api/periods').set(auth).send({ startDate: 'x' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('invalid_request')
  })

  it('400 on a bad shift body', async () => {
    const { app } = makeApp()
    const res = await request(app)
      .put('/api/periods/11111111-1111-4111-8111-111111111111/days/2026-11-07')
      .set(auth)
      .send({ shifts: [{ jobId: 'not-a-uuid' }] })
    expect(res.status).toBe(400)
  })

  it('400 when the period length does not match the pay cycle', async () => {
    const { app } = makeApp({ tax_profiles: [{ pay_cycle: 'fortnightly' }] })
    const res = await request(app)
      .post('/api/periods')
      .set(auth)
      .send({ startDate: '2026-11-02', endDate: '2026-11-08' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('invalid_period_length')
  })
})

describe('main flow', () => {
  it('lists jobs mapped from rows', async () => {
    const { app } = makeApp({
      jobs: [
        {
          id: 'j1',
          name: 'Cafe',
          kind: 'custom',
          status: '',
          level: '',
          age: '',
          overtime_enabled: true,
          claims_tax_free_threshold: true,
          saturday_cents: 3000,
        },
      ],
    })
    const res = await request(app).get('/api/jobs').set(auth)
    expect(res.status).toBe(200)
    expect(res.body.jobs[0]).toMatchObject({
      id: 'j1',
      name: 'Cafe',
      claimsTaxFreeThreshold: true,
      rate: { saturday: 3000, overtimeEnabled: true },
    })
  })

  it('creates a 14-day period for a fortnightly user', async () => {
    const created = {
      id: '11111111-1111-4111-8111-111111111111',
      start_date: '2026-11-02',
      end_date: '2026-11-15',
      pay_cycle: 'fortnightly',
      actual_net_cents: null,
    }
    const { app, rpcs } = makeApp({
      tax_profiles: [{ pay_cycle: 'fortnightly' }],
      pay_periods: [created],
      tax_withholding_coefficients: [
        { effective_from: '2026-07-01', scale: 2, seq: 1, lt: null, a: '0', b: '0' },
      ],
    })
    const res = await request(app)
      .post('/api/periods')
      .set(auth)
      .send({ startDate: '2026-11-02', endDate: '2026-11-15' })
    expect(res.status).toBe(201)
    expect(rpcs[0].fn).toBe('create_period')
    expect(res.body.period).toMatchObject({
      startDate: '2026-11-02',
      endDate: '2026-11-15',
      payCycle: 'fortnightly',
      totals: { grossCents: 0, taxCents: 0 },
    })
  })
})
