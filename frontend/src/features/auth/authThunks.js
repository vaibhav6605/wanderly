import { createAsyncThunk } from '@reduxjs/toolkit'
import { authApi } from '@/api/auth.api'

const extractMessage = (err) =>
  err?.response?.data?.message ?? err?.message ?? 'Something went wrong'

export const loginThunk = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    return await authApi.login(credentials)
  } catch (err) {
    return rejectWithValue(extractMessage(err))
  }
})

export const registerThunk = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    return await authApi.register(data)
  } catch (err) {
    return rejectWithValue(extractMessage(err))
  }
})

export const logoutThunk = createAsyncThunk('auth/logout', async () => {
  try {
    await authApi.logout()
  } catch {
    // best-effort: clear credentials locally regardless of network failure
  }
})

export const refreshThunk = createAsyncThunk('auth/refresh', async (_, { rejectWithValue }) => {
  try {
    return await authApi.refresh()
  } catch (err) {
    return rejectWithValue(extractMessage(err))
  }
})
