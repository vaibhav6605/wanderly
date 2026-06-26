import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '@/api/auth.api'
import Button from '@/components/ui/Button'
import PasswordInput from '@/components/ui/PasswordInput'
import ErrorMessage from '@/components/ui/ErrorMessage'

const extractError = (err) => err?.response?.data?.message ?? 'Something went wrong. Please try again.'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [confirmError, setConfirmError] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handlePasswordChange = (e) => {
    setPassword(e.target.value)
    if (confirmError && confirm === e.target.value) setConfirmError('')
  }

  const handleConfirmChange = (e) => {
    setConfirm(e.target.value)
    if (confirmError && e.target.value === password) setConfirmError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) {
      setConfirmError('Passwords do not match')
      return
    }
    setConfirmError('')
    setError('')
    setLoading(true)
    try {
      await authApi.resetPassword({ token, password })
      setSuccess(true)
    } catch (err) {
      setError(extractError(err))
    } finally {
      setLoading(false)
    }
  }

  // ── No token in URL ────────────────────────────────────────────────────────
  if (!token) {
    return (
      <div className="flex min-h-[calc(100vh-9rem)] items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <svg className="h-7 w-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-ink">Invalid reset link</h1>
          <p className="mt-2 text-sm text-muted">
            This link is missing a reset token. It may be invalid or already used.
          </p>
          <Link to="/forgot-password">
            <Button variant="outline" className="mt-6">
              Request new link
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="flex min-h-[calc(100vh-9rem)] items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-ink">Password reset!</h1>
          <p className="mt-2 text-sm text-muted">
            Your password has been changed. You can now log in with your new password.
          </p>
          <Button onClick={() => navigate('/login', { replace: true })} className="mt-6">
            Go to login
          </Button>
        </div>
      </div>
    )
  }

  // ── Reset form ─────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-[calc(100vh-9rem)] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-ink">Set a new password</h1>
          <p className="mt-1 text-sm text-muted">Must be at least 8 characters long.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <ErrorMessage message={error} />

          <PasswordInput
            label="New password"
            id="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="Min. 8 characters"
            value={password}
            onChange={handlePasswordChange}
          />

          <PasswordInput
            label="Confirm new password"
            id="confirm"
            autoComplete="new-password"
            required
            placeholder="Repeat new password"
            value={confirm}
            onChange={handleConfirmChange}
            error={confirmError}
          />

          <Button
            type="submit"
            loading={loading}
            disabled={!password || !confirm}
            className="mt-2 w-full"
          >
            Reset password
          </Button>
        </form>
      </div>
    </div>
  )
}
