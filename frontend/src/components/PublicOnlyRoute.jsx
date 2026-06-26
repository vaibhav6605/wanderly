import { useSelector } from 'react-redux'
import { Navigate, Outlet } from 'react-router-dom'
import Spinner from '@/components/ui/Spinner'

export default function PublicOnlyRoute() {
  const { status, isInitializing } = useSelector((s) => s.auth)

  if (isInitializing) {
    return <Spinner fullPage />
  }

  if (status === 'authenticated') {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
