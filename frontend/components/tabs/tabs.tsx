type TabItem<T extends string> = { value: T; label: string }

type TabsProps<T extends string> = {
  items: TabItem<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel?: string
  className?: string
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  ariaLabel,
  className = '',
}: TabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`flex max-w-full gap-1 overflow-x-auto rounded-xl border border-[#27272A] bg-[#121212] p-1 ${className}`}
    >
      {items.map((item) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm transition-colors ${
              active
                ? 'bg-[#2A3018] font-semibold text-[#C8E664]'
                : 'text-[#A1A1AA] hover:bg-[#1E1E1E] hover:text-[#F4F4F5]'
            }`}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}
