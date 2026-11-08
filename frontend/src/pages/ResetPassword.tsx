import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/button/button'
import { useAuth } from '../context/AuthContext'

const inputClassName =
  'mt-2 w-full rounded-lg border border-[#27272A] bg-[#18181B] px-3 py-2.5 text-[#F4F4F5] placeholder:text-[#71717A] focus:border-[#22C55E] focus:outline-none'

type AuthErrorKey =
  | 'auth.errors.unexpected'
  | 'auth.errors.weakPassword'
  | 'auth.errors.passwordMismatch'
  | 'auth.errors.samePassword'

function isAuthErrorKey(value: string): value is AuthErrorKey {
  return (
    value === 'auth.errors.unexpected' ||
    value === 'auth.errors.weakPassword' ||
    value === 'auth.errors.passwordMismatch' ||
    value === 'auth.errors.samePassword'
  )
}

export function ResetPassword() {
  const navigate = useNavigate()
  const { user, loading, updatePassword } = useAuth()
  const { t } = useTranslation()
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (password !== passwordConfirm) {
      setError('auth.errors.passwordMismatch')
      return
    }
    setSubmitting(true)
    try {
      await updatePassword(password)
      navigate('/dashboard')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'auth.errors.unexpected'
      setError(isAuthErrorKey(message) ? message : 'auth.errors.unexpected')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return null

  return (
    <div className="flex min-h-svh items-center justify-center bg-[#18181B] px-4 py-12 text-[#F4F4F5]">
      <div className="w-full max-w-md rounded-2xl border border-[#27272A] bg-[#09090B] p-6 sm:p-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-[#A1A1AA] transition-colors hover:text-[#F4F4F5]"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
              clipRule="evenodd"
            />
          </svg>
          {t('auth.backToHome')}
        </Link>

        <h1 className="mt-4 text-center text-2xl font-semibold tracking-tight">
          {t('auth.resetTitle')}
        </h1>

        {!user ? (
          <div className="mt-8 space-y-4 text-center">
            <p className="text-sm text-[#A1A1AA]">{t('auth.resetLinkInvalid')}</p>
            <Link
              to="/login?mode=forgot"
              className="inline-block text-sm font-medium text-[#22C55E] hover:text-[#16A34A]"
            >
              {t('auth.sendResetLink')}
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-left text-sm text-[#A1A1AA]">
              {t('auth.newPassword')}
              <input
                type="password"
                name="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
                className={inputClassName}
              />
            </label>
            <label className="block text-left text-sm text-[#A1A1AA]">
              {t('auth.retypePassword')}
              <input
                type="password"
                name="passwordConfirm"
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
                placeholder="••••••••"
                required
                className={inputClassName}
              />
            </label>
            {error ? (
              <p className="text-sm text-[#EF4444]" role="alert">
                {isAuthErrorKey(error) ? t(error) : t('auth.errors.unexpected')}
              </p>
            ) : null}
            <Button
              variant="green"
              size="lg"
              className="w-full"
              type="submit"
              disabled={submitting}
            >
              {submitting ? t('auth.updatingPassword') : t('auth.updatePassword')}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}

export default ResetPassword
