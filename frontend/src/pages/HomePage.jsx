import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { fetchToursThunk, fetchCategoriesThunk } from '@/features/tours/toursSlice'
import TourCard from '@/components/tours/TourCard'
import TourCardSkeleton from '@/components/tours/TourCardSkeleton'

/* ── Animation helpers ───────────────────────────────────────────────────── */

const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  }),
}

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
}

/* ── Category chips ──────────────────────────────────────────────────────── */

const CATEGORY_ICONS = {
  Beach:      '🏖️',
  Mountains:  '🏔️',
  Cultural:   '🏛️',
  Adventure:  '🧗',
  Wildlife:   '🦁',
  City:       '🏙️',
  Desert:     '🏜️',
  Cruise:     '🚢',
}

function getIcon(name = '') {
  for (const [key, emoji] of Object.entries(CATEGORY_ICONS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return emoji
  }
  return '🗺️'
}

/* ── Stats ───────────────────────────────────────────────────────────────── */

const STATS = [
  { value: '500+', label: 'Curated tours' },
  { value: '80+',  label: 'Countries' },
  { value: '50k+', label: 'Happy travelers' },
  { value: '4.8',  label: 'Average rating' },
]

/* ── Trust features ──────────────────────────────────────────────────────── */

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-7 w-7 text-brand-500" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    title: 'Secure booking',
    desc:  'Your payment and personal data are always protected.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-7 w-7 text-brand-500" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    title: 'Instant confirmation',
    desc:  'Know right away — no waiting, no uncertainty.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-7 w-7 text-brand-500" aria-hidden="true">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    title: 'Local expertise',
    desc:  'Every tour is led by vetted, passionate local guides.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-7 w-7 text-brand-500" aria-hidden="true">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.55 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
    title: '24/7 support',
    desc:  'Real humans available around the clock to help you.',
  },
]

/* ── Search bar ──────────────────────────────────────────────────────────── */

