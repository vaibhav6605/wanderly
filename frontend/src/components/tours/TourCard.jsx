import { memo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import WishlistButton from '@/components/wishlist/WishlistButton'
import OptimizedImage from '@/components/ui/OptimizedImage'

const difficultyStyles = {
  easy:        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  moderate:    'bg-amber-100   text-amber-700   dark:bg-amber-900/30   dark:text-amber-400',
  challenging: 'bg-orange-100  text-orange-700  dark:bg-orange-900/30  dark:text-orange-400',
  difficult:   'bg-red-100     text-red-700     dark:bg-red-900/30     dark:text-red-400',
}

const currencySymbols = { USD: '$', INR: '₹', EUR: '€' }

// Prefetch the detail page chunk on hover — zero cost if already cached
function prefetchDetail() {
  import('@/pages/TourDetailPage')
}

function TourCard({ tour }) {
  const {
    _id,
    title,
    slug,
    images,
    category,
    destinations,
    duration,
    price,
    discountPrice,
    currency = 'USD',
    difficulty,
    avgRating,
    ratingsCount,
    isActive,
  } = tour

  const cover = images?.[0]?.url
  const sym = currencySymbols[currency] ?? '$'
  const displayPrice = discountPrice ?? price
  const hasDiscount = discountPrice != null && discountPrice < price

  // useCallback prevents WishlistButton from seeing a new fn reference on each render
  const handleWishlistClick = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const locationText = destinations
    ?.map((d) => (d.city ? `${d.city}, ${d.country}` : d.name))
    .join(' · ')

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="group"
    >
      <Link
        to={`/tours/${slug}`}
        onMouseEnter={prefetchDetail}
        className="flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg dark:hover:shadow-gray-900/40 transition-shadow duration-200"
        aria-label={title}
      >
        {/* Image */}
        <div className="relative aspect-[3/2] overflow-hidden bg-gray-100 dark:bg-gray-800">
          <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
            <OptimizedImage src={cover} alt={title} />
          </div>

          {/* Gradient overlay */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none"
            aria-hidden="true"
          />

          {/* Difficulty badge */}
          <span
            className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize z-10 ${difficultyStyles[difficulty] ?? 'bg-gray-100 text-gray-700'}`}
          >
            {difficulty}
          </span>

          {/* Wishlist */}
          <div className="absolute right-3 top-3 z-10" onClick={handleWishlistClick}>
            <WishlistButton tourId={_id} size="sm" />
          </div>

          {/* Inactive */}
          {isActive === false && (
            <span className="absolute bottom-3 right-3 z-10 rounded-full bg-gray-900/70 px-2.5 py-0.5 text-xs text-white">
              Inactive
            </span>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-1.5 p-4">
          {category && (
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">
              {category.name}
            </p>
          )}

          <h3 className="line-clamp-2 text-sm font-semibold text-ink dark:text-gray-100 leading-snug">
            {title}
          </h3>

          {locationText && (
            <p className="line-clamp-1 flex items-center gap-1 text-xs text-muted dark:text-gray-400">
              <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {locationText}
            </p>
          )}

          <p className="text-xs text-muted dark:text-gray-500">
            {duration?.days}D / {duration?.nights}N
          </p>

          <div className="mt-auto flex items-end justify-between pt-2">
            {/* Rating */}
            <div className="flex items-center gap-1">
              {(ratingsCount ?? 0) > 0 ? (
                <>
                  <svg className="h-3.5 w-3.5 text-amber-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span className="text-xs font-semibold text-amber-500">{(avgRating ?? 0).toFixed(1)}</span>
                  <span className="text-xs text-muted dark:text-gray-500">({ratingsCount})</span>
                </>
              ) : (
                <span className="text-xs text-muted dark:text-gray-500">New</span>
              )}
            </div>

            {/* Price */}
            <div className="text-right">
              {hasDiscount && (
                <p className="text-xs text-muted dark:text-gray-500 line-through">
                  {sym}{price?.toLocaleString()}
                </p>
              )}
              <p className="text-sm font-bold text-ink dark:text-gray-100">
                <span className="text-xs font-normal text-muted dark:text-gray-400">from </span>
                {sym}{displayPrice?.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export default memo(TourCard)
