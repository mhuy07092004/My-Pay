type CardProps = {
  label: string
  value: string | number
  prefix?: string
  className?: string
}

export function Card({ label, value, prefix, className = '' }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-[#27272A] bg-[#18181B] p-5 ${className}`}
    >
      <p className="text-sm text-[#A1A1AA]">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-[#22C55E]">
        {prefix ? `${prefix} ` : ''}
        {value}
      </p>
    </div>
  )
}
