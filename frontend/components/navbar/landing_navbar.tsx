import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '../button/button'
import { LanguageSwitchButton } from '../button/swtich_button'

const navLinks = [
  { href: '#features', labelKey: 'nav.features' },
  { href: '#pricing', labelKey: 'nav.pricing' },
  { href: '#about', labelKey: 'nav.about' },
] as const

export function LandingNavbar() {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()

  return (
    <header className="sticky top-0 z-50 border-b border-[#27272A] bg-[#09090B]">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="text-lg font-semibold tracking-tight text-[#F4F4F5]">
          {t('common.appName')}
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-[#A1A1AA] transition-colors hover:text-[#F4F4F5]"
            >
              {t(link.labelKey)}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitchButton />
          <Button variant="white" to="/login">
            {t('nav.login')}
          </Button>
        </div>

        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-[#F4F4F5] md:hidden"
          aria-expanded={open}
          aria-label={t('nav.toggleMenu')}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
      </nav>

      {open ? (
        <div className="border-t border-[#27272A] px-4 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-[#A1A1AA] hover:text-[#F4F4F5]"
                onClick={() => setOpen(false)}
              >
                {t(link.labelKey)}
              </a>
            ))}
            <LanguageSwitchButton className="self-start" />
            <Button variant="white" to="/login" className="w-full">
              {t('nav.login')}
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  )
}
