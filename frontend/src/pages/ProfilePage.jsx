import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { updateUser } from '@/features/auth/authSlice'
import { usersApi } from '@/api/users.api'
import { authApi } from '@/api/auth.api'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import ErrorMessage from '@/components/ui/ErrorMessage'
import { ROLES } from '@/lib/constants'

const extractError = (err) => err?.response?.data?.message ?? 'Something went wrong.'

function Avatar({ name, avatarUrl }) {
  const initials = name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() ?? '?'

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="h-20 w-20 rounded-full object-cover ring-2 ring-brand-100"
      />
    )
  }

  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-500 text-2xl font-semibold text-white ring-2 ring-brand-100">
      {initials}
    </div>
  )
}

function RoleBadge({ role }) {
  const isAdmin = role === ROLES.ADMIN
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isAdmin ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-700'
      }`}
    >
      {isAdmin ? 'Admin' : 'Member'}
    </span>
  )
}

export default function ProfilePage() {
  const dispatch = useDispatch()
  const { user, accessToken } = useSelector((s) => s.auth)

  const [name, setName] = useState(user?.name ?? '')
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  const [resendLoading, setResendLoading] = useState(false)
  const [resendError, setResendError] = useState('')
  const [resendSuccess, setResendSuccess] = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    if (!name.trim() || name === user?.name) return
    setSaveError('')
    setSaveSuccess(false)
    setSaveLoading(true)
    try {
      const updated = await usersApi.updateMe({ name: name.trim() })
      dispatch(updateUser(updated))
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setSaveError(extractError(err))
    } finally {
      setSaveLoading(false)
    }
  }

  const handleResendVerification = async () => {
    setResendError('')
    setResendSuccess(false)
    setResendLoading(true)
    try {
      await authApi.resendVerification(accessToken)
      setResendSuccess(true)
    } catch (err) {
      setResendError(extractError(err))
    } finally {
      setResendLoading(false)
    }
  }

  const isDirty = name.trim() !== (user?.name ?? '')

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-2xl font-semibold text-ink">Your profile</h1>

      {/* ── Identity card ──────────────────────────────────────── */}
      <div className="flex items-center gap-5 rounded-xl border border-gray-200 bg-white p-6">
        <Avatar name={user?.name} avatarUrl={user?.avatar?.url} />
        <div className="flex flex-col gap-1">
          <p className="text-lg font-medium text-ink">{user?.name}</p>
          <p className="text-sm text-muted">{user?.email}</p>
          <div className="mt-1 flex items-center gap-2">
            <RoleBadge role={user?.role} />
            {user?.isEmailVerified ? (
              <span className="inline-flex items-center gap-1 text-xs text-green-600">
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Email verified
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Email not verified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Edit name ──────────────────────────────────────────── */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-base font-medium text-ink">Personal information</h2>
        <form onSubmit={handleSave} noValidate className="flex flex-col gap-4">
          <ErrorMessage message={saveError} />

          {saveSuccess && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              Profile updated successfully.
            </div>
          )}

          <Input
            label="Full name"
            id="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="Email"
            id="email"
            type="email"
            value={user?.email ?? ''}
            readOnly
            disabled
            className="bg-gray-50"
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              loading={saveLoading}
              disabled={!isDirty || !name.trim()}
              size="sm"
            >
              Save changes
            </Button>
          </div>
        </form>
      </div>

      {/* ── Email verification ─────────────────────────────────── */}
      {!user?.isEmailVerified && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="mb-1 text-base font-medium text-amber-900">Verify your email</h2>
          <p className="mb-4 text-sm text-amber-700">
            Verify your email address to unlock full access to Wanderly.
          </p>
          <ErrorMessage message={resendError} className="mb-3" />
          {resendSuccess && (
            <div className="mb-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              Verification email sent! Check your inbox.
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            loading={resendLoading}
            onClick={handleResendVerification}
          >
            Resend verification email
          </Button>
        </div>
      )}
    </div>
  )
}
