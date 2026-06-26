import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchReviewsThunk,
  approveReviewThunk,
  deleteReviewThunk,
} from '@/features/reviews/reviewsSlice'
import Spinner from '@/components/ui/Spinner'
import ErrorMessage from '@/components/ui/ErrorMessage'
import Button from '@/components/ui/Button'

const TABS = [
  { label: 'All', value: undefined },
  { label: 'Approved', value: true },
  { label: 'Pending', value: false },
]

function Stars({ rating }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className={`h-3.5 w-3.5 ${s <= rating ? 'text-yellow-400' : 'text-gray-200'}`} viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  )
}

export default function AdminReviewsPage() {
  const dispatch = useDispatch()
  const { items, meta, listStatus, listError, actionError } = useSelector((s) => s.reviews)
  const [approvedFilter, setApprovedFilter] = useState(undefined)
  const [page, setPage] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState(null)

  function load(p = 1, filter = approvedFilter) {
    const params = { page: p, limit: 15 }
    if (filter !== undefined) params.isApproved = filter
    dispatch(fetchReviewsThunk(params))
  }

  useEffect(() => { setPage(1); load(1) }, [approvedFilter])

  function handleApprove(id, current) {
    dispatch(approveReviewThunk({ id, isApproved: !current }))
  }

  function handleDelete() {
    if (!deleteTarget) return
    dispatch(deleteReviewThunk(deleteTarget))
    setDeleteTarget(null)
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Reviews</h1>
        <p className="mt-1 text-sm text-muted">Moderate customer tour reviews.</p>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1.5">
        {TABS.map(({ label, value }) => (
          <button
            key={label}
            onClick={() => setApprovedFilter(value)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              approvedFilter === value
                ? 'bg-brand-500 text-white'
                : 'bg-gray-100 text-muted hover:bg-gray-200 hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
        {meta && <span className="ml-auto self-center text-xs text-muted">{meta.totalCount} reviews</span>}
      </div>

      {listError && <ErrorMessage message={listError} />}
      {actionError && <ErrorMessage message={actionError} />}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {listStatus === 'loading' ? (
          <div className="py-16"><Spinner center /></div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((r) => (
              <div key={r._id} className="flex items-start gap-4 p-5 hover:bg-gray-50">
                {/* Avatar */}
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                  {r.user?.name?.[0]?.toUpperCase() ?? '?'}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-ink">{r.user?.name}</p>
                      <p className="text-xs text-muted">on <span className="font-medium">{r.tour?.title}</span></p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Stars rating={r.rating} />
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${r.isApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {r.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </div>
                  </div>

                  {r.title && <p className="mt-1.5 text-sm font-medium text-ink">{r.title}</p>}
                  <p className="mt-1 text-sm text-muted line-clamp-2">{r.comment}</p>
                  <p className="mt-1.5 text-xs text-muted">
                    {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>

                <div className="flex shrink-0 flex-col gap-2 text-right">
                  <button
                    onClick={() => handleApprove(r._id, r.isApproved)}
                    className={`text-xs font-medium hover:underline ${r.isApproved ? 'text-orange-500' : 'text-green-600'}`}
                  >
                    {r.isApproved ? 'Reject' : 'Approve'}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(r._id)}
                    className="text-xs font-medium text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {items.length === 0 && listStatus === 'succeeded' && (
              <p className="py-16 text-center text-sm text-muted">No reviews found</p>
            )}
          </div>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
            <span className="text-xs text-muted">Page {page} of {meta.totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => { setPage(page - 1); load(page - 1) }}>Prev</Button>
              <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => { setPage(page + 1); load(page + 1) }}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-3 text-lg font-semibold text-ink">Delete review?</h2>
            <p className="mb-5 text-sm text-muted">This action cannot be undone.</p>
            <div className="flex gap-3">
              <Button variant="danger" onClick={handleDelete}>Delete</Button>
              <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
