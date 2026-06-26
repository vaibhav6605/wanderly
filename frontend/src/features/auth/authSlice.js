import { createSlice } from '@reduxjs/toolkit'
import { loginThunk, registerThunk, logoutThunk, refreshThunk } from './authThunks'

const initialState = {
  user: null,
  accessToken: null,
  status: 'idle', // idle | loading | authenticated | error
  error: null,
  isInitializing: true,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, { payload }) {
      state.user = payload.user
      state.accessToken = payload.accessToken
      state.status = 'authenticated'
      state.error = null
    },
    clearCredentials(state) {
      state.user = null
      state.accessToken = null
      state.status = 'idle'
      state.error = null
    },
    clearError(state) {
      state.error = null
      if (state.status === 'error') state.status = 'idle'
    },
    updateUser(state, { payload }) {
      if (state.user) state.user = { ...state.user, ...payload }
    },
  },
  extraReducers: (builder) => {
    builder
      // ── login ──────────────────────────────────────
      .addCase(loginThunk.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(loginThunk.fulfilled, (state, { payload }) => {
        state.user = payload.user
        state.accessToken = payload.accessToken
        state.status = 'authenticated'
        state.error = null
      })
      .addCase(loginThunk.rejected, (state, { payload }) => {
        state.status = 'error'
        state.error = payload
      })

      // ── register ───────────────────────────────────
      .addCase(registerThunk.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(registerThunk.fulfilled, (state, { payload }) => {
        state.user = payload.user
        state.accessToken = payload.accessToken
        state.status = 'authenticated'
        state.error = null
      })
      .addCase(registerThunk.rejected, (state, { payload }) => {
        state.status = 'error'
        state.error = payload
      })

      // ── logout ─────────────────────────────────────
      .addCase(logoutThunk.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null
        state.accessToken = null
        state.status = 'idle'
        state.error = null
      })
      .addCase(logoutThunk.rejected, (state) => {
        // Even on network failure, clear client-side credentials
        state.user = null
        state.accessToken = null
        state.status = 'idle'
      })

      // ── refresh (silent boot) ──────────────────────
      .addCase(refreshThunk.fulfilled, (state, { payload }) => {
        state.user = payload.user
        state.accessToken = payload.accessToken
        state.status = 'authenticated'
        state.error = null
        state.isInitializing = false
      })
      .addCase(refreshThunk.rejected, (state) => {
        state.isInitializing = false
      })
  },
})

export const { setCredentials, clearCredentials, clearError, updateUser } = authSlice.actions
export default authSlice.reducer
