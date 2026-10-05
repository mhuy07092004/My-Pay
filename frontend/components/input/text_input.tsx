import { useId, type ComponentPropsWithoutRef } from 'react'

type TextInputProps = {
  label: string
  className?: string
} & Omit<ComponentPropsWithoutRef<'input'>, 'className'>

export function TextInput({ label, className = '', ...props }: TextInputProps) {
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
        {...props}
        className="mt-2 w-full rounded-lg border border-[#27272A] bg-[#09090B] px-3 py-2.5 text-sm text-[#F4F4F5] placeholder:text-[#52525B] read-only:text-[#A1A1AA] focus:border-[#C8E664] focus:outline-none"
      />
    </div>
  )
}
