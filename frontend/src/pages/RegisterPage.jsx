import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import PasswordInput from '@/components/ui/PasswordInput'
import ErrorMessage from '@/components/ui/ErrorMessage'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { register, isLoading, isAuthenticated, error, clearError } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [confirmError, setConfirmError] = useState('')

  useEffect(() => {
    clearError()
    return () => clearError()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true })
  }, [isAuthenticated, navigate])

  const handleConfirmChange = (e) => {
    setConfirm(e.target.value)
    if (confirmError && e.target.value === password) setConfirmError('')
  }

  const handlePasswordChange = (e) => {
    setPassword(e.target.value)
    if (confirmError && confirm === e.target.value) setConfirmError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) {
      setConfirmError('Passwords do not match')
      return
    }
    setConfirmError('')
    await register({ name, email, password })
  }

  const canSubmit = name && email && password && confirm && !isLoading

  return (
    <div className="flex min-h-[calc(100vh-9rem)] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-ink">Create your account</h1>
          <p className="mt-1 text-sm text-muted">Start exploring the world with Wanderly</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <ErrorMessage message={error} />

          <Input
            label="Full name"
            id="name"
            type="text"
            autoComplete="name"
            required
            placeholder="Alex Johnson"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <Input
            label="Email"
            id="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <PasswordInput
            label="Password"
            id="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="Min. 8 characters"
            value={password}
            onChange={handlePasswordChange}
          />

          <PasswordInput
            label="Confirm password"
            id="confirm"
            autoComplete="new-password"
            required
            placeholder="Repeat your password"
            value={confirm}
            onChange={handleConfirmChange}
            error={confirmError}
          />

          <Button type="submit" loading={isLoading} disabled={!canSubmit} className="mt-2 w-full">
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
