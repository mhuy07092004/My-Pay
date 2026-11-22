import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from './app'
import type { AppDeps, Db } from './deps'
import { clearRulesCache } from './services/periods'

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
      if (fn === 'save_day') {
        return { data: { affected: ['11111111-1111-4111-8111-111111111111'], deleted: [] }, error: null }
      }
      return { data: null, error: null }
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

beforeEach(() => {
  clearRulesCache()
})

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
    const res = await request(app).put('/api/days/not-a-date').set(auth).send({ shifts: [] })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('invalid_request')
  })

  it('saves the earlier shift as part 1 whatever the input order', async () => {
    const { app, rpcs } = makeApp()
    const shift = (checkIn: string, checkOut: string) => ({
      jobId: '11111111-1111-4111-8111-111111111111',
      checkIn,
      checkOut,
      breakMinutes: 0,
      publicHoliday: false,
      overtimeMinutes: 0,
    })
    const res = await request(app)
      .put('/api/days/2026-11-07')
      .set(auth)
      .send({ shifts: [shift('14:00', '22:00'), shift('06:00', '10:00')] })
    expect(res.status).toBe(200)
    const args = rpcs[0].args as { p_shifts: Array<{ checkIn: string }> }
    expect(args.p_shifts.map((s) => s.checkIn)).toEqual(['06:00', '14:00'])
  })

  it('400 on a bad shift body', async () => {
    const { app } = makeApp()
    const res = await request(app)
      .put('/api/days/2026-11-07')
      .set(auth)
      .send({ shifts: [{ jobId: 'not-a-uuid' }] })
    expect(res.status).toBe(400)
  })
})

describe('job update', () => {
  const jobId = '22222222-2222-4222-8222-222222222222'
  const row = {
    id: jobId,
    name: 'Logistics',
    kind: 'custom',
    status: '',
    level: '',
    age: '',
    overtime_enabled: false,
    claims_tax_free_threshold: false,
    pay_cycle: 'fortnightly',
    schedule_start: '2026-11-16',
    schedule_pay_date: '2026-12-04',
  }
  const zero = {
    weekday: 0, night1: 0, night2: 0, saturday: 0, sunday: 0, publicHoliday: 0,
    otFirst2: 0, otAfter2: 0, otSunday: 0, otPublicHoliday: 0,
  }
  const body = (payDate: string) => ({
    name: 'Logistics',
    kind: 'custom',
    overtimeEnabled: false,
    claimsTaxFreeThreshold: true,
    payCycle: 'fortnightly',
    scheduleStart: '2026-11-16',
    payDate,
    rate: zero,
  })

  it('keeps periods when the schedule is unchanged', async () => {
    const { app, rpcs } = makeApp({ jobs: [row] })
    const res = await request(app).patch(`/api/jobs/${jobId}`).set(auth).send(body('2026-12-04'))
    expect(res.status).toBe(200)
    expect(rpcs.map((r) => r.fn)).toEqual(['set_tax_free_threshold'])
  })

  it('rebuilds periods when the schedule changes', async () => {
    const { app, rpcs } = makeApp({ jobs: [row] })
    const res = await request(app).patch(`/api/jobs/${jobId}`).set(auth).send(body('2026-12-02'))
    expect(res.status).toBe(200)
    expect(rpcs.map((r) => r.fn)).toContain('set_job_schedule')
  })
})

