import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/routes/router'
import { refreshThunk } from '@/features/auth/authThunks'
import Spinner from '@/components/ui/Spinner'

export default function App() {
  const dispatch = useDispatch()
  const isInitializing = useSelector((s) => s.auth.isInitializing)

  // Attempt silent session restore from the httpOnly refresh-token cookie.
  // RouterProvider is held until this settles so protected routes never
  // flash a redirect before we know if the user has a valid session.
  useEffect(() => {
    dispatch(refreshThunk())
  }, [dispatch])

  if (isInitializing) {
    return <Spinner fullPage />
  }

  return <RouterProvider router={router} />
}
