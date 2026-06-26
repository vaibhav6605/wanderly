import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import {
  fetchAdminToursThunk,
  deleteTourThunk,
  updateTourThunk,
  clearMutate,
} from '@/features/tours/toursSlice'
import Spinner from '@/components/ui/Spinner'
import ErrorMessage from '@/components/ui/ErrorMessage'
import Button from '@/components/ui/Button'

const currencySymbols = { USD: '$', INR: '₹', EUR: '€' }

export default function AdminToursPage() {
  const dispatch = useDispatch()
  const { adminItems, adminListStatus, mutateStatus, mutateError } = useSelector((s) => s.tours)
  const [confirmDelete, setConfirmDelete] = useState(null) // tour _id

  useEffect(() => {
    dispatch(fetchAdminToursThunk())
  }, [dispatch])

  useEffect(() => {
    if (mutateStatus === 'succeeded') dispatch(clearMutate())
  }, [dispatch, mutateStatus])

  async function handleDelete(id) {
    await dispatch(deleteTourThunk(id))
    setConfirmDelete(null)
  }

  async function handleToggleActive(tour) {
    dispatch(updateTourThunk({ id: tour._id, data: { isActive: !tour.isActive } }))
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">Manage Tours</h1>
        <Link to="/admin/tours/new">
          <Button size="sm">+ New tour</Button>
        </Link>
      </div>

      {mutateError && <ErrorMessage message={mutateError} />}

      {adminListStatus === 'loading' && <Spinner center size="lg" />}

      {adminListStatus === 'succeeded' && adminItems.length === 0 && (
        <p className="py-20 text-center text-sm text-muted">No tours yet. Create your first tour.</p>
      )}

      {adminListStatus === 'succeeded' && adminItems.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-xs font-medium uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 text-left">Tour</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Price</th>
                <th className="px-4 py-3 text-left">Rating</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {adminItems.map((tour) => {
                const sym = currencySymbols[tour.currency] ?? '$'
                const isDeleting = mutateStatus === 'loading' && confirmDelete === tour._id

                return (
                  <tr key={tour._id} className="hover:bg-gray-50">
                    {/* Tour */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {tour.images?.[0]?.url ? (
                          <img
                            src={tour.images[0].url}
                            alt=""
                            className="h-10 w-14 rounded-lg object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-10 w-14 rounded-lg bg-gray-200" />
                        )}
                        <div className="min-w-0">
                          <p className="max-w-[200px] truncate font-medium text-ink">{tour.title}</p>
                          <p className="text-xs text-muted">
                            {tour.duration?.days}D / {tour.duration?.nights}N · {tour.difficulty}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 text-muted">
                      {tour.category?.name ?? '—'}
                    </td>

                    {/* Price */}
                    <td className="px-4 py-3 font-medium text-ink">
                      {sym}{(tour.discountPrice ?? tour.price)?.toLocaleString()}
                      {tour.discountPrice != null && (
                        <span className="ml-1 text-xs text-muted line-through">
                          {sym}{tour.price?.toLocaleString()}
                        </span>
                      )}
                    </td>

                    {/* Rating */}
                    <td className="px-4 py-3 text-muted">
                      <span className="text-amber-500">★</span> {(tour.avgRating ?? 0).toFixed(1)}
                      <span className="ml-1 text-xs">({tour.ratingsCount ?? 0})</span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          tour.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {tour.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/tours/${tour.slug}`}
                          target="_blank"
                          className="text-xs text-muted hover:text-ink"
                          title="View public page"
                        >
                          View
                        </Link>
                        <Link
                          to={`/admin/tours/${tour._id}/edit`}
                          className="text-xs font-medium text-brand-600 hover:underline"
                        >
                          Edit
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          loading={mutateStatus === 'loading' && !confirmDelete}
                          onClick={() => handleToggleActive(tour)}
                          className="text-xs"
                        >
                          {tour.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        {confirmDelete === tour._id ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleDelete(tour._id)}
                              disabled={isDeleting}
                              className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                            >
                              {isDeleting ? 'Deleting…' : 'Confirm'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDelete(null)}
                              className="text-xs text-muted hover:text-ink"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(tour._id)}
                            className="text-xs font-medium text-red-500 hover:underline"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
