import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../src/context/AuthContext'
import { Button } from '../button/button'
import { TextInput } from '../input/text_input'

export function PersonalInfoCard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName, setLastName] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (avatar) URL.revokeObjectURL(avatar)
    }
  }, [avatar])

  return (
    <section className="rounded-xl border border-[#27272A] bg-[#18181B] p-5">
      <h2 className="text-lg font-semibold tracking-tight">
        {t('settings.personal.title')}
      </h2>

      <div className="mt-5 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-[#C8E664] text-2xl font-extrabold text-black">
          {avatar ? (
            <img src={avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            (firstName[0] ?? t('common.appName')[0]).toUpperCase()
          )}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">
            {t('settings.personal.avatar')}
          </p>
          <Button
            variant="white"
            size="sm"
            className="mt-2"
            onClick={() => fileRef.current?.click()}
          >
            {t('settings.personal.upload')}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) setAvatar(URL.createObjectURL(file))
              e.target.value = ''
            }}
          />
        </div>
      </div>

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
        <TextInput label={t('auth.email')} value={user?.email ?? ''} readOnly />
        <TextInput
          label={t('settings.personal.password')}
          type="password"
          value="********"
          readOnly
        />
      </div>
    </section>
  )
}
