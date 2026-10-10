import { formatMoney } from '../../src/lib/timesheet'

type ActualCompareProps = {
  estimated: number
  actual?: number
  estimatedLabel: string
  actualLabel: string
  differenceLabel: string
  hint: string
  notRecorded: string
}

export function ActualCompare({
  estimated,
  actual,
  estimatedLabel,
  actualLabel,
  differenceLabel,
  hint,
  notRecorded,
}: ActualCompareProps) {
  if (actual === undefined) {
    return (
      <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-5 text-sm text-[#A1A1AA]">
        {notRecorded}
      </div>
    )
  }

  const delta = actual - estimated
  const sign = delta > 0 ? '+' : delta < 0 ? '−' : ''
  const tone = delta < 0 ? 'text-[#F0A8A8]' : delta > 0 ? 'text-[#C8E664]' : 'text-[#F4F4F5]'
  const badge =
    delta < 0
      ? 'bg-[#F0A8A8]/15 text-[#F0A8A8]'
      : delta > 0
        ? 'bg-[#C8E664]/15 text-[#C8E664]'
        : 'bg-[#27272A] text-[#F4F4F5]'
  const max = Math.max(estimated, actual, 1)

  const rows = [
    { label: estimatedLabel, value: estimated, color: 'bg-[#A1A1AA]' },
    { label: actualLabel, value: actual, color: delta < 0 ? 'bg-[#F0A8A8]' : 'bg-[#C8E664]' },
  ]

  return (
    <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
      <div className="space-y-4">
        {rows.map((row) => (
          <div key={row.label}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-[#A1A1AA]">{row.label}</span>
              <span className="font-semibold tabular-nums">${formatMoney(row.value)}</span>
            </div>
            <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-[#27272A]">
              <div
                className={`h-full rounded-full ${row.color}`}
                style={{ width: `${(row.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#27272A] pt-4">
        <p className="text-sm text-[#A1A1AA]">{differenceLabel}</p>
        <p className={`rounded-full px-3 py-1 text-sm font-semibold tabular-nums ${badge} ${tone}`}>
          {sign}${formatMoney(Math.abs(delta))}
        </p>
      </div>
      <p className="mt-2 text-xs text-[#A1A1AA]">{hint}</p>
    </div>
  )
}
