import { describe, it, expect, vi, beforeEach } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import authReducer, {
  setCredentials,
  clearCredentials,
  clearError,
  updateUser,
} from '@/features/auth/authSlice'
import { loginThunk, registerThunk, logoutThunk } from '@/features/auth/authThunks'

// ── Mock the API so thunk tests never touch the network ───────────────────────

vi.mock('@/api/auth.api', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
    getMe: vi.fn(),
  },
}))

import { authApi } from '@/api/auth.api'

// ── Helpers ──────────────────────────────────────────────────────────────────

const fakeUser = { id: 'u1', name: 'Asha Rao', email: 'asha@example.com', role: 'user' }
const fakeToken = 'eyJhbGciOiJIUzI1NiJ9.test'

function makeStore(preloadedState = {}) {
  return configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: { user: null, accessToken: null, status: 'idle', error: null, isInitializing: false, ...preloadedState } },
  })
}

// ── Pure reducer tests ────────────────────────────────────────────────────────

describe('authSlice — reducers', () => {
  it('has the correct initial state', () => {
    const state = authReducer(undefined, { type: '@@INIT' })
    expect(state.user).toBeNull()
    expect(state.accessToken).toBeNull()
    expect(state.status).toBe('idle')
    expect(state.error).toBeNull()
    expect(state.isInitializing).toBe(true)
  })

  it('setCredentials stores user and accessToken and sets status to authenticated', () => {
    const prev = authReducer(undefined, { type: '@@INIT' })
    const next = authReducer(prev, setCredentials({ user: fakeUser, accessToken: fakeToken }))
    expect(next.user).toEqual(fakeUser)
    expect(next.accessToken).toBe(fakeToken)
    expect(next.status).toBe('authenticated')
    expect(next.error).toBeNull()
  })

  it('clearCredentials wipes user, accessToken, and resets status to idle', () => {
    const authenticated = {
      user: fakeUser,
      accessToken: fakeToken,
      status: 'authenticated',
      error: null,
      isInitializing: false,
    }
    const next = authReducer(authenticated, clearCredentials())
    expect(next.user).toBeNull()
    expect(next.accessToken).toBeNull()
    expect(next.status).toBe('idle')
    expect(next.error).toBeNull()
  })

  it('clearError removes the error message and resets status from error → idle', () => {
    const errorState = { user: null, accessToken: null, status: 'error', error: 'Wrong password', isInitializing: false }
    const next = authReducer(errorState, clearError())
    expect(next.error).toBeNull()
    expect(next.status).toBe('idle')
  })

  it('clearError on a non-error status leaves status unchanged', () => {
    const loadingState = { user: null, accessToken: null, status: 'loading', error: null, isInitializing: false }
    const next = authReducer(loadingState, clearError())
    expect(next.status).toBe('loading')
  })

  it('updateUser merges partial fields into the existing user', () => {
    const state = { user: fakeUser, accessToken: fakeToken, status: 'authenticated', error: null, isInitializing: false }
    const next = authReducer(state, updateUser({ name: 'Asha R.', phone: '+919876543210' }))
    expect(next.user.name).toBe('Asha R.')
    expect(next.user.phone).toBe('+919876543210')
    expect(next.user.email).toBe(fakeUser.email)
  })

  it('updateUser is a no-op when user is null', () => {
    const state = { user: null, accessToken: null, status: 'idle', error: null, isInitializing: false }
    const next = authReducer(state, updateUser({ name: 'Ghost' }))
    expect(next.user).toBeNull()
  })
})

// ── loginThunk integration tests ─────────────────────────────────────────────

describe('loginThunk', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('sets status to loading while the request is in flight', () => {
    authApi.login.mockReturnValue(new Promise(() => {})) // never resolves
    const store = makeStore()
    store.dispatch(loginThunk({ email: 'a@a.com', password: 'pass' }))
    expect(store.getState().auth.status).toBe('loading')
    expect(store.getState().auth.error).toBeNull()
  })

  it('stores credentials and sets status to authenticated on success', async () => {
    authApi.login.mockResolvedValue({ user: fakeUser, accessToken: fakeToken })
    const store = makeStore()

    await store.dispatch(loginThunk({ email: fakeUser.email, password: 'password123' }))

    const { status, user, accessToken, error } = store.getState().auth
    expect(status).toBe('authenticated')
    expect(user).toEqual(fakeUser)
    expect(accessToken).toBe(fakeToken)
    expect(error).toBeNull()
  })

  it('sets status to error and stores the message on failure', async () => {
    const apiError = { response: { data: { message: 'Invalid credentials' } } }
    authApi.login.mockRejectedValue(apiError)
    const store = makeStore()

    await store.dispatch(loginThunk({ email: 'x@x.com', password: 'wrong' }))

    const { status, error, user, accessToken } = store.getState().auth
    expect(status).toBe('error')
    expect(error).toBe('Invalid credentials')
    expect(user).toBeNull()
    expect(accessToken).toBeNull()
  })
})

// ── registerThunk integration tests ──────────────────────────────────────────

describe('registerThunk', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('stores credentials on successful registration', async () => {
    authApi.register.mockResolvedValue({ user: fakeUser, accessToken: fakeToken })
    const store = makeStore()

    await store.dispatch(registerThunk({ name: fakeUser.name, email: fakeUser.email, password: 'password123' }))

    const { status, user } = store.getState().auth
    expect(status).toBe('authenticated')
    expect(user.email).toBe(fakeUser.email)
  })

  it('sets error on failure (e.g. duplicate email)', async () => {
    authApi.register.mockRejectedValue({ response: { data: { message: 'Email already exists' } } })
    const store = makeStore()

    await store.dispatch(registerThunk({ name: 'X', email: 'existing@a.com', password: 'pass' }))

    expect(store.getState().auth.status).toBe('error')
    expect(store.getState().auth.error).toBe('Email already exists')
  })
})

// ── logoutThunk integration tests ─────────────────────────────────────────────

describe('logoutThunk', () => {
  it('clears credentials on success', async () => {
    authApi.logout.mockResolvedValue(undefined)
    const store = makeStore({ user: fakeUser, accessToken: fakeToken, status: 'authenticated' })

    await store.dispatch(logoutThunk())

    const { user, accessToken, status } = store.getState().auth
    expect(user).toBeNull()
    expect(accessToken).toBeNull()
    expect(status).toBe('idle')
  })

  it('clears credentials even if the API call fails (best-effort logout)', async () => {
    authApi.logout.mockRejectedValue(new Error('Network error'))
    const store = makeStore({ user: fakeUser, accessToken: fakeToken, status: 'authenticated' })

    await store.dispatch(logoutThunk())

    expect(store.getState().auth.user).toBeNull()
    expect(store.getState().auth.status).toBe('idle')
  })
})
