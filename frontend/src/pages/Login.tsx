import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/button/button'
import { useAuth } from '../context/AuthContext'

type AuthMode = 'signin' | 'signup'
type AuthErrorKey = 'auth.errors.invalidCredentials' | 'auth.errors.unexpected'

const inputClassName =
  'mt-2 w-full rounded-lg border border-[#27272A] bg-[#18181B] px-3 py-2.5 text-[#F4F4F5] placeholder:text-[#71717A] focus:border-[#22C55E] focus:outline-none'

function isAuthErrorKey(value: string): value is AuthErrorKey {
  return (
    value === 'auth.errors.invalidCredentials' ||
    value === 'auth.errors.unexpected'
  )
}

export function Login() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()
  const { t } = useTranslation()
  const [mode, setMode] = useState<AuthMode>(() =>
    searchParams.get('mode') === 'signup' ? 'signup' : 'signin',
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'auth.errors.unexpected'
      setError(isAuthErrorKey(message) ? message : 'auth.errors.unexpected')
    } finally {
      setLoading(false)
    }
  }

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
          {mode === 'signin' ? t('auth.signIn') : t('auth.signUp')}
        </h1>

        {mode === 'signin' ? (
          <form className="mt-8 space-y-4" onSubmit={handleSignIn}>
            <label className="block text-left text-sm text-[#A1A1AA]">
              {t('auth.email')}
              <input
                type="email"
                name="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                required
                className={inputClassName}
              />
            </label>
            <label className="block text-left text-sm text-[#A1A1AA]">
              {t('auth.password')}
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
              disabled={loading}
            >
              {loading ? t('auth.signingIn') : t('auth.signIn')}
            </Button>
            <p className="text-center text-sm text-[#A1A1AA]">
              {t('auth.notAMember')}{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="font-medium text-[#22C55E] hover:text-[#16A34A]"
              >
                {t('auth.signUpNow')}
              </button>
            </p>
          </form>
        ) : (
          <form className="mt-8 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <label className="block text-left text-sm text-[#A1A1AA]">
                {t('auth.firstName')}
                <input
                  type="text"
                  name="firstName"
                  placeholder={t('auth.firstNamePlaceholder')}
                  required
                  className={inputClassName}
                />
              </label>
              <label className="block text-left text-sm text-[#A1A1AA]">
                {t('auth.lastName')}
                <input
                  type="text"
                  name="lastName"
                  placeholder={t('auth.lastNamePlaceholder')}
                  required
                  className={inputClassName}
                />
              </label>
            </div>
            <label className="block text-left text-sm text-[#A1A1AA]">
              {t('auth.email')}
              <input
                type="email"
                name="email"
                placeholder={t('auth.emailPlaceholder')}
                required
                className={inputClassName}
              />
            </label>
            <label className="block text-left text-sm text-[#A1A1AA]">
              {t('auth.password')}
              <input
                type="password"
                name="password"
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
                placeholder="••••••••"
                required
                className={inputClassName}
              />
            </label>
            <Button variant="green" size="lg" className="w-full" type="submit">
              {t('auth.signUp')}
            </Button>
            <p className="text-center text-sm text-[#A1A1AA]">
              {t('auth.alreadyMember')}{' '}
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="font-medium text-[#22C55E] hover:text-[#16A34A]"
              >
                {t('auth.signIn')}
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

export default Login
