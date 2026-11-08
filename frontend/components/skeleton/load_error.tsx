import { useTranslation } from 'react-i18next'
import { Button } from '../button/button'

export function LoadError({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="rounded-xl border border-[#27272A] bg-[#18181B] p-5" role="alert">
      <p className="text-sm text-[#A1A1AA]">{t('common.loadError')}</p>
      <Button className="mt-4 min-h-11" onClick={onRetry}>
        {t('common.retry')}
      </Button>
    </div>
  )
}
