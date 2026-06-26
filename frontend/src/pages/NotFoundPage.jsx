import { Link } from 'react-router-dom'
import Button from '@/components/ui/Button'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[calc(100vh-9rem)] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-7xl font-bold text-brand-100">404</p>
      <h1 className="text-2xl font-semibold text-ink">Page not found</h1>
      <p className="text-muted">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      <Link to="/" className="mt-2">
        <Button variant="outline">Back to home</Button>
      </Link>
    </div>
  )
}
