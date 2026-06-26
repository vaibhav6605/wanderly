import { useSelector } from 'react-redux'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import Spinner from '@/components/ui/Spinner'

export default function ProtectedRoute({ allowedRoles }) {
  const { user, status, isInitializing } = useSelector((s) => s.auth)
  const location = useLocation()

  if (isInitializing || status === 'loading') {
    return <Spinner fullPage />
  }

  if (!user || status === 'idle') {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
