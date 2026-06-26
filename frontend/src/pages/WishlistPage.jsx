import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { fetchWishlistThunk } from '@/features/wishlist/wishlistSlice'
import TourCard from '@/components/tours/TourCard'
import Spinner from '@/components/ui/Spinner'
import ErrorMessage from '@/components/ui/ErrorMessage'

export default function WishlistPage() {
  const dispatch = useDispatch()
  const { items, itemsMeta, itemsStatus, error } = useSelector((s) => s.wishlist)

  useEffect(() => {
    dispatch(fetchWishlistThunk())
  }, [dispatch])

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-ink">My Wishlist</h1>
        {itemsMeta && (
          <p className="mt-1 text-sm text-muted">
            {itemsMeta.totalCount} saved tour{itemsMeta.totalCount !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {itemsStatus === 'loading' && <Spinner center size="lg" />}
      {itemsStatus === 'failed' && <ErrorMessage message={error ?? 'Failed to load wishlist'} />}

      {itemsStatus === 'succeeded' && items.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <svg
            className="h-16 w-16 text-gray-200"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1}
            aria-hidden="true"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <p className="text-lg font-semibold text-ink">Your wishlist is empty</p>
          <p className="text-sm text-muted">Save tours you love by tapping the heart icon.</p>
          <Link
            to="/tours"
            className="mt-2 rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Explore tours
          </Link>
        </div>
      )}

      {itemsStatus === 'succeeded' && items.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {items.map((tour) => (
              <TourCard key={tour._id} tour={tour} />
            ))}
          </div>

          {itemsMeta && itemsMeta.page < itemsMeta.totalPages && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => dispatch(fetchWishlistThunk({ page: itemsMeta.page + 1 }))}
                className="rounded-xl border border-gray-200 px-6 py-2.5 text-sm font-medium text-muted hover:bg-gray-50 hover:text-ink"
              >
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
