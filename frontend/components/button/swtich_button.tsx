import { useTranslation } from 'react-i18next'
import { isAppLanguage, type AppLanguage } from '../../src/i18n/config'

function VnFlagIcon() {
  return (
    <svg
      width="20"
      height="14"
      viewBox="0 0 22 16"
      aria-hidden="true"
      className="rounded-[2px]"
    >
      <rect width="22" height="16" fill="#DA251D" />
      <polygon
        fill="#FF0"
        points="11,3.1 12.35,7.15 16.7,7.15 13.17,9.65 14.52,13.7 11,11.2 7.48,13.7 8.83,9.65 5.3,7.15 9.65,7.15"
      />
    </svg>
  )
}

function UsFlagIcon() {
  return (
    <svg
      width="20"
      height="14"
      viewBox="0 0 22 16"
      aria-hidden="true"
      className="rounded-[2px]"
    >
      <rect width="22" height="16" fill="#B22234" />
      <rect y="1.23" width="22" height="1.23" fill="#FFF" />
      <rect y="3.69" width="22" height="1.23" fill="#FFF" />
      <rect y="6.15" width="22" height="1.23" fill="#FFF" />
      <rect y="8.62" width="22" height="1.23" fill="#FFF" />
      <rect y="11.08" width="22" height="1.23" fill="#FFF" />
      <rect y="13.54" width="22" height="1.23" fill="#FFF" />
      <rect width="9.2" height="8.62" fill="#3C3B6E" />
    </svg>
  )
}

type LanguageSwitchButtonProps = {
  className?: string
}

export function LanguageSwitchButton({
  className = '',
}: LanguageSwitchButtonProps) {
  const { t, i18n } = useTranslation()
  const currentLanguage: AppLanguage = isAppLanguage(i18n.language)
    ? i18n.language
    : 'en'
  const isEnglish = currentLanguage === 'en'
  const nextLanguage: AppLanguage = isEnglish ? 'vn' : 'en'
  const nextLanguageName = isEnglish
    ? t('common.language.vn')
    : t('common.language.en')
  const label = t('common.language.switchTo', { language: nextLanguageName })

  return (
    <button
      type="button"
      role="switch"
      aria-checked={!isEnglish}
      aria-label={label}
      title={label}
      className={`relative inline-flex h-9 w-[4.5rem] shrink-0 rounded-full border border-[#27272A] bg-[#09090B] p-1 transition-colors hover:bg-[#18181B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22C55E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090B] ${className}`}
      onClick={() => {
        void i18n.changeLanguage(nextLanguage)
      }}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute top-1 bottom-1 w-[calc(50%-0.25rem)] rounded-full bg-[#27272A] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] transition-[left] duration-300 ease-in-out motion-reduce:transition-none ${
          isEnglish ? 'left-1' : 'left-[calc(50%+0.125rem)]'
        }`}
      />

      <span
        className={`relative z-10 flex flex-1 items-center justify-center transition-opacity duration-300 ${
          isEnglish ? 'opacity-100' : 'opacity-45'
        }`}
      >
        <UsFlagIcon />
      </span>

      <span
        className={`relative z-10 flex flex-1 items-center justify-center transition-opacity duration-300 ${
          isEnglish ? 'opacity-45' : 'opacity-100'
        }`}
      >
        <VnFlagIcon />
      </span>
    </button>
  )
}