function HeroSearch() {
  const navigate = useNavigate()

  function handleSubmit(e) {
    e.preventDefault()
    const q = new FormData(e.currentTarget).get('search')
    navigate(`/tours${q ? `?search=${encodeURIComponent(q)}` : ''}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className="flex w-full max-w-xl overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-xl ring-1 ring-black/5"
    >
      <div className="flex flex-1 items-center gap-3 px-4 py-3">
        <svg className="h-5 w-5 shrink-0 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          name="search"
          type="search"
          placeholder="Where do you want to go?"
          aria-label="Search tours"
          className="flex-1 bg-transparent text-sm text-ink dark:text-gray-100 placeholder:text-muted dark:placeholder:text-gray-500 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        className="m-1.5 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
      >
        Search
      </button>
    </form>
  )
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function HomePage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { items: tours, listStatus, categories } = useSelector((s) => s.tours)

  useEffect(() => {
    dispatch(fetchToursThunk({ sort: 'rating', limit: 8 }))
    dispatch(fetchCategoriesThunk())
  }, [dispatch])

  return (
    <div className="bg-white dark:bg-[#0a0a0a]">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        className="relative isolate overflow-hidden bg-gradient-to-br from-brand-600 via-brand-500 to-orange-400 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900"
        aria-labelledby="hero-heading"
      >
        {/* Abstract decorative blobs */}
        <div className="pointer-events-none absolute -top-1/3 -right-1/4 h-[600px] w-[600px] rounded-full bg-white/10 blur-3xl dark:bg-white/5" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-1/4 -left-1/4 h-[400px] w-[400px] rounded-full bg-brand-700/30 blur-3xl dark:bg-white/3" aria-hidden="true" />

        <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 sm:py-32 lg:py-40">
          <motion.p
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/90"
          >
            <span aria-hidden="true">✦</span>
            Over 500 handpicked adventures
          </motion.p>

          <motion.h1
            id="hero-heading"
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            Discover your next<br />
            <span className="text-amber-300">extraordinary</span> adventure
          </motion.h1>

          <motion.p
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mx-auto mt-5 max-w-xl text-base text-white/80"
          >
            Handpicked tours across 80+ countries — beaches, mountains, cities, wildlife and beyond.
          </motion.p>

          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mt-8 flex justify-center"
          >
            <HeroSearch />
          </motion.div>
        </div>
      </section>

      {/* ── Stats bar ────────────────────────────────────────────────────── */}
      <section aria-label="Platform statistics" className="border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="mx-auto grid max-w-4xl grid-cols-2 divide-x divide-y divide-gray-100 dark:divide-gray-800 sm:grid-cols-4 sm:divide-y-0"
        >
          {STATS.map(({ value, label }, i) => (
            <motion.div
              key={label}
              custom={i}
              variants={fadeUp}
              className="flex flex-col items-center justify-center gap-0.5 px-6 py-6"
            >
              <span className="text-2xl font-bold text-ink dark:text-gray-100 tabular-nums">{value}</span>
              <span className="text-xs text-muted dark:text-gray-400">{label}</span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Categories ───────────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section aria-labelledby="categories-heading" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
          >
            <h2 id="categories-heading" className="mb-2 text-2xl font-bold text-ink dark:text-gray-100">
              Explore by type
            </h2>
            <p className="mb-8 text-sm text-muted dark:text-gray-400">Find exactly the adventure you're looking for</p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
          >
            {categories.slice(0, 6).map((cat, i) => (
              <motion.div key={cat._id} custom={i} variants={fadeUp}>
                <Link
                  to={`/tours?category=${cat._id}`}
                  className="group flex flex-col items-center gap-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-5 text-center transition-all hover:border-brand-200 dark:hover:border-brand-700 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:shadow-sm"
                >
                  <span className="text-3xl" role="img" aria-label={cat.name}>{getIcon(cat.name)}</span>
                  <span className="text-xs font-semibold text-ink dark:text-gray-200 group-hover:text-brand-600 dark:group-hover:text-brand-400">
                    {cat.name}
                  </span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </section>
      )}

      {/* ── Featured tours ────────────────────────────────────────────────── */}
      <section
        aria-labelledby="featured-heading"
        className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8"
        style={{ paddingTop: categories.length === 0 ? '4rem' : 0 }}
      >
        <div className="mb-8 flex items-end justify-between">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
          >
            <h2 id="featured-heading" className="text-2xl font-bold text-ink dark:text-gray-100">
              Top-rated tours
            </h2>
            <p className="mt-1 text-sm text-muted dark:text-gray-400">Loved by thousands of travelers worldwide</p>
          </motion.div>
          <Link
            to="/tours"
            className="text-sm font-medium text-brand-500 hover:text-brand-600 transition-colors"
          >
            View all →
          </Link>
        </div>

        {listStatus === 'loading' && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <TourCardSkeleton key={i} />)}
          </div>
        )}

        {listStatus === 'succeeded' && tours.length > 0 && (
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
          >
            {tours.slice(0, 8).map((tour, i) => (
              <motion.div key={tour._id} custom={i} variants={fadeUp}>
                <TourCard tour={tour} />
              </motion.div>
            ))}
          </motion.div>
        )}

        <div className="mt-10 flex justify-center">
          <Link
            to="/tours"
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-8 py-3 text-sm font-semibold text-ink dark:text-gray-100 shadow-sm transition-all hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600"
          >
            Explore all tours
          </Link>
        </div>
      </section>

      {/* ── Why Wanderly ─────────────────────────────────────────────────── */}
      <section
        aria-labelledby="features-heading"
        className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900"
      >
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="mb-10 text-center"
          >
            <h2 id="features-heading" className="text-2xl font-bold text-ink dark:text-gray-100">
              Why travel with Wanderly
            </h2>
            <p className="mt-2 text-sm text-muted dark:text-gray-400">
              We've built every detail around making your trip unforgettable
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {FEATURES.map(({ icon, title, desc }, i) => (
              <motion.div
                key={title}
                custom={i}
                variants={fadeUp}
                className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xs border border-gray-100 dark:border-gray-700"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-900/30">
                  {icon}
                </div>
                <h3 className="mb-1.5 text-sm font-semibold text-ink dark:text-gray-100">{title}</h3>
                <p className="text-sm text-muted dark:text-gray-400 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Newsletter CTA ────────────────────────────────────────────────── */}
      <section
        aria-labelledby="cta-heading"
        className="relative overflow-hidden bg-brand-500 dark:bg-brand-700"
      >
        <div className="pointer-events-none absolute inset-0 opacity-10" aria-hidden="true">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white" />
          <div className="absolute -left-10 bottom-0 h-60 w-60 rounded-full bg-white" />
        </div>
        <div className="relative mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 id="cta-heading" className="text-2xl font-bold text-white sm:text-3xl">
              Ready for your next adventure?
            </h2>
            <p className="mt-3 text-base text-white/80">
              Join thousands of travelers discovering the world with Wanderly.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                to="/tours"
                className="w-full rounded-xl bg-white px-8 py-3 text-sm font-bold text-brand-600 shadow-md transition-all hover:shadow-lg hover:bg-gray-50 sm:w-auto"
              >
                Browse tours
              </Link>
              <Link
                to="/register"
                className="w-full rounded-xl border-2 border-white/50 px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10 sm:w-auto"
              >
                Create free account
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
