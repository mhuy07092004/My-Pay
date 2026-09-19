import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../src/context/AuthContext'
import { LanguageSwitchButton } from '../button/swtich_button'

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm transition-colors ${
    isActive
      ? 'bg-[#18181B] text-[#F4F4F5]'
      : 'text-[#A1A1AA] hover:bg-[#18181B] hover:text-[#F4F4F5]'
  }`

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
        className={mobileNavLinkClassName}
        onClick={onNavigate}
      >
        {t('nav.dashboard')}
      </NavLink>
      <button
        type="button"
        className="text-2xl font-bold text-[#F4F4F5] transition-colors hover:text-[#A1A1AA]"
        onClick={onNavigate}
      >
        {t('nav.settings')}
      </button>
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

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  function handleLogout() {
    logout()
    onNavigate?.()
    navigate('/login')
  }

  return (
    <>
      <div>
        <p className="text-lg font-semibold tracking-tight text-[#F4F4F5]">
          {t('common.appName')}
        </p>
        <div className="mt-4 rounded-lg border border-[#27272A] bg-[#18181B] px-3 py-2 text-sm text-[#F4F4F5]">
          {user?.firstName ?? t('nav.guest')}
        </div>
      </div>

      <nav className="mt-6 flex flex-col gap-1">
        <NavLink
          to="/dashboard"
          className={navLinkClassName}
          onClick={onNavigate}
        >
          {t('nav.dashboard')}
        </NavLink>
      </nav>

      <div className="mt-auto flex flex-col gap-1 pt-6">
        <LanguageSwitchButton className="mb-2 self-start" />
        <button
          type="button"
          className="rounded-lg px-3 py-2 text-left text-sm text-[#A1A1AA] transition-colors hover:bg-[#18181B] hover:text-[#F4F4F5]"
          onClick={onNavigate}
        >
          {t('nav.settings')}
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg px-3 py-2 text-left text-sm font-medium text-[#EF4444] transition-colors hover:bg-[#7F1D1D]/30"
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
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r border-[#27272A] bg-[#09090B] p-4 md:flex">
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
