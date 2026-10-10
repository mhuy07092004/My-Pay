type CardProps = {
  label: string
  value: string | number
  prefix?: string
  suffix?: string
  hint?: string
  className?: string
  valueClassName?: string
}

export function Card({
  label,
  value,
  prefix,
  suffix,
  hint,
  className = '',
  valueClassName = 'text-[#22C55E]',
}: CardProps) {
  return (
    <div
      className={`rounded-xl border border-[#27272A] bg-[#18181B] p-5 ${className}`}
    >
      <p className="text-sm text-[#A1A1AA]">{label}</p>
      <p
        className={`mt-2 text-3xl font-semibold tracking-tight tabular-nums ${valueClassName}`}
      >
        {prefix ? `${prefix} ` : ''}
        {value}
        {suffix ? <span className="ml-1 text-base font-medium">{suffix}</span> : null}
      </p>
      {hint ? <p className="mt-1 text-pretty text-xs text-[#A1A1AA]">{hint}</p> : null}
    </div>
  )
}
