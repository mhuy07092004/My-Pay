import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../src/context/AuthContext'
import { usePayData } from '../../src/context/PayDataContext'
import { AU_STATES, type AuState, type Profile } from '../../src/lib/api'
import { supabase } from '../../src/lib/supabaseClient'
import { Button } from '../button/button'
import { TextInput } from '../input/text_input'
import { Select } from '../select/select'
import { LoadingRegion, Skeleton } from '../skeleton/skeleton'

export function PersonalInfoCard() {
  const { t } = useTranslation()
  const { profile, loading, error, saveProfile } = usePayData()

  if (error) return null
  if (loading || !profile) {
    return (
      <section className="rounded-xl border border-[#27272A] bg-[#18181B] p-4 sm:p-6">
        <h2 className="text-lg font-semibold tracking-tight">{t('settings.personal.title')}</h2>
        <LoadingRegion label={t('common.loading')}>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </LoadingRegion>
      </section>
    )
  }

  return <PersonalForm profile={profile} saveProfile={saveProfile} />
}

function PersonalForm({
  profile,
  saveProfile,
}: {
  profile: Profile
  saveProfile: (body: Pick<Profile, 'firstName' | 'lastName' | 'state'>) => Promise<Profile>
}) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [firstName, setFirstName] = useState(profile.firstName || user?.firstName || '')
  const [lastName, setLastName] = useState(profile.lastName || user?.lastName || '')
  const [region, setRegion] = useState<AuState>(profile.state)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const busy = useRef(false)

  async function handleSave() {
    if (busy.current) return
    busy.current = true
    setStatus('saving')
    try {
      const next = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        state: region,
      }
      await saveProfile(next)
      await supabase.auth.updateUser({
        data: { first_name: next.firstName, last_name: next.lastName },
      })
      setStatus('saved')
    } catch {
      setStatus('error')
    } finally {
      busy.current = false
    }
  }

  return (
    <section className="rounded-xl border border-[#27272A] bg-[#18181B] p-4 sm:p-6">
      <h2 className="text-lg font-semibold tracking-tight">{t('settings.personal.title')}</h2>
      <p className="mt-1 text-xs text-[#71717A]">{t('settings.personal.stateHint')}</p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <TextInput
          label={t('auth.firstName')}
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <TextInput
          label={t('auth.lastName')}
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
        <TextInput label={t('auth.email')} value={user?.email ?? profile.email} readOnly />
        <TextInput
          label={t('settings.personal.password')}
          type="password"
          value="********"
          readOnly
        />
        <Select
          label={t('settings.personal.state')}
          value={region}
          options={AU_STATES.map((code) => ({ value: code, label: t(`settings.personal.states.${code}`) }))}
          onChange={(value) => {
            setStatus('idle')
            setRegion(value as AuState)
          }}
        />
      </div>

      <div className="mt-5 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
        {status === 'saved' ? (
          <span className="text-sm text-[#C8E664]">{t('settings.personal.saved')}</span>
        ) : null}
        {status === 'error' ? (
          <span className="text-sm text-[#EF4444]" role="alert">
            {t('settings.personal.saveError')}
          </span>
        ) : null}
        <Button className="min-h-11 sm:min-h-0" disabled={status === 'saving'} onClick={() => void handleSave()}>
          {t('settings.personal.save')}
        </Button>
      </div>
    </section>
  )
}
