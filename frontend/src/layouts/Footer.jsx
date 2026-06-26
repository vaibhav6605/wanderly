import { Link } from 'react-router-dom'

const SECTIONS = [
  {
    heading: 'Company',
    links: [
      { to: '/about', label: 'About us' },
      { to: '/careers', label: 'Careers' },
      { to: '/press', label: 'Press' },
      { to: '/contact', label: 'Contact' },
    ],
  },
  {
    heading: 'Support',
    links: [
      { to: '/help', label: 'Help centre' },
      { to: '/cancellations', label: 'Cancellation options' },
      { to: '/safety', label: 'Safety information' },
      { to: '/accessibility', label: 'Accessibility' },
    ],
  },
  {
    heading: 'Explore',
    links: [
      { to: '/tours', label: 'All tours' },
      { to: '/tours?difficulty=easy', label: 'Easy tours' },
      { to: '/tours?sort=rating', label: 'Top rated' },
      { to: '/tours?sort=newest', label: 'New tours' },
    ],
  },
]

const SOCIALS = [
  {
    label: 'Twitter / X',
    href: 'https://twitter.com',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://instagram.com',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-4 w-4">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4.5" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: 'YouTube',
    href: 'https://youtube.com',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
]

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main grid */}
        <div className="grid grid-cols-2 gap-8 py-12 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="text-xl font-bold text-brand-500">
              Wanderly
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted dark:text-gray-400">
              Handpicked tours around the world. Adventure awaits at every corner.
            </p>
            <div className="mt-4 flex gap-3">
              {SOCIALS.map(({ label, href, icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 dark:border-gray-700 text-muted dark:text-gray-400 transition-colors hover:border-brand-500 hover:text-brand-500"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link sections */}
          {SECTIONS.map(({ heading, links }) => (
            <div key={heading}>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-ink dark:text-gray-200">
                {heading}
              </h3>
              <ul className="space-y-2.5">
                {links.map(({ to, label }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="text-sm text-muted dark:text-gray-400 transition-colors hover:text-ink dark:hover:text-gray-100"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 dark:border-gray-800 py-5 text-xs text-muted dark:text-gray-500 sm:flex-row">
          <span>&copy; {new Date().getFullYear()} Wanderly. All rights reserved.</span>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-ink dark:hover:text-gray-300 transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-ink dark:hover:text-gray-300 transition-colors">Terms</Link>
            <Link to="/sitemap" className="hover:text-ink dark:hover:text-gray-300 transition-colors">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
