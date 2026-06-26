/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useTheme } from '@/context/ThemeContext'
import Button from '@/components/ui/Button'

const NAV_LINKS = [
  { to: '/tours', label: 'Explore', prefetch: () => import('@/pages/ToursPage') },
]

const ADMIN_LINKS = [
  { to: '/admin', label: 'Admin' },
]

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function ThemeToggle() {
  const { dark, toggle } = useTheme()
  return (
    <motion.button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      whileTap={{ scale: 0.88 }}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 text-muted dark:text-gray-400 transition-colors hover:border-brand-500 hover:text-brand-500"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={dark ? 'moon' : 'sun'}
          initial={{ opacity: 0, rotate: -90, scale: 0.7 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.7 }}
          transition={{ duration: 0.18 }}
        >
          {dark ? <SunIcon /> : <MoonIcon />}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  )
}

function UserMenu({ user, logout, isLoading, close }) {
  const navigate = useNavigate()
  return (
    <div className="flex items-center gap-2">
      <NavLink
        to="/wishlist"
        onClick={close}
        aria-label="Wishlist"
        className={({ isActive }) =>
          `hidden text-sm font-medium transition-colors md:block ${isActive ? 'text-brand-500' : 'text-muted dark:text-gray-400 hover:text-ink dark:hover:text-gray-100'}`
        }
      >
        Wishlist
      </NavLink>
      <NavLink
        to="/bookings"
        onClick={close}
        className={({ isActive }) =>
          `hidden text-sm font-medium transition-colors md:block ${isActive ? 'text-brand-500' : 'text-muted dark:text-gray-400 hover:text-ink dark:hover:text-gray-100'}`
        }
      >
        My Bookings
      </NavLink>

      {/* Avatar button */}
      <button
        type="button"
        onClick={() => { navigate('/profile'); close?.() }}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white ring-2 ring-brand-100 dark:ring-brand-700 transition-shadow hover:shadow-md"
        aria-label="Profile"
      >
        {user?.name?.[0]?.toUpperCase() ?? '?'}
      </button>
      <Button variant="ghost" size="sm" loading={isLoading} onClick={logout} className="hidden text-sm md:flex">
        Log out
      </Button>
    </div>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user, isAuthenticated, isAdmin, isLoading, logout } = useAuth()
  const close = () => setOpen(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close menu on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) close() }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const navLinkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${isActive ? 'text-brand-500' : 'text-muted dark:text-gray-400 hover:text-ink dark:hover:text-gray-100'}`

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-all duration-200 ${
          scrolled
            ? 'bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl shadow-sm border-b border-gray-100/60 dark:border-gray-800/60'
            : 'bg-white dark:bg-[#0a0a0a] border-b border-gray-100 dark:border-gray-800/50'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            to="/"
            onClick={close}
            className="shrink-0 text-xl font-bold text-brand-500 tracking-tight"
          >
            Wanderly
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 md:flex" aria-label="Main navigation">
            {NAV_LINKS.map(({ to, label, prefetch }) => (
              <NavLink key={to} to={to} onMouseEnter={prefetch} className={navLinkClass}>
                {label}
              </NavLink>
            ))}
            {isAdmin && ADMIN_LINKS.map(({ to, label }) => (
              <NavLink key={to} to={to} className={navLinkClass}>
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop auth */}
          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle />
            {isAuthenticated ? (
              <UserMenu user={user} logout={logout} isLoading={isLoading} close={close} />
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Log in</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="rounded-xl">Sign up</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile controls */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle navigation"
              aria-expanded={open}
              aria-controls="mobile-menu"
              className="flex h-8 w-8 flex-col items-center justify-center gap-1.5 rounded-lg text-muted dark:text-gray-400"
            >
              <motion.span
                animate={open ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }}
                className="block h-0.5 w-5 bg-current rounded-full origin-center"
              />
              <motion.span
                animate={open ? { opacity: 0 } : { opacity: 1 }}
                className="block h-0.5 w-5 bg-current rounded-full"
              />
              <motion.span
                animate={open ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }}
                className="block h-0.5 w-5 bg-current rounded-full origin-center"
              />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
              className="fixed inset-0 z-30 bg-black/20 dark:bg-black/50 md:hidden"
              aria-hidden="true"
            />
            <motion.nav
              id="mobile-menu"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="fixed right-0 top-0 bottom-0 z-40 w-72 bg-white dark:bg-gray-900 shadow-2xl md:hidden flex flex-col"
              aria-label="Mobile navigation"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-5 py-4">
                <span className="text-base font-bold text-brand-500">Wanderly</span>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close menu"
                  className="rounded-lg p-1.5 text-muted dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="flex flex-col gap-1 overflow-y-auto p-4 flex-1">
                {NAV_LINKS.map(({ to, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={close}
                    className={({ isActive }) =>
                      `rounded-xl px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' : 'text-ink dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'}`
                    }
                  >
                    {label}
                  </NavLink>
                ))}

                {isAdmin && ADMIN_LINKS.map(({ to, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={close}
                    className={({ isActive }) =>
                      `rounded-xl px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600' : 'text-ink dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'}`
                    }
                  >
                    {label}
                  </NavLink>
                ))}

                {isAuthenticated && (
                  <>
                    <div className="my-2 border-t border-gray-100 dark:border-gray-800" />
                    <NavLink to="/wishlist" onClick={close} className={({ isActive }) => `rounded-xl px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-brand-50 text-brand-600' : 'text-ink dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                      Wishlist
                    </NavLink>
                    <NavLink to="/bookings" onClick={close} className={({ isActive }) => `rounded-xl px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-brand-50 text-brand-600' : 'text-ink dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                      My Bookings
                    </NavLink>
                    <NavLink to="/profile" onClick={close} className={({ isActive }) => `rounded-xl px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-brand-50 text-brand-600' : 'text-ink dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                      Profile
                    </NavLink>
                  </>
                )}
              </div>

              {/* Mobile auth footer */}
              <div className="border-t border-gray-100 dark:border-gray-800 p-4">
                {isAuthenticated ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
                        {user?.name?.[0]?.toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink dark:text-gray-100">{user?.name}</p>
                        <p className="truncate text-xs text-muted dark:text-gray-400">{user?.email}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" loading={isLoading} onClick={() => { logout(); close() }}>
                      Log out
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link to="/login" onClick={close} className="w-full">
                      <Button variant="outline" size="md" className="w-full">Log in</Button>
                    </Link>
                    <Link to="/register" onClick={close} className="w-full">
                      <Button size="md" className="w-full rounded-xl">Sign up</Button>
                    </Link>
                  </div>
                )}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