describe('bootstrap', () => {
  it('rejects a request without a token', async () => {
    const { app } = makeApp()
    const res = await request(app).get('/api/bootstrap')
    expect(res.status).toBe(401)
    expect(res.body).toEqual({ error: 'unauthorized' })
  })

  it('returns one payload and refuses caches', async () => {
    const { app } = makeApp({
      profiles: [{ id: 'user-1', first_name: 'Ada', last_name: 'Lovelace', state: 'VIC' }],
      tax_profiles: [{ residency: 'resident' }],
      jobs: [
        {
          id: 'j1',
          name: 'Cafe',
          kind: 'custom',
          status: '',
          level: '',
          age: '',
          overtime_enabled: false,
          claims_tax_free_threshold: false,
        },
      ],
      pay_periods: [
        {
          id: 'p1',
          job_id: 'j1',
          start_date: '2026-11-02',
          end_date: '2026-11-08',
          payment_date: '2026-11-11',
          pay_cycle: 'weekly',
          actual_net_cents: null,
        },
      ],
      shifts: [],
      public_holidays: [{ holiday_date: '2026-11-03', name: 'Cup Day', starts_at: null }],
    })
    const res = await request(app).get('/api/bootstrap').set(auth)
    expect(res.status).toBe(200)
    expect(res.headers['cache-control']).toBe('private, no-store')
    expect(res.body.profile).toEqual({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'a@b.com',
      state: 'VIC',
    })
    expect(res.body.taxProfile.residency).toBe('resident')
    expect(res.body.taxProfile.payCycle).toBeUndefined()
    expect(res.body.jobs[0]).toMatchObject({ id: 'j1', name: 'Cafe' })
    expect(res.body.holidays).toEqual([{ date: '2026-11-03', name: 'Cup Day', fromMinute: null }])
    expect(res.body.periods).toEqual([
      {
        id: 'p1',
        jobId: 'j1',
        startDate: '2026-11-02',
        endDate: '2026-11-08',
        paymentDate: '2026-11-11',
        payCycle: 'weekly',
        actualCents: null,
        shifts: [],
      },
    ])
    expect(res.body.periods[0].totals).toBeUndefined()
    expect(Array.isArray(res.body.coeffSets)).toBe(true)
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

  it('lists savings mapped from rows', async () => {
    const { app } = makeApp({
      savings: [
        {
          id: 's1',
          name: 'Laptop',
          price_cents: 200_000,
          note: 'upgrade',
          created_at: '2026-11-01T00:00:00.000Z',
        },
      ],
    })
    const res = await request(app).get('/api/savings').set(auth)
    expect(res.status).toBe(200)
    expect(res.body.savings[0]).toMatchObject({
      id: 's1',
      name: 'Laptop',
      priceCents: 200_000,
      note: 'upgrade',
    })
  })

  it('saves a day and returns the periods that hold those shifts', async () => {
    const created = {
      id: '11111111-1111-4111-8111-111111111111',
      job_id: 'j1',
      start_date: '2026-11-02',
      end_date: '2026-11-15',
      payment_date: '2026-11-18',
      pay_cycle: 'fortnightly',
      actual_net_cents: null,
    }
    const { app, rpcs } = makeApp({
      pay_periods: [created],
      tax_withholding_coefficients: [
        { effective_from: '2026-07-01', scale: 2, seq: 1, lt: null, a: '0', b: '0' },
      ],
    })
    const res = await request(app)
      .put('/api/days/2026-11-07')
      .set(auth)
      .send({
        shifts: [
          {
            jobId: '11111111-1111-4111-8111-111111111111',
            checkIn: '09:00',
            checkOut: '17:00',
            breakMinutes: 0,
            publicHoliday: false,
            overtimeMinutes: 0,
          },
        ],
      })
    expect(res.status).toBe(200)
    expect(rpcs[0].fn).toBe('save_day')
    expect(res.body.deleted).toEqual([])
    expect(res.body.periods[0]).toMatchObject({
      startDate: '2026-11-02',
      endDate: '2026-11-15',
      paymentDate: '2026-11-18',
      payCycle: 'fortnightly',
      totals: { grossCents: 0, taxCents: 0 },
    })
  })
})

describe('savings validation', () => {
  it('400 on a malformed saving body', async () => {
    const { app } = makeApp({ savings: [] })
    const res = await request(app).post('/api/savings').set(auth).send({ name: '', priceCents: -1 })
    expect(res.status).toBe(400)
  })
})
