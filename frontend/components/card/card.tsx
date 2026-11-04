type CardProps = {
  label: string
  value: string | number
  prefix?: string
  suffix?: string
  hint?: string
  className?: string
  valueClassName?: string
  /** 'responsive' renders a compact row on mobile and a stacked card from sm. */
  layout?: 'stack' | 'responsive'
}

export function Card({
  label,
  value,
  prefix,
  suffix,
  hint,
  className = '',
  valueClassName = 'text-[#22C55E]',
  layout = 'stack',
}: CardProps) {
  const responsive = layout === 'responsive'
  const valueNode = (
    <p
      className={`font-semibold tracking-tight tabular-nums ${
        responsive ? 'shrink-0 text-xl sm:mt-2 sm:text-3xl' : 'mt-2 text-3xl'
      } ${valueClassName}`}
    >
      {prefix ? `${prefix} ` : ''}
      {value}
      {suffix ? <span className="ml-1 text-base font-medium">{suffix}</span> : null}
    </p>
  )

  if (!responsive) {
    return (
      <div className={`rounded-xl border border-[#27272A] bg-[#18181B] p-5 ${className}`}>
        <p className="text-sm text-[#A1A1AA]">{label}</p>
        {valueNode}
        {hint ? <p className="mt-1 text-pretty text-xs text-[#A1A1AA]">{hint}</p> : null}
      </div>
    )
  }

  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-xl border border-[#27272A] bg-[#18181B] p-4 sm:block sm:p-5 ${className}`}
    >
      <div className="min-w-0">
        <p className="text-sm text-[#A1A1AA]">{label}</p>
        {hint ? (
          <p className="mt-0.5 text-pretty text-xs text-[#A1A1AA] sm:hidden">{hint}</p>
        ) : null}
      </div>
      {valueNode}
      {hint ? (
        <p className="mt-1 hidden text-pretty text-xs text-[#A1A1AA] sm:block">{hint}</p>
      ) : null}
    </div>
  )
}
