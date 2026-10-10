import { formatMoney } from '../../src/lib/timesheet'

type TaxSplitBarProps = {
  afterTax: number
  tax: number
  afterTaxLabel: string
  taxLabel: string
}

export function TaxSplitBar({ afterTax, tax, afterTaxLabel, taxLabel }: TaxSplitBarProps) {
  const total = afterTax + tax
  const taxPct = total > 0 ? (tax / total) * 100 : 0
  const netPct = 100 - taxPct

  return (
    <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-[#27272A]">
        <div className="bg-[#C8E664]" style={{ width: `${netPct}%` }} />
        <div className="bg-[#F0A8A8]" style={{ width: `${taxPct}%` }} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="flex items-center gap-2 text-[#A1A1AA]">
            <span className="size-2 rounded-full bg-[#C8E664]" aria-hidden />
            {afterTaxLabel}
          </dt>
          <dd className="mt-1 font-semibold tabular-nums">
            ${formatMoney(afterTax)} <span className="text-[#A1A1AA]">{netPct.toFixed(0)}%</span>
          </dd>
        </div>
        <div>
          <dt className="flex items-center gap-2 text-[#A1A1AA]">
            <span className="size-2 rounded-full bg-[#F0A8A8]" aria-hidden />
            {taxLabel}
          </dt>
          <dd className="mt-1 font-semibold tabular-nums">
            ${formatMoney(tax)} <span className="text-[#A1A1AA]">{taxPct.toFixed(0)}%</span>
          </dd>
        </div>
      </dl>
    </div>
  )
}
