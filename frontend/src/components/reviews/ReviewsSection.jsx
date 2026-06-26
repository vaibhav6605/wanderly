/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import {
  fetchReviewsThunk,
  fetchMyStatusThunk,
  createReviewThunk,
  clearActionStatus,
  clearReviews,
  clearMyStatus,
} from '@/features/reviews/reviewsSlice'
import ReviewCard from './ReviewCard'
import { InteractiveStars, DisplayStars } from './StarRating'
import Spinner from '@/components/ui/Spinner'

function RatingBar({ label, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <span className="w-5 shrink-0 text-right text-xs text-muted">{label}</span>
      <svg className="h-3 w-3 shrink-0 text-amber-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-amber-400 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-7 shrink-0 text-xs text-muted">{count}</span>
    </div>
  )
}

function WriteReviewForm({ eligibleBookingId, tourId, onClose }) {
  const dispatch = useDispatch()
  const { actionStatus, actionError } = useSelector((s) => s.reviews)
  const [form, setForm] = useState({ rating: 0, title: '', comment: '' })

  async function handleSubmit(e) {
    e.preventDefault()
    const result = await dispatch(
      createReviewThunk({ tourId, bookingId: eligibleBookingId, ...form }),
    )
    if (!result.error) {
      onClose()
      dispatch(fetchReviewsThunk({ tourId }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-3">
      <p className="text-sm font-semibold text-ink">Write a review</p>
      <InteractiveStars value={form.rating} onChange={(v) => setForm((p) => ({ ...p, rating: v }))} size={22} />
      <input
        type="text"
        placeholder="Title (optional)"
        value={form.title}
        onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        maxLength={100}
      />
      <textarea
        rows={4}
        required
        placeholder="Share your experience (min. 10 characters)…"
        value={form.comment}
        onChange={(e) => setForm((p) => ({ ...p, comment: e.target.value }))}
        className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none"
        maxLength={1000}
        minLength={10}
      />
      {actionStatus === 'failed' && actionError && (
        <p className="text-xs text-red-500">{actionError}</p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={actionStatus === 'loading' || form.rating === 0 || form.comment.trim().length < 10}
          className="rounded-lg bg-brand-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {actionStatus === 'loading' ? 'Submitting…' : 'Submit review'}
        </button>
        <button
          type="button"
          onClick={() => { onClose(); dispatch(clearActionStatus()) }}
          className="rounded-lg px-4 py-2 text-sm text-muted hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function ReviewsSection({ tourId }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()

  const { items, ratingDistribution, meta, listStatus, myStatus, myStatusStatus } = useSelector(
    (s) => s.reviews,
  )
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    dispatch(fetchReviewsThunk({ tourId }))
    if (isAuthenticated) dispatch(fetchMyStatusThunk(tourId))
    return () => {
      dispatch(clearReviews())
      dispatch(clearMyStatus())
    }
  }, [dispatch, tourId, isAuthenticated])

  const totalReviews = meta?.totalCount ?? 0
  const avgRating = totalReviews > 0
    ? Object.entries(ratingDistribution).reduce((sum, [star, cnt]) => sum + Number(star) * cnt, 0) / totalReviews
    : 0

  const canShowForm = isAuthenticated && myStatus?.canReview && !myStatus?.myReview

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink">
          Reviews {totalReviews > 0 && <span className="text-base font-normal text-muted">({totalReviews})</span>}
        </h2>
        {isAuthenticated && canShowForm && !showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-lg border border-brand-500 px-4 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-50"
          >
            Write a review
          </button>
        )}
        {!isAuthenticated && (
          <button
            type="button"
            onClick={() => navigate('/login', { state: { from: { pathname: `/tours` } } })}
            className="rounded-lg border border-gray-200 px-4 py-1.5 text-sm text-muted hover:text-ink"
          >
            Sign in to review
          </button>
        )}
      </div>

      {/* Rating summary */}
      {totalReviews > 0 && (
        <div className="flex flex-col gap-4 rounded-xl border border-gray-100 bg-gray-50 p-5 sm:flex-row sm:items-center sm:gap-8">
          <div className="flex shrink-0 flex-col items-center gap-1">
            <span className="text-4xl font-bold text-ink">{avgRating.toFixed(1)}</span>
            <DisplayStars rating={avgRating} size={18} />
            <span className="text-xs text-muted">{totalReviews} review{totalReviews !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex-1 space-y-1.5 min-w-0">
            {[5, 4, 3, 2, 1].map((n) => (
              <RatingBar key={n} label={n} count={ratingDistribution[n] ?? 0} total={totalReviews} />
            ))}
          </div>
        </div>
      )}

      {/* Write review form */}
      {showForm && (
        <WriteReviewForm
          tourId={tourId}
          eligibleBookingId={myStatus?.eligibleBookingId}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Already reviewed notice */}
      {isAuthenticated && myStatusStatus === 'succeeded' && myStatus?.myReview && (
        <p className="text-xs text-muted">
          You reviewed this tour in {new Date(myStatus.myReview.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.
        </p>
      )}

      {/* Eligibility hint */}
      {isAuthenticated && myStatusStatus === 'succeeded' && !myStatus?.canReview && !myStatus?.myReview && (
        <p className="text-xs text-muted">
          You need a confirmed or completed booking to leave a review.
        </p>
      )}

      {/* Review list */}
      {listStatus === 'loading' && <Spinner center />}
      {listStatus === 'succeeded' && items.length === 0 && (
        <p className="py-6 text-center text-sm text-muted">No reviews yet. Be the first!</p>
      )}
      {listStatus === 'succeeded' && items.length > 0 && (
        <div className="space-y-4">
          {items.map((r) => (
            <ReviewCard key={r._id} review={r} currentUserId={user?.id} />
          ))}
          {meta && meta.page < meta.totalPages && (
            <button
              type="button"
              onClick={() => dispatch(fetchReviewsThunk({ tourId, page: meta.page + 1 }))}
              className="w-full rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-muted hover:bg-gray-50 hover:text-ink"
            >
              Load more reviews
            </button>
          )}
        </div>
      )}
    </section>
  )
}
