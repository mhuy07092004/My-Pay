import { useTranslation } from 'react-i18next'

export function History() {
  const { t } = useTranslation()

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">{t('history.title')}</h1>
      <p className="mt-2 text-[#A1A1AA]">{t('history.subtitle')}</p>
    </>
  )
}

export default History
