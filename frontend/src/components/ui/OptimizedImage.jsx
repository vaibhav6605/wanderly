import { memo, useState } from 'react'

const PlaceholderIcon = () => (
  <svg
    className="h-10 w-10 text-gray-300 dark:text-gray-600"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1}
    aria-hidden="true"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
)

/**
 * Drop-in <img> replacement with:
 * – skeleton shimmer while the image loads
 * – smooth opacity fade-in on load
 * – error fallback placeholder
 * – lazy loading by default; set priority for above-the-fold images
 */
function OptimizedImage({ src, alt = '', className = '', priority = false, onLoad }) {
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)

  const missing = !src || errored

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Shimmer skeleton (hidden once the image is ready or errored) */}
      {!loaded && !missing && (
        <div className="absolute inset-0 skeleton-shimmer" aria-hidden="true" />
      )}

      {/* Error / missing placeholder */}
      {missing && (
        <div
          className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-800"
          aria-label={alt || 'Image unavailable'}
        >
          <PlaceholderIcon />
        </div>
      )}

      {/* Actual image — stays in DOM so the browser doesn't re-request */}
      {!missing && (
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          // fetchpriority is a valid HTML attribute; React passes it through
          fetchpriority={priority ? 'high' : 'low'}
          onLoad={() => { setLoaded(true); onLoad?.() }}
          onError={() => setErrored(true)}
          className={[
            'h-full w-full object-cover transition-opacity duration-300',
            loaded ? 'opacity-100' : 'opacity-0',
            className,
          ].join(' ')}
        />
      )}
    </div>
  )
}

export default memo(OptimizedImage)
