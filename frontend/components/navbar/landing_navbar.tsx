import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '../button/button'
import { LanguageSwitchButton } from '../button/swtich_button'

const navLinks = [
  { href: '/features', labelKey: 'nav.features' },
  { href: '/pricing', labelKey: 'nav.pricing' },
  { href: '/about', labelKey: 'nav.about' },
] as const

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm transition-colors duration-200 hover:text-[#F4F4F5] ${
    isActive ? 'text-[#F4F4F5]' : 'text-[#A1A1AA]'
  }`

export function LandingNavbar() {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#09090B]/70 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          to="/"
          className="inline-flex min-h-8 items-center text-base font-semibold tracking-tight text-[#F4F4F5]"
        >
          {t('common.appName')}
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <NavLink key={link.href} to={link.href} className={linkClass}>
              {t(link.labelKey)}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitchButton />
          <Button variant="white" size="sm" to="/login">
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

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="mobile-menu"
            className="overflow-hidden border-t border-white/[0.08] md:hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className="flex flex-col gap-4 px-4 py-4">
              {navLinks.map((link) => (
                <NavLink
                  key={link.href}
                  to={link.href}
                  className={linkClass}
                  onClick={() => setOpen(false)}
                >
                  {t(link.labelKey)}
                </NavLink>
              ))}
              <LanguageSwitchButton className="self-start" />
              <Button variant="white" to="/login" className="w-full">
                {t('nav.login')}
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  )
}
