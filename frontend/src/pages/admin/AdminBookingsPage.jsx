import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { fetchBookingsThunk } from '@/features/bookings/bookingsSlice'
import Spinner from '@/components/ui/Spinner'
import ErrorMessage from '@/components/ui/ErrorMessage'
import Button from '@/components/ui/Button'

const STATUS_TABS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending_payment' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'Refunded', value: 'refunded' },
]

const STATUS_STYLES = {
  pending_payment: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
  completed: 'bg-blue-100 text-blue-700',
  refunded: 'bg-purple-100 text-purple-700',
}

const STATUS_LABELS = {
  pending_payment: 'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed',
  refunded: 'Refunded',
}

export default function AdminBookingsPage() {
  const dispatch = useDispatch()
  const { items, meta, listStatus, listError } = useSelector((s) => s.bookings)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  function load(p = 1, status = statusFilter) {
    const params = { page: p, limit: 20 }
    if (status) params.status = status
    dispatch(fetchBookingsThunk(params))
  }

  useEffect(() => { setPage(1); load(1) }, [statusFilter])

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Bookings</h1>
        <p className="mt-1 text-sm text-muted">All customer bookings across all tours.</p>
      </div>

      {/* Status tabs */}
      <div className="mb-5 flex flex-wrap gap-1.5">
        {STATUS_TABS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === value
                ? 'bg-brand-500 text-white'
                : 'bg-gray-100 text-muted hover:bg-gray-200 hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
        {meta && <span className="ml-auto self-center text-xs text-muted">{meta.totalCount} total</span>}
      </div>

      {listError && <ErrorMessage message={listError} />}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {listStatus === 'loading' ? (
          <div className="py-16"><Spinner center /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="px-5 py-3">Tour</th>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Departure</th>
                  <th className="px-5 py-3">Travelers</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((b) => (
                  <tr key={b._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="px-5 py-3.5 max-w-[160px]">
                      <p className="truncate font-medium text-ink">{b.tour?.title ?? '—'}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-ink">{b.user?.name ?? '—'}</p>
                      <p className="text-xs text-muted">{b.user?.email}</p>
                    </td>
                    <td className="px-5 py-3.5 text-muted whitespace-nowrap">
                      {new Date(b.tourStartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5 text-muted">
                      {b.travelers?.adults}A{b.travelers?.children > 0 ? ` + ${b.travelers.children}C` : ''}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-ink">
                      ${Number(b.totalAmount).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[b.status]}`}>
                        {STATUS_LABELS[b.status] ?? b.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        to={`/invoice/${b._id}`}
                        className="text-xs font-medium text-brand-600 hover:underline"
                      >
                        Invoice
                      </Link>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && listStatus === 'succeeded' && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-sm text-muted">No bookings found</td>
                  </tr>
                )}
              </tbody>
            </table>
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
    </div>
  )
}
