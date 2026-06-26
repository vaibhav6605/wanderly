import { memo, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { fetchWishlistIdsThunk, toggleWishlistThunk } from '@/features/wishlist/wishlistSlice'

const SIZE = {
  sm: { btn: 'h-7 w-7',  icon: 14 },
  md: { btn: 'h-8 w-8',  icon: 18 },
  lg: { btn: 'h-10 w-10', icon: 22 },
}

function WishlistButton({ tourId, size = 'md', className = '' }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const { ids, idsStatus, toggleStatus } = useSelector((s) => s.wishlist)
  const isWishlisted = ids.includes(tourId)

  // Fetch IDs once per session (API cache handles staleness)
  useEffect(() => {
    if (isAuthenticated && idsStatus === 'idle') {
      dispatch(fetchWishlistIdsThunk())
    }
  }, [isAuthenticated, idsStatus, dispatch])

  function handleClick(e) {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    if (toggleStatus !== 'loading') dispatch(toggleWishlistThunk(tourId))
  }

  const { btn, icon } = SIZE[size] ?? SIZE.md

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      aria-pressed={isWishlisted}
      className={`inline-flex items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
        isWishlisted
          ? 'bg-red-500 text-white hover:bg-red-600'
          : 'bg-white/90 text-gray-400 hover:text-red-500 hover:bg-white shadow-sm'
      } ${btn} ${className}`}
    >
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 24 24"
        fill={isWishlisted ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={isWishlisted ? 0 : 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  )
}

export default memo(WishlistButton)
