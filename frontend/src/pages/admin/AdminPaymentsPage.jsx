/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchPaymentsThunk, createRefundThunk, clearRefund } from '@/features/payments/paymentsSlice'
import Spinner from '@/components/ui/Spinner'
import ErrorMessage from '@/components/ui/ErrorMessage'
import Button from '@/components/ui/Button'

const STATUS_STYLES = {
  requires_payment: 'bg-gray-100 text-gray-500',
  processing: 'bg-yellow-100 text-yellow-700',
  succeeded: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-600',
  refunded: 'bg-purple-100 text-purple-700',
  partially_refunded: 'bg-orange-100 text-orange-700',
}

const STATUS_LABELS = {
  requires_payment: 'Pending',
  processing: 'Processing',
  succeeded: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
  partially_refunded: 'Part. Refunded',
}

export default function AdminPaymentsPage() {
  const dispatch = useDispatch()
  const { payments, paymentsMeta, paymentsStatus, refundStatus, refundError } = useSelector((s) => s.payments)
  const [page, setPage] = useState(1)
  const [refundTarget, setRefundTarget] = useState(null) // { bookingId, maxAmount }
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')

  function load(p = 1) {
    dispatch(fetchPaymentsThunk({ page: p, limit: 20 }))
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (refundStatus === 'succeeded') {
      setRefundTarget(null)
      setRefundAmount('')
      setRefundReason('')
      dispatch(clearRefund())
      load(page)
    }
  }, [refundStatus])

  function handleRefundSubmit(e) {
    e.preventDefault()
    if (!refundTarget) return
    dispatch(createRefundThunk({
      bookingId: refundTarget.bookingId,
      amount: Number(refundAmount),
      reason: refundReason,
    }))
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Payments</h1>
        <p className="mt-1 text-sm text-muted">All Stripe payment records. Issue refunds from here.</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {paymentsStatus === 'loading' ? (
          <div className="py-16"><Spinner center /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="px-5 py-3">Payment ID</th>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(payments ?? []).map((p) => (
                  <tr key={p._id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="px-5 py-3.5 font-mono text-xs text-muted max-w-[140px] truncate">
                      {p.stripePaymentIntentId}
                    </td>
                    <td className="px-5 py-3.5 text-ink">{p.user?.name ?? '—'}</td>
                    <td className="px-5 py-3.5 font-semibold text-ink">
                      ${Number(p.amount ?? 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[p.status] ?? p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-muted whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5">
                      {p.status === 'succeeded' && (
                        <button
                          onClick={() => setRefundTarget({ bookingId: p.booking?._id ?? p.booking, maxAmount: p.amount })}
                          className="text-xs font-medium text-red-500 hover:underline"
                        >
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {(payments ?? []).length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-sm text-muted">No payments found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {paymentsMeta && paymentsMeta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
            <span className="text-xs text-muted">Page {page} of {paymentsMeta.totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => { setPage(page - 1); load(page - 1) }}>Prev</Button>
              <Button variant="outline" size="sm" disabled={page >= paymentsMeta.totalPages} onClick={() => { setPage(page + 1); load(page + 1) }}>Next</Button>
            </div>
          </div>
        )}
      </div>

      {/* Refund modal */}
      {refundTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-ink">Issue Refund</h2>
            {refundError && <ErrorMessage message={refundError} />}
            <form onSubmit={handleRefundSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink">
                  Refund amount (max ${refundTarget.maxAmount?.toLocaleString()})
                </label>
                <input
                  type="number"
                  min={1}
                  max={refundTarget.maxAmount}
                  step="0.01"
                  required
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink">Reason (optional)</label>
                <textarea
                  rows={2}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit" variant="danger" loading={refundStatus === 'loading'}>Issue refund</Button>
                <Button type="button" variant="ghost" onClick={() => setRefundTarget(null)}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
