import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { fetchTourThunk, fetchRelatedThunk, clearDetail } from '@/features/tours/toursSlice'
import TourCard from '@/components/tours/TourCard'
import Spinner from '@/components/ui/Spinner'
import ErrorMessage from '@/components/ui/ErrorMessage'
import WishlistButton from '@/components/wishlist/WishlistButton'
import ReviewsSection from '@/components/reviews/ReviewsSection'

const currencySymbols = { USD: '$', INR: '₹', EUR: '€' }

const difficultyColors = {
  easy:        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  moderate:    'bg-amber-100   text-amber-700   dark:bg-amber-900/30   dark:text-amber-400',
  challenging: 'bg-orange-100  text-orange-700  dark:bg-orange-900/30  dark:text-orange-400',
  difficult:   'bg-red-100     text-red-700     dark:bg-red-900/30     dark:text-red-400',
}

export default function TourDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { tour, detailStatus, detailError, related, relatedStatus } = useSelector((s) => s.tours)
  const { isAuthenticated } = useAuth()
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    dispatch(fetchTourThunk(slug))
    return () => dispatch(clearDetail())
  }, [dispatch, slug])

  useEffect(() => {
    if (tour?._id) {
      dispatch(fetchRelatedThunk(tour._id))
      setActiveImage(0)
    }
  }, [dispatch, tour?._id])

  if (detailStatus === 'loading') return <Spinner center size="lg" />
  if (detailStatus === 'failed') return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <ErrorMessage message={detailError ?? 'Tour not found'} className="mb-4" />
      <Link to="/tours" className="text-sm font-medium text-brand-500 hover:text-brand-600">
        ← Back to tours
      </Link>
    </div>
  )
  if (!tour) return null

  const sym = currencySymbols[tour.currency] ?? '$'
  const displayPrice = tour.discountPrice ?? tour.price
  const hasDiscount = tour.discountPrice != null && tour.discountPrice < tour.price
  const images = tour.images ?? []
  const cover = images[activeImage]?.url ?? images[0]?.url

  return (
    <div className="bg-white dark:bg-[#0a0a0a] min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          to="/tours"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted dark:text-gray-400 hover:text-ink dark:hover:text-gray-100 transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          All tours
        </Link>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          {/* ── Left column ─────────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero image */}
            <div className="overflow-hidden rounded-2xl bg-gray-100 dark:bg-gray-800">
              {cover ? (
                <motion.img
                  key={activeImage}
                  initial={{ opacity: 0.7 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  src={cover}
                  alt={tour.title}
                  className="h-80 w-full object-cover sm:h-[420px]"
                />
              ) : (
                <div className="flex h-80 items-center justify-center text-sm text-muted dark:text-gray-500">
                  No photos
                </div>
              )}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto p-3">
                  {images.map((img, i) => (
                    <button
                      key={img.publicId}
                      type="button"
                      onClick={() => setActiveImage(i)}
                      className={`h-14 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-colors ${i === activeImage ? 'border-brand-500' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'}`}
                      aria-label={`View image ${i + 1}`}
                      aria-pressed={i === activeImage}
                    >
                      <img src={img.url} alt="" className="h-full w-full object-cover" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title + badges */}
            <div>
              {tour.category && (
                <span className="text-xs font-semibold uppercase tracking-widest text-brand-500">
                  {tour.category.name}
                </span>
              )}
              <div className="mt-1 flex items-start justify-between gap-4">
                <h1 className="text-2xl font-bold text-ink dark:text-gray-50 sm:text-3xl leading-tight">
                  {tour.title}
                </h1>
                <WishlistButton tourId={tour._id} size="lg" className="shrink-0" />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {(tour.ratingsCount ?? 0) > 0 && (
                  <span className="flex items-center gap-1 text-sm font-semibold text-amber-500">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    {(tour.avgRating ?? 0).toFixed(1)}
                    <span className="font-normal text-muted dark:text-gray-400">
                      ({tour.ratingsCount} review{tour.ratingsCount !== 1 ? 's' : ''})
                    </span>
                  </span>
                )}
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${difficultyColors[tour.difficulty] ?? 'bg-gray-100 text-gray-700'}`}
                >
                  {tour.difficulty}
                </span>
              </div>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-2 gap-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-5 sm:grid-cols-4">
              <Stat label="Duration" value={`${tour.duration?.days}D / ${tour.duration?.nights}N`} />
              <Stat label="Group size" value={`Max ${tour.maxGroupSize}`} />
              <Stat label="Destinations" value={tour.destinations?.length ?? 0} />
              <Stat label="Rating" value={(tour.ratingsCount ?? 0) > 0 ? `${(tour.avgRating ?? 0).toFixed(1)} / 5` : 'New'} />
            </div>

            {/* Destinations */}
            {tour.destinations?.length > 0 && (
              <Section title="Destinations">
                <div className="flex flex-wrap gap-2">
                  {tour.destinations.map((d) => (
                    <span key={d._id} className="rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs font-medium text-ink dark:text-gray-200">
                      {d.city ? `${d.city}, ${d.country}` : d.name}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* Overview */}
            <Section title="Overview">
              {tour.summary && <p className="font-medium text-ink dark:text-gray-200">{tour.summary}</p>}
              {tour.description && (
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  {tour.description}
                </p>
              )}
            </Section>

            {/* Itinerary */}
            {tour.itinerary?.length > 0 && (
              <Section title="Itinerary">
                <ol className="space-y-4">
                  {tour.itinerary.map((item) => (
                    <li key={item.day} className="flex gap-4">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white" aria-hidden="true">
                        {item.day}
                      </span>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className="font-semibold text-ink dark:text-gray-100">{item.title}</p>
                        {item.description && (
                          <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </Section>
            )}

            {/* Inclusions / Exclusions */}
            {(tour.inclusions?.length > 0 || tour.exclusions?.length > 0) && (
              <Section title="What's included">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {tour.inclusions?.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                        Included
                      </h4>
                      <ul className="space-y-2">
                        {tour.inclusions.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-ink dark:text-gray-200">
                            <span className="mt-0.5 text-emerald-500" aria-hidden="true">✓</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {tour.exclusions?.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
                        Not included
                      </h4>
                      <ul className="space-y-2">
                        {tour.exclusions.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-ink dark:text-gray-300">
                            <span className="mt-0.5 text-red-400" aria-hidden="true">✗</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* Reviews */}
            <ReviewsSection tourId={tour._id} />

            {/* Start dates */}
            {tour.startDates?.length > 0 && (
              <Section title="Available departures">
                <div className="space-y-2">
                  {tour.startDates.map((sd) => (
                    <div
                      key={sd._id}
                      className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${sd.isCancelled ? 'border-gray-100 dark:border-gray-800 opacity-60' : 'border-gray-100 dark:border-gray-800 dark:bg-gray-900/40'}`}
                    >
                      <span className="font-medium text-ink dark:text-gray-100">
                        {new Date(sd.date).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'long', day: 'numeric',
                        })}
                      </span>
                      <span className={sd.isCancelled ? 'text-red-500' : sd.availableSeats === 0 ? 'text-muted dark:text-gray-500' : 'text-emerald-600 dark:text-emerald-400 font-medium'}>
                        {sd.isCancelled ? 'Cancelled' : sd.availableSeats === 0 ? 'Full' : `${sd.availableSeats} seats left`}
                      </span>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>

          {/* ── Right column (booking card) ──────────────────────────────── */}
          <div>
            <div className="sticky top-20 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-lg dark:shadow-gray-900">
              <div className="mb-1 flex items-end gap-2">
                {hasDiscount && (
                  <span className="text-sm text-muted dark:text-gray-500 line-through">
                    {sym}{tour.price?.toLocaleString()}
                  </span>
                )}
                <span className="text-3xl font-bold text-ink dark:text-gray-50">
                  {sym}{displayPrice?.toLocaleString()}
                </span>
              </div>
              <p className="mb-5 text-xs text-muted dark:text-gray-400">per person</p>

              <button
                type="button"
                onClick={() =>
                  isAuthenticated
                    ? navigate(`/book/${tour._id}`)
                    : navigate('/login', { state: { from: { pathname: `/book/${tour._id}` } } })
                }
                className="w-full rounded-xl bg-brand-500 py-3.5 text-sm font-bold text-white transition-all hover:bg-brand-600 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              >
                {isAuthenticated ? 'Book now' : 'Sign in to book'}
              </button>

              <p className="mt-3 text-center text-xs text-muted dark:text-gray-500">
                No booking fee · Free cancellation
              </p>

              <hr className="my-5 border-gray-100 dark:border-gray-800" />

              <ul className="space-y-3 text-sm">
                <BookingDetail label="Duration" value={`${tour.duration?.days} days, ${tour.duration?.nights} nights`} />
                <BookingDetail label="Group size" value={`Up to ${tour.maxGroupSize} people`} />
                <BookingDetail label="Difficulty" value={<span className="capitalize">{tour.difficulty}</span>} />
                {tour.category && <BookingDetail label="Category" value={tour.category.name} />}
              </ul>
            </div>
          </div>
        </div>

        {/* ── Related tours ─────────────────────────────────────────────── */}
        {relatedStatus === 'succeeded' && related.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-6 text-xl font-bold text-ink dark:text-gray-100">
              Similar tours you might like
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((t) => <TourCard key={t._id} tour={t} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="text-center">
      <p className="text-xs text-muted dark:text-gray-500">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-ink dark:text-gray-100">{value}</p>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-bold text-ink dark:text-gray-100">{title}</h2>
      {children}
    </section>
  )
}

function BookingDetail({ label, value }) {
  return (
    <li className="flex items-center justify-between gap-4">
      <span className="text-muted dark:text-gray-400">{label}</span>
      <span className="font-medium text-ink dark:text-gray-100 text-right">{value}</span>
    </li>
  )
}
