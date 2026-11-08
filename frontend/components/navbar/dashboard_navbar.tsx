import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../src/context/AuthContext'
import { LanguageSwitchButton } from '../button/swtich_button'

type NavItemKey = 'home' | 'timesheet' | 'calendar' | 'reports' | 'settings'

const iconProps = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

const icons: Record<NavItemKey, React.ReactNode> = {
  home: (
    <svg {...iconProps}>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
    </svg>
  ),
  timesheet: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  calendar: (
    <svg {...iconProps}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  ),
  reports: (
    <svg {...iconProps}>
      <path d="M6 20v-7M12 20V5M18 20v-11" />
    </svg>
  ),
  settings: (
    <svg {...iconProps}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  ),
}

const navItems: { key: NavItemKey; labelKey: `nav.${NavItemKey}` }[] = [
  { key: 'home', labelKey: 'nav.home' },
  { key: 'timesheet', labelKey: 'nav.timesheet' },
  { key: 'calendar', labelKey: 'nav.calendar' },
  { key: 'reports', labelKey: 'nav.reports' },
  { key: 'settings', labelKey: 'nav.settings' },
]

const navPaths: Record<NavItemKey, string> = {
  home: '/dashboard',
  timesheet: '/dashboard/timesheet',
  calendar: '/dashboard/calendar',
  reports: '/dashboard/report',
  settings: '/dashboard/settings',
}

const sidebarItemClassName = (isActive: boolean) =>
  `flex w-16 flex-col items-center gap-1.5 rounded-xl py-2.5 text-xs transition-colors lg:h-11 lg:w-full lg:flex-row lg:gap-3 lg:px-3 lg:py-0 lg:text-sm ${
    isActive
      ? 'bg-[#2A3018] font-semibold text-[#C8E664]'
      : 'text-[#E4E4E7] hover:bg-[#1E1E1E]'
  }`

const tabItemClassName = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] transition-colors ${
    isActive ? 'font-semibold text-[#C8E664]' : 'text-[#A1A1AA]'
  }`

function useLogout() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  return () => {
    logout()
    navigate('/login')
  }
}

function Avatar({ className = '' }: { className?: string }) {
  const { user } = useAuth()
  const { t } = useTranslation()
  return (
    <div
      className={`flex shrink-0 items-center justify-center bg-[#C8E664] font-extrabold text-black ${className}`}
    >
      {(user?.firstName?.[0] ?? t('common.appName')[0]).toUpperCase()}
    </div>
  )
}

function DashboardSidebar() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const handleLogout = useLogout()

  return (
    <aside className="sticky top-0 hidden h-svh w-24 shrink-0 flex-col items-center bg-[#121212] px-2 py-5 md:flex lg:w-60 lg:items-stretch lg:px-4">
      <div
        className="flex items-center gap-3 lg:px-2"
        title={user?.firstName ?? t('nav.guest')}
      >
        <Avatar className="h-11 w-11 rounded-2xl text-xl" />
        <p className="hidden text-lg font-semibold tracking-tight lg:block">
          {t('common.appName')}
        </p>
      </div>

      <nav className="mt-8 flex w-full flex-col items-center gap-3 lg:items-stretch lg:gap-1.5">
        {navItems.map(({ key, labelKey }) => (
          <NavLink
            key={key}
            to={navPaths[key]}
            end={key === 'home'}
            className={({ isActive }) => sidebarItemClassName(isActive)}
          >
            {icons[key]}
            <span>{t(labelKey)}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-3 pt-6 lg:items-stretch">
        <div className="hidden min-w-0 px-2 lg:block">
          <p className="truncate text-sm font-medium">{user?.firstName}</p>
          <p className="truncate text-xs text-[#A1A1AA]">{user?.email}</p>
        </div>
        <LanguageSwitchButton className="lg:mx-2" />
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg px-2 py-1.5 text-xs font-medium text-[#EF4444] transition-colors hover:bg-[#7F1D1D]/30 lg:text-left lg:text-sm"
        >
          {t('nav.logout')}
        </button>
      </div>
    </aside>
  )
}

function MobileTopBar() {
  const { user } = useAuth()
  const { t } = useTranslation()
  const handleLogout = useLogout()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent | TouchEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-[calc(3.5rem+env(safe-area-inset-top))] items-center justify-between border-b border-[#27272A] bg-[#09090B] px-4 pt-[env(safe-area-inset-top)] md:hidden">
      <p className="text-lg font-semibold tracking-tight text-[#F4F4F5]">
        {t('common.appName')}
      </p>
      <div ref={ref} className="relative">
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label={t('nav.toggleMenu')}
          onClick={() => setOpen((v) => !v)}
          className="rounded-xl focus-visible:ring-2 focus-visible:ring-[#C8E664] focus-visible:outline-none"
        >
          <Avatar className="h-10 w-10 rounded-xl text-lg" />
        </button>
        {open ? (
          <div
            role="menu"
            className="absolute right-0 mt-2 w-64 rounded-2xl border border-[#27272A] bg-[#18181B] p-4 shadow-2xl"
          >
            <p className="truncate text-sm font-semibold">
              {user?.firstName ?? t('nav.guest')}
            </p>
            <p className="truncate text-xs text-[#A1A1AA]">{user?.email}</p>
            <div className="mt-4 flex items-center justify-between gap-3">
              <LanguageSwitchButton />
              <button
                type="button"
                onClick={handleLogout}
                className="min-h-11 rounded-lg px-3 text-sm font-medium text-[#EF4444] hover:bg-[#7F1D1D]/30"
              >
                {t('nav.logout')}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  )
}

function MobileTabBar() {
  const { t } = useTranslation()
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[#27272A] bg-[#09090B]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      {navItems.map(({ key, labelKey }) => (
        <NavLink key={key} to={navPaths[key]} end={key === 'home'} className={tabItemClassName}>
          {icons[key]}
          <span>{t(labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  )
}

export function DashboardNavbar() {
  return (
    <>
      <DashboardSidebar />
      <MobileTopBar />
      <MobileTabBar />
    </>
  )
}
