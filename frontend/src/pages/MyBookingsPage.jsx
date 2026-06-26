import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  fetchBookingsThunk,
  cancelBookingThunk,
  clearCancel,
} from '@/features/bookings/bookingsSlice'
import Spinner from '@/components/ui/Spinner'
import ErrorMessage from '@/components/ui/ErrorMessage'
import Button from '@/components/ui/Button'
import { TAX_LABEL } from '@/lib/constants'

const currencySymbols = { USD: '$', INR: '₹', EUR: '€' }

function fmt(sym, n) {
  return `${sym}${Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const statusStyles = {
  pending_payment: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  confirmed:       'bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400',
  cancelled:       'bg-gray-100   text-gray-500   dark:bg-gray-800      dark:text-gray-400',
  completed:       'bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400',
  refunded:        'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

const statusLabels = {
  pending_payment: 'Pending payment',
  confirmed:  'Confirmed',
  cancelled:  'Cancelled',
  completed:  'Completed',
  refunded:   'Refunded',
}

export default function MyBookingsPage() {
  const dispatch = useDispatch()
  const location = useLocation()
  const { items, meta, listStatus, listError, cancelStatus, cancelError } = useSelector(
    (s) => s.bookings,
  )
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState(location.state?.newBookingId ?? null)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelReason, setCancelReason] = useState('')

  useEffect(() => {
    dispatch(fetchBookingsThunk({ page, limit: 10 }))
    return () => { dispatch(clearCancel()) }
  }, [dispatch, page])

  useEffect(() => {
    if (cancelStatus === 'succeeded') {
      setCancelTarget(null)
      setCancelReason('')
    }
  }, [cancelStatus])

  function handleCancel() {
    if (!cancelTarget) return
    dispatch(cancelBookingThunk({ id: cancelTarget, reason: cancelReason || undefined }))
  }

  if (listStatus === 'loading' && items.length === 0) return <Spinner center size="lg" />

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-ink dark:text-gray-100">My Bookings</h1>

      {listError && <ErrorMessage message={listError} />}

      {listStatus === 'succeeded' && items.length === 0 && (
        <div className="py-20 text-center">
          <p className="mb-4 text-sm text-muted dark:text-gray-400">You haven't made any bookings yet.</p>
          <Link to="/tours">
            <Button>Browse tours</Button>
          </Link>
        </div>
      )}

      {cancelError && <ErrorMessage message={cancelError} />}

      <div className="space-y-4">
        {items.map((booking) => {
          const sym = currencySymbols[booking.tour?.currency ?? 'USD'] ?? '$'
          const isExpanded = expandedId === booking._id
          const cancellable = ['pending_payment', 'confirmed'].includes(booking.status)
          const cover = booking.tour?.images?.[0]?.url

          return (
            <motion.div
              key={booking._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm"
            >
              {/* Header */}
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : booking._id)}
                className="flex w-full items-start gap-4 p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
              >
                {cover ? (
                  <img
                    src={cover}
                    alt=""
                    className="h-16 w-24 shrink-0 rounded-lg object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-16 w-24 shrink-0 rounded-lg bg-gray-200 dark:bg-gray-700" />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-semibold text-ink dark:text-gray-100">
                      {booking.tour?.title ?? 'Tour'}
                    </p>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[booking.status]}`}>
                      {statusLabels[booking.status] ?? booking.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted dark:text-gray-400">
                    {new Date(booking.tourStartDate).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric',
                    })}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted dark:text-gray-500">
                    <span>{booking.travelers.adults} adult{booking.travelers.adults !== 1 ? 's' : ''}{booking.travelers.children > 0 ? `, ${booking.travelers.children} child${booking.travelers.children !== 1 ? 'ren' : ''}` : ''}</span>
                    <span>Total: <strong className="text-ink dark:text-gray-200">{fmt(sym, booking.totalAmount)}</strong></span>
                  </div>
                </div>

                <svg
                  className={`mt-1 h-4 w-4 shrink-0 text-muted dark:text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-gray-100 dark:border-gray-800 px-4 pb-4 pt-4">
                  {/* Price breakdown */}
                  <div className="mb-4 rounded-lg bg-gray-50 dark:bg-gray-800/60 p-4">
                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted dark:text-gray-400">
                      Price breakdown
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex justify-between text-ink dark:text-gray-200">
                        <span className="text-muted dark:text-gray-400">Base amount</span>
                        <span>{fmt(sym, booking.baseAmount)}</span>
                      </li>
                      {booking.discountAmount > 0 && (
                        <li className="flex justify-between text-green-700 dark:text-green-400">
                          <span>
                            Coupon {booking.coupon?.code ? `(${booking.coupon.code})` : 'discount'}
                          </span>
                          <span>− {fmt(sym, booking.discountAmount)}</span>
                        </li>
                      )}
                      <li className="flex justify-between text-muted dark:text-gray-400">
                        <span>{TAX_LABEL}</span>
                        <span>{fmt(sym, booking.taxAmount)}</span>
                      </li>
                      <li className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2 font-semibold text-ink dark:text-gray-100">
                        <span>Total paid</span>
                        <span>{fmt(sym, booking.totalAmount)}</span>
                      </li>
                    </ul>
                  </div>

                  {/* Traveler details */}
                  {booking.travelerDetails?.length > 0 && (
                    <div className="mb-4">
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted dark:text-gray-400">Travelers</h4>
                      <div className="space-y-2">
                        {booking.travelerDetails.map((t, i) => (
                          <div key={i} className="flex items-center gap-3 text-sm text-ink dark:text-gray-200">
                            <span className="text-muted dark:text-gray-500">{i + 1}.</span>
                            <span>{t.name}</span>
                            <span className="text-muted dark:text-gray-500">Age {t.age}</span>
                            {t.passportNumber && (
                              <span className="text-muted dark:text-gray-500">· {t.passportNumber}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cancellation info */}
                  {booking.status === 'cancelled' && booking.cancellationReason && (
                    <div className="mb-4 rounded-lg bg-gray-50 dark:bg-gray-800/60 p-3 text-sm">
                      <span className="font-medium text-ink dark:text-gray-200">Cancellation reason: </span>
                      <span className="text-muted dark:text-gray-400">{booking.cancellationReason}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-3">
                    {booking.tour?.slug && (
                      <Link
                        to={`/tours/${booking.tour.slug}`}
                        className="text-sm font-medium text-brand-600 hover:underline"
                      >
                        View tour
                      </Link>
                    )}
                    {booking.status === 'pending_payment' && (
                      <Link
                        to={`/checkout/${booking._id}`}
                        className="text-sm font-medium text-brand-600 hover:underline"
                      >
                        Pay now
                      </Link>
                    )}
                    {['confirmed', 'completed', 'refunded'].includes(booking.status) && (
                      <Link
                        to={`/invoice/${booking._id}`}
                        className="text-sm font-medium text-muted dark:text-gray-400 hover:text-ink dark:hover:text-gray-100"
                      >
                        View invoice
                      </Link>
                    )}
                    {cancellable && cancelTarget !== booking._id && (
                      <button
                        type="button"
                        onClick={() => setCancelTarget(booking._id)}
                        className="text-sm font-medium text-red-500 hover:underline"
                      >
                        Cancel booking
                      </button>
                    )}
                  </div>

                  {/* Cancel confirmation */}
                  {cancelTarget === booking._id && (
                    <div className="mt-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
                      <p className="mb-3 text-sm font-medium text-red-700 dark:text-red-400">
                        Are you sure you want to cancel this booking?
                      </p>
                      <textarea
                        rows={2}
                        placeholder="Reason for cancellation (optional)"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="mb-3 w-full rounded-lg border border-red-200 dark:border-red-800 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-ink dark:text-gray-100 outline-none focus:border-red-400"
                      />
                      <div className="flex gap-3">
                        <Button
                          variant="danger"
                          size="sm"
                          loading={cancelStatus === 'loading'}
                          onClick={handleCancel}
                        >
                          Yes, cancel
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setCancelTarget(null); setCancelReason('') }}
                        >
                          Keep booking
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <BookingsPagination meta={meta} page={page} onPage={setPage} />
      )}
    </div>
  )
}

function BookingsPagination({ meta, page, onPage }) {
  const { totalPages } = meta
  const pages = []
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, page + 2)
  for (let i = start; i <= end; i++) pages.push(i)

  return (
    <nav aria-label="Bookings pagination" className="mt-8 flex items-center justify-center gap-1.5">
      <PageBtn disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </PageBtn>

      {start > 1 && (
        <>
          <PageBtn onClick={() => onPage(1)}>1</PageBtn>
          {start > 2 && <span className="px-1 text-sm text-muted dark:text-gray-500" aria-hidden="true">…</span>}
        </>
      )}

      {pages.map((p) => (
        <PageBtn key={p} active={p === page} onClick={() => onPage(p)} aria-label={`Page ${p}`} aria-current={p === page ? 'page' : undefined}>
          {p}
        </PageBtn>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-sm text-muted dark:text-gray-500" aria-hidden="true">…</span>}
          <PageBtn onClick={() => onPage(totalPages)}>{totalPages}</PageBtn>
        </>
      )}

      <PageBtn disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label="Next page">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </PageBtn>
    </nav>
  )
}

function PageBtn({ children, onClick, active, disabled, ...aria }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: disabled ? 1 : 0.93 }}
      className={[
        'flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border px-2 text-sm font-medium transition-colors',
        active
          ? 'border-brand-500 bg-brand-500 text-white shadow-sm'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-ink dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800',
        disabled ? 'cursor-not-allowed opacity-40' : '',
      ].join(' ')}
      {...aria}
    >
      {children}
    </motion.button>
  )
}
