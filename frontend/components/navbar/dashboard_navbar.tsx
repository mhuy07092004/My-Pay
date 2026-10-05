import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../src/context/AuthContext'
import { LanguageSwitchButton } from '../button/swtich_button'

const mobileNavLinkClassName = ({ isActive }: { isActive: boolean }) =>
  `text-2xl font-bold transition-colors ${
    isActive ? 'text-[#A1A1AA]' : 'text-[#F4F4F5] hover:text-[#A1A1AA]'
  }`

function MobileNavContent({ onNavigate }: { onNavigate?: () => void }) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  function handleLogout() {
    logout()
    onNavigate?.()
    navigate('/login')
  }

  return (
    <nav className="flex flex-col items-center gap-8">
      <NavLink
        to="/dashboard"
        end
        className={mobileNavLinkClassName}
        onClick={onNavigate}
      >
        {t('nav.home')}
      </NavLink>
      <NavLink
        to="/dashboard/timesheet"
        className={mobileNavLinkClassName}
        onClick={onNavigate}
      >
        {t('nav.timesheet')}
      </NavLink>
      <NavLink
        to="/dashboard/settings"
        className={mobileNavLinkClassName}
        onClick={onNavigate}
      >
        {t('nav.settings')}
      </NavLink>
      <LanguageSwitchButton />
      <button
        type="button"
        className="text-2xl font-bold text-[#EF4444] transition-colors hover:text-[#DC2626]"
        onClick={handleLogout}
      >
        {t('nav.logout')}
      </button>
    </nav>
  )
}

type NavItemKey = 'home' | 'timesheet' | 'reports' | 'settings'

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
  { key: 'reports', labelKey: 'nav.reports' },
  { key: 'settings', labelKey: 'nav.settings' },
]

const navPaths: Partial<Record<NavItemKey, string>> = {
  home: '/dashboard',
  timesheet: '/dashboard/timesheet',
  settings: '/dashboard/settings',
}

const sidebarItemClassName = (isActive: boolean) =>
  `flex w-16 flex-col items-center gap-1.5 rounded-xl py-2.5 text-xs transition-colors ${
    isActive
      ? 'bg-[#2A3018] font-semibold text-[#C8E664]'
      : 'text-[#E4E4E7] hover:bg-[#1E1E1E]'
  }`

function NavContent() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <>
      <div
        className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#C8E664] text-xl font-extrabold text-black"
        title={user?.firstName ?? t('nav.guest')}
      >
        {(user?.firstName?.[0] ?? t('common.appName')[0]).toUpperCase()}
      </div>

      <nav className="mt-8 flex w-full flex-col items-center gap-3">
        {navItems.map(({ key, labelKey }) => {
          const to = navPaths[key]
          if (to) {
            return (
              <NavLink
                key={key}
                to={to}
                end={key === 'home'}
                className={({ isActive }) => sidebarItemClassName(isActive)}
              >
                {icons[key]}
                <span>{t(labelKey)}</span>
              </NavLink>
            )
          }
          return (
            <button
              key={key}
              type="button"
              className={sidebarItemClassName(false)}
            >
              {icons[key]}
              <span>{t(labelKey)}</span>
            </button>
          )
        })}
      </nav>

      <div className="mt-auto flex flex-col items-center gap-3 pt-6">
        <LanguageSwitchButton />
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg px-2 py-1.5 text-xs font-medium text-[#EF4444] transition-colors hover:bg-[#7F1D1D]/30"
        >
          {t('nav.logout')}
        </button>
      </div>
    </>
  )
}

export function DashboardNavbar() {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()

  return (
    <>
      <aside className="sticky top-0 hidden h-svh w-24 shrink-0 flex-col items-center bg-[#121212] px-2 py-5 md:flex">
        <NavContent />
      </aside>

      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-[#27272A] bg-[#09090B] px-4 md:hidden">
        <p className="text-lg font-semibold tracking-tight text-[#F4F4F5]">
          {t('common.appName')}
        </p>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-[#F4F4F5]"
          aria-expanded={open}
          aria-label={t('nav.openMenu')}
          onClick={() => setOpen(true)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4 7h16M4 12h16M4 17h16"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </header>

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-[#09090B]/70 backdrop-blur-sm"
            aria-label={t('nav.closeMenu')}
            onClick={() => setOpen(false)}
          />
          <div className="relative flex h-full w-full flex-col bg-[#09090B]/95 backdrop-blur-xl">
            <div className="flex items-center justify-between px-5 pt-5">
              <p className="text-lg font-semibold tracking-tight text-[#F4F4F5]">
                {t('common.appName')}
              </p>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md p-2 text-[#F4F4F5]"
                aria-label={t('nav.closeMenu')}
                onClick={() => setOpen(false)}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <div className="flex flex-1 items-center justify-center">
              <MobileNavContent onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
