import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '@/pages/LoginPage'
import { renderWithProviders, createTestStore } from '../helpers/renderWithProviders'

// ── Mock the auth API ─────────────────────────────────────────────────────────

vi.mock('@/api/auth.api', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    getMe: vi.fn(),
  },
}))

// ── Mock framer-motion to avoid animation-related test noise ──────────────────

vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal()
  const PassThrough = ({ children, ...props }) => {
    const { initial, animate, exit, transition, whileTap, whileHover, ...rest } = props
    return <div {...rest}>{children}</div>
  }
  return { ...actual, motion: new Proxy(actual.motion, {
    get: (target, key) => key in target ? target[key] : PassThrough,
  }), AnimatePresence: ({ children }) => children }
})

import { authApi } from '@/api/auth.api'

// ── Helpers ───────────────────────────────────────────────────────────────────

const fakeUser = { id: 'u1', name: 'Asha Rao', email: 'asha@example.com', role: 'user' }
const fakeToken = 'access-token-test'

function renderLogin(preloadedState = {}) {
  return renderWithProviders(<LoginPage />, { preloadedState, initialRoute: '/login' })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('LoginPage — rendering', () => {
  it('renders the email and password fields and the submit button', () => {
    renderLogin()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument()
  })

  it('renders links to register and forgot-password pages', () => {
    renderLogin()
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument()
  })

  it('submit button is disabled when email or password is empty', () => {
    renderLogin()
    expect(screen.getByRole('button', { name: /log in/i })).toBeDisabled()
  })

  it('submit button is enabled once both fields have values', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')

    expect(screen.getByRole('button', { name: /log in/i })).not.toBeDisabled()
  })
})

describe('LoginPage — form submission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls authApi.login with the entered credentials on submit', async () => {
    authApi.login.mockResolvedValue({ user: fakeUser, accessToken: fakeToken })
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText(/email/i), 'asha@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    expect(authApi.login).toHaveBeenCalledWith({ email: 'asha@example.com', password: 'password123' })
  })

  it('updates Redux auth state to authenticated on successful login', async () => {
    authApi.login.mockResolvedValue({ user: fakeUser, accessToken: fakeToken })
    const user = userEvent.setup()
    const { store } = renderLogin()

    await user.type(screen.getByLabelText(/email/i), 'asha@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => {
      expect(store.getState().auth.status).toBe('authenticated')
      expect(store.getState().auth.user.email).toBe('asha@example.com')
    })
  })

  it('displays an error message when login fails', async () => {
    authApi.login.mockRejectedValue({ response: { data: { message: 'Invalid credentials' } } })
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText(/email/i), 'wrong@example.com')
    await user.type(screen.getByLabelText(/password/i), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })
  })

  it('sets Redux auth state to error on failure', async () => {
    authApi.login.mockRejectedValue({ response: { data: { message: 'Invalid credentials' } } })
    const user = userEvent.setup()
    const { store } = renderLogin()

    await user.type(screen.getByLabelText(/email/i), 'x@x.com')
    await user.type(screen.getByLabelText(/password/i), 'badpass1')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => {
      expect(store.getState().auth.status).toBe('error')
    })
  })
})

describe('LoginPage — already authenticated', () => {
  it('redirects away when the user is already authenticated', () => {
    const preloadedState = {
      auth: { user: fakeUser, accessToken: fakeToken, status: 'authenticated', error: null, isInitializing: false },
    }
    renderLogin({ ...preloadedState })

    // The login form should not be visible — the page navigated away.
    // With MemoryRouter the redirect happens synchronously.
    expect(screen.queryByRole('button', { name: /log in/i })).not.toBeInTheDocument()
  })
})
