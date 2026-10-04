import { useId } from 'react'

export type SelectOption = {
  value: string
  label: string
}

type SelectProps = {
  label: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  className?: string
}

export function Select({
  label,
  value,
  options,
  onChange,
  className = '',
}: SelectProps) {
  const id = useId()

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]"
      >
        {label}
      </label>
      <div className="relative mt-2">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-lg border border-[#27272A] bg-[#09090B] px-3 py-2.5 pr-9 text-sm text-[#F4F4F5] focus:border-[#C8E664] focus:outline-none"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#A1A1AA]"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </div>
  )
}
