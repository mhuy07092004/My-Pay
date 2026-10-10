import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { Link } from 'react-router-dom'

type ButtonProps = {
  variant?: 'green' | 'white' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  to?: string
  children: ReactNode
} & ComponentPropsWithoutRef<'button'>

const variantClasses = {
  green: 'bg-[#22C55E] text-[#052E16] hover:bg-[#16A34A]',
  white: 'bg-[#F4F4F5] text-[#09090B] hover:bg-white',
  ghost: 'border border-white/10 bg-white/[0.03] text-[#F4F4F5] hover:border-white/20 hover:bg-white/[0.07]',
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
  const classes = `inline-flex items-center justify-center rounded-lg font-medium transition-[color,background-color,border-color,transform] duration-200 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:outline-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`

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
