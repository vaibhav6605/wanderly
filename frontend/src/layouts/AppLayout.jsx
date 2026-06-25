import { Outlet } from 'react-router-dom'

export default function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-gray-200 px-6 py-4">
        <span className="text-xl font-semibold text-brand-600">Wanderly</span>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-gray-200 px-6 py-4 text-sm text-muted">
        &copy; {new Date().getFullYear()} Wanderly
      </footer>
    </div>
  )
}
