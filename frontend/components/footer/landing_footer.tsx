import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const SOCIAL = {
  github: 'https://github.com/mhuy07092004',
  website: 'https://haydenloi.vercel.app/',
  youtube: 'https://www.youtube.com/@ItsHuyz',
  linkedin: 'https://www.linkedin.com/in/minh-huy-loi-419079277/',
} as const

const linkClass = 'text-sm text-[#71717A] transition-colors duration-200 hover:text-[#F4F4F5]'

const iconBtn =
  'inline-flex size-9 items-center justify-center rounded-lg border border-white/[0.08] text-[#A1A1AA] transition-colors duration-200 hover:border-white/20 hover:text-[#F4F4F5]'

function SocialIcon({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: ReactNode
}) {
  return (
    <a href={href} className={iconBtn} aria-label={label} target="_blank" rel="noreferrer">
      {children}
    </a>
  )
}

type FooterTitleKey = 'footer.product.title' | 'footer.company.title' | 'footer.legal.title'

type FooterLinkKey =
  | 'footer.product.features'
  | 'footer.product.pricing'
  | 'footer.company.about'
  | 'footer.legal.privacy'
  | 'footer.legal.terms'
  | 'footer.legal.security'

type FooterLink =
  | { key: FooterLinkKey; to: string }
  | { key: FooterLinkKey; href: string }

const columns: { titleKey: FooterTitleKey; links: FooterLink[] }[] = [
  {
    titleKey: 'footer.product.title',
    links: [
      { key: 'footer.product.features', to: '/features' },
      { key: 'footer.product.pricing', to: '/pricing' },
    ],
  },
  {
    titleKey: 'footer.company.title',
    links: [{ key: 'footer.company.about', to: '/about' }],
  },
  {
    titleKey: 'footer.legal.title',
    links: [
      { key: 'footer.legal.privacy', href: '#' },
      { key: 'footer.legal.terms', href: '#' },
      { key: 'footer.legal.security', href: '#' },
    ],
  },
]

export function LandingFooter() {
  const { t } = useTranslation()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-white/[0.08] bg-[#09090B]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="md:col-span-2 lg:col-span-1">
          <p className="text-base font-semibold tracking-tight text-[#F4F4F5]">
            {t('common.appName')}
          </p>
          <p className="mt-3 max-w-xs text-sm leading-6 text-[#71717A]">{t('footer.tagline')}</p>

          <div className="mt-8">
            <p className="text-xs font-medium uppercase tracking-wider text-[#52525B]">
              {t('footer.profile')}
            </p>
            <p className="mt-2 text-sm font-medium text-[#F4F4F5]">{t('footer.creatorName')}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <SocialIcon href={SOCIAL.github} label={t('footer.social.github')}>
                <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.166 6.839 9.492.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.021C22 6.484 17.523 2 12 2Z"
                  />
                </svg>
              </SocialIcon>
              <SocialIcon href={SOCIAL.website} label={t('footer.social.website')}>
                <svg
                  viewBox="0 0 24 24"
                  className="size-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
                </svg>
              </SocialIcon>
              <SocialIcon href={SOCIAL.youtube} label={t('footer.social.youtube')}>
                <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
                  <path
                    d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814ZM9.545 15.568V8.432L15.818 12l-6.273 3.568Z"
                  />
                </svg>
              </SocialIcon>
              <SocialIcon href={SOCIAL.linkedin} label={t('footer.social.linkedin')}>
                <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
                  <path
                    d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 4.126 0 2.065 2.065 0 0 1-2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
                  />
                </svg>
              </SocialIcon>
            </div>
          </div>
        </div>

        {columns.map((column) => (
          <div key={column.titleKey}>
            <p className="text-sm font-medium text-[#F4F4F5]">{t(column.titleKey)}</p>
            <ul className="mt-4 space-y-3">
              {column.links.map((link) => (
                <li key={link.key}>
                  {'to' in link ? (
                    <Link to={link.to} className={linkClass}>
                      {t(link.key)}
                    </Link>
                  ) : (
                    <a href={link.href} className={linkClass}>
                      {t(link.key)}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/[0.08]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-[#71717A] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>{t('footer.copyright', { year })}</p>
          <div className="flex gap-5">
            <a href="#" className="transition-colors duration-200 hover:text-[#F4F4F5]">
              {t('footer.status')}
            </a>
            <a href="#" className="transition-colors duration-200 hover:text-[#F4F4F5]">
              {t('footer.support')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
