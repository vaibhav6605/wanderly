import { useDispatch, useSelector } from 'react-redux'
import { clearError } from '@/features/auth/authSlice'
import { loginThunk, registerThunk, logoutThunk } from '@/features/auth/authThunks'
import { ROLES } from '@/lib/constants'

export function useAuth() {
  const dispatch = useDispatch()
  const { user, accessToken, status, error, isInitializing } = useSelector((s) => s.auth)

  return {
    user,
    accessToken,
    status,
    error,
    isInitializing,
    isAuthenticated: status === 'authenticated' && !!user,
    isLoading: status === 'loading',
    isAdmin: user?.role === ROLES.ADMIN,
    login: (credentials) => dispatch(loginThunk(credentials)),
    register: (data) => dispatch(registerThunk(data)),
    logout: () => dispatch(logoutThunk()),
    clearError: () => dispatch(clearError()),
  }
}
