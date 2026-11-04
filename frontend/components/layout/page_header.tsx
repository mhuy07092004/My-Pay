import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type PageHeaderProps = {
  title: ReactNode
  description?: ReactNode
  backTo?: string
  backLabel?: string
  actions?: ReactNode
}

export function PageHeader({ title, description, backTo, backLabel, actions }: PageHeaderProps) {
  return (
    <header className="mb-5 sm:mb-6">
      {backTo ? (
        <Link
          to={backTo}
          className="-ml-2 inline-flex min-h-11 items-center px-2 text-sm text-[#A1A1AA] transition-colors hover:text-[#F4F4F5]"
        >
          ← {backLabel}
        </Link>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
          {description ? <p className="mt-1.5 text-[#A1A1AA]">{description}</p> : null}
        </div>
        {actions ? <div className="w-full sm:w-auto [&>*]:w-full sm:[&>*]:w-auto">{actions}</div> : null}
      </div>
    </header>
  )
}
