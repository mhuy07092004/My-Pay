import { useTranslation } from 'react-i18next'

const columns = [
  {
    titleKey: 'footer.product.title',
    links: [
      'footer.product.features',
      'footer.product.pricing',
      'footer.product.integrations',
      'footer.product.changelog',
    ],
  },
  {
    titleKey: 'footer.company.title',
    links: [
      'footer.company.about',
      'footer.company.careers',
      'footer.company.blog',
      'footer.company.contact',
    ],
  },
  {
    titleKey: 'footer.legal.title',
    links: [
      'footer.legal.privacy',
      'footer.legal.terms',
      'footer.legal.security',
    ],
  },
] as const

export function LandingFooter() {
  const { t } = useTranslation()

  return (
    <footer className="hidden border-t border-[#27272A] bg-[#09090B] md:block">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          <p className="text-lg font-semibold text-[#F4F4F5]">{t('common.appName')}</p>
          <p className="mt-3 max-w-xs text-sm leading-6 text-[#A1A1AA]">
            {t('footer.tagline')}
          </p>
        </div>

        {columns.map((column) => (
          <div key={column.titleKey}>
            <p className="text-sm font-semibold text-[#F4F4F5]">{t(column.titleKey)}</p>
            <ul className="mt-4 space-y-3">
              {column.links.map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-[#A1A1AA] hover:text-[#F4F4F5]">
                    {t(link)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-[#27272A]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-[#A1A1AA] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>{t('footer.copyright', { year: new Date().getFullYear() })}</p>
          <div className="flex gap-5">
            <a href="#" className="hover:text-[#F4F4F5]">
              {t('footer.status')}
            </a>
            <a href="#" className="hover:text-[#F4F4F5]">
              {t('footer.support')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
