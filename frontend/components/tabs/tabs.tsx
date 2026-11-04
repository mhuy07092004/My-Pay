type TabItem<T extends string> = { value: T; label: string }

type TabsProps<T extends string> = {
  items: TabItem<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel?: string
  className?: string
  /** Full-width, evenly split tabs on mobile. */
  stretch?: boolean
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  ariaLabel,
  className = '',
  stretch = false,
}: TabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`flex max-w-full gap-1 overflow-x-auto rounded-xl border border-[#27272A] bg-[#121212] p-1 ${stretch ? 'w-full sm:w-auto' : ''} ${className}`}
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
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              stretch ? 'min-h-10 flex-1 sm:min-h-0 sm:flex-none' : ''
            } ${
              active
                ? 'bg-[#2A3018] text-[#C8E664]'
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
