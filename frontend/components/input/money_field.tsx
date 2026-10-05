import { useId } from 'react'

type MoneyFieldProps = {
  label: string
  value: number
  onChange: (value: number) => void
}

export function MoneyField({ label, value, onChange }: MoneyFieldProps) {
  const id = useId()
  return (
    <div className="flex items-center justify-between gap-4">
      <label htmlFor={id} className="text-sm text-[#E4E4E7]">
        {label}
      </label>
      <div className="flex w-32 items-center rounded-lg border border-[#27272A] bg-[#09090B] px-3 focus-within:border-[#C8E664]">
        <span className="text-sm text-[#A1A1AA]">$</span>
        <input
          id={id}
          type="number"
          min={0}
          step="0.01"
          value={value}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
          className="w-full bg-transparent px-2 py-2 text-right text-sm text-[#F4F4F5] focus:outline-none"
        />
      </div>
    </div>
  )
}
