import { useId } from 'react'

type TimeInputProps = {
  label: string
  value: string
  onChange: (value: string) => void
  className?: string
}

export function TimeInput({
  label,
  value,
  onChange,
  className = '',
}: TimeInputProps) {
  const id = useId()

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]"
      >
        {label}
      </label>
      <input
        id={id}
        type="time"
        step={60}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-lg border border-[#27272A] bg-[#09090B] px-3 py-2.5 text-sm text-[#F4F4F5] focus:border-[#C8E664] focus:outline-none"
      />
    </div>
  )
}
