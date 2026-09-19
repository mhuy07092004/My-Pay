import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { Link } from 'react-router-dom'

type ButtonProps = {
  variant?: 'green' | 'white'
  size?: 'sm' | 'md' | 'lg'
  to?: string
  children: ReactNode
} & ComponentPropsWithoutRef<'button'>

const variantClasses = {
  green:
    'bg-[#22C55E] text-[#052E16] hover:bg-[#16A34A] focus-visible:ring-[#22C55E]',
  white:
    'bg-[#F4F4F5] text-[#09090B] hover:bg-white focus-visible:ring-[#F4F4F5]',
} as const

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
} as const

export function Button({
  variant = 'green',
  size = 'md',
  to,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const classes = `inline-flex items-center justify-center rounded-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090B] ${variantClasses[variant]} ${sizeClasses[size]} ${className}`

  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    )
  }

  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  )
}
