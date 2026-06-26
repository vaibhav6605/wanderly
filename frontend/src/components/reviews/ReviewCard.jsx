import { memo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { DisplayStars, InteractiveStars } from './StarRating'
import { updateReviewThunk, deleteReviewThunk, clearActionStatus } from '@/features/reviews/reviewsSlice'

function Avatar({ name }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-600">
      {name?.[0]?.toUpperCase() ?? '?'}
    </span>
  )
}

function ReviewCard({ review, currentUserId }) {
  const dispatch = useDispatch()
  const actionStatus = useSelector((s) => s.reviews.actionStatus)
  const actionError = useSelector((s) => s.reviews.actionError)

  const isOwn = currentUserId && review.user?._id === currentUserId
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [form, setForm] = useState({ rating: review.rating, title: review.title ?? '', comment: review.comment })

  function handleEdit() {
    setForm({ rating: review.rating, title: review.title ?? '', comment: review.comment })
    setEditing(true)
    dispatch(clearActionStatus())
  }

  async function handleSave() {
    const result = await dispatch(updateReviewThunk({ id: review._id, ...form }))
    if (!result.error) setEditing(false)
  }

  async function handleDelete() {
    await dispatch(deleteReviewThunk(review._id))
    setConfirmDelete(false)
  }

  const date = new Date(review.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })

  if (editing) {
    return (
      <div className="rounded-xl border border-brand-200 bg-brand-50/40 dark:bg-brand-900/10 dark:border-brand-800 p-5">
        <p className="mb-3 text-sm font-semibold text-ink dark:text-gray-100">Edit your review</p>
        <InteractiveStars value={form.rating} onChange={(v) => setForm((p) => ({ ...p, rating: v }))} size={22} />
        <input
          type="text"
          placeholder="Title (optional)"
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          className="mt-3 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-ink dark:text-gray-100 focus:border-brand-500 focus:outline-none"
          maxLength={100}
        />
        <textarea
          rows={4}
          placeholder="Your review…"
          value={form.comment}
          onChange={(e) => setForm((p) => ({ ...p, comment: e.target.value }))}
          className="mt-2 w-full resize-none rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-ink dark:text-gray-100 focus:border-brand-500 focus:outline-none"
          maxLength={1000}
        />
        {actionStatus === 'failed' && actionError && (
          <p className="mt-2 text-xs text-red-500">{actionError}</p>
        )}
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={actionStatus === 'loading' || form.comment.trim().length < 10 || form.rating === 0}
            className="rounded-lg bg-brand-500 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {actionStatus === 'loading' ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => { setEditing(false); dispatch(clearActionStatus()) }}
            className="rounded-lg px-4 py-1.5 text-sm font-medium text-muted hover:text-ink dark:text-gray-400 dark:hover:text-gray-100"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={review.user?.name} />
          <div>
            <p className="text-sm font-semibold text-ink dark:text-gray-100">{review.user?.name ?? 'Anonymous'}</p>
            <div className="flex items-center gap-2">
              <DisplayStars rating={review.rating} size={14} />
              {review.booking && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-green-600 dark:text-green-400">
                  <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Verified Booking
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs text-muted dark:text-gray-500">{date}</span>
          {isOwn && (
            <>
              <button
                type="button"
                onClick={handleEdit}
                className="rounded px-2 py-0.5 text-xs font-medium text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20"
              >
                Edit
              </button>
              {confirmDelete ? (
                <span className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={actionStatus === 'loading'}
                    className="rounded px-2 py-0.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="rounded px-2 py-0.5 text-xs text-muted dark:text-gray-500 hover:text-ink dark:hover:text-gray-100"
                  >
                    Cancel
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="rounded px-2 py-0.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Delete
                </button>
              )}
            </>
          )}
        </div>
      </div>
      {review.title && (
        <p className="text-sm font-semibold text-ink dark:text-gray-100">{review.title}</p>
      )}
      <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">{review.comment}</p>
    </div>
  )
}

export default memo(ReviewCard)
