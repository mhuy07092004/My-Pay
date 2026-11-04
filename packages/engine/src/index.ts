import payg202627 from './data/payg-2026-27.json'
import type { CoeffSet } from './tax'

export * from './dates'
export * from './pay'
export * from './period'
export * from './report'
export * from './tax'

/** Reference coefficient set (same data as the DB seed). Used by tests. */
export const PAYG_2026_27 = payg202627 as unknown as CoeffSet
