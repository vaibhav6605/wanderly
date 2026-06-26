import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchInvoiceThunk, clearInvoice } from '@/features/payments/paymentsSlice'
import Spinner from '@/components/ui/Spinner'
import ErrorMessage from '@/components/ui/ErrorMessage'
import Button from '@/components/ui/Button'

const currencySymbols = { USD: '$', INR: '₹', EUR: '€' }

function fmt(sym, n) {
  return `${sym}${Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const paymentStatusStyles = {
  succeeded: 'text-green-700',
  failed: 'text-red-600',
  pending: 'text-yellow-600',
  refunded: 'text-purple-700',
  partially_refunded: 'text-orange-600',
}

export default function InvoicePage() {
  const { bookingId } = useParams()
  const dispatch = useDispatch()
  const { invoice, invoiceStatus, invoiceError } = useSelector((s) => s.payments)

  useEffect(() => {
    dispatch(fetchInvoiceThunk(bookingId))
    return () => dispatch(clearInvoice())
  }, [dispatch, bookingId])

  if (invoiceStatus === 'loading' || invoiceStatus === 'idle') {
    return <Spinner center size="lg" />
  }

  if (invoiceStatus === 'failed') {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <ErrorMessage message={invoiceError ?? 'Could not load invoice'} />
        <Link to="/bookings" className="mt-4 inline-block text-sm text-brand-600 hover:underline">
          ← Back to my bookings
        </Link>
      </div>
    )
  }

  if (!invoice) return null

  const sym = currencySymbols[invoice.currency] ?? '$'

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Print / back controls — hidden when printing */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link to="/bookings" className="text-sm text-muted hover:text-ink">
          ← My bookings
        </Link>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          Print / Save PDF
        </Button>
      </div>

      {/* Invoice card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm print:border-0 print:shadow-none">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-200 p-8 print:border-gray-300">
          <div>
            <h1 className="text-3xl font-bold text-ink">Invoice</h1>
            <p className="mt-1 font-mono text-sm text-muted">{invoice.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-brand-500">Wanderly</p>
            <p className="text-sm text-muted">wanderly.com</p>
          </div>
        </div>

        {/* Booking / payment meta */}
        <div className="grid grid-cols-2 gap-8 border-b border-gray-200 p-8 text-sm print:border-gray-300">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Booking details</p>
            <p className="text-ink">
              <span className="text-muted">Status: </span>
              <span className="font-medium capitalize">{invoice.bookingStatus}</span>
            </p>
            <p className="text-ink">
              <span className="text-muted">Departure: </span>
              {new Date(invoice.tourStartDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <p className="text-ink">
              <span className="text-muted">Travelers: </span>
              {invoice.travelers.adults} adult{invoice.travelers.adults !== 1 ? 's' : ''}
              {invoice.travelers.children > 0 &&
                `, ${invoice.travelers.children} child${invoice.travelers.children !== 1 ? 'ren' : ''}`}
            </p>
          </div>
          <div className="space-y-1.5 text-right">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Payment details</p>
            <p className={`font-medium ${paymentStatusStyles[invoice.paymentStatus] ?? 'text-ink'}`}>
              {invoice.paymentStatus?.replace(/_/g, ' ')}
            </p>
            {invoice.paidAt && (
              <p className="text-muted">
                {new Date(invoice.paidAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            )}
            {invoice.stripePaymentIntentId && (
              <p className="font-mono text-xs text-muted">{invoice.stripePaymentIntentId}</p>
            )}
          </div>
        </div>

        {/* Tour */}
        <div className="border-b border-gray-200 p-8 print:border-gray-300">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Tour</p>
          <p className="mt-2 text-lg font-semibold text-ink">{invoice.tourTitle}</p>
          <p className="text-sm text-muted">
            {invoice.tourDuration?.days}D / {invoice.tourDuration?.nights}N
          </p>
        </div>

        {/* Line items */}
        <div className="p-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                <th className="pb-3">Description</th>
                <th className="pb-3 text-right">Qty</th>
                <th className="pb-3 text-right">Unit price</th>
                <th className="pb-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.lineItems ?? []).map((item, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-3 text-ink">{item.description}</td>
                  <td className="py-3 text-right text-muted">{item.quantity}</td>
                  <td className="py-3 text-right text-muted">{fmt(sym, item.unitPrice)}</td>
                  <td className="py-3 text-right text-ink">{fmt(sym, item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="border-t border-gray-200 p-8 print:border-gray-300">
          <div className="ml-auto max-w-xs space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Subtotal</span>
              <span>{fmt(sym, invoice.baseAmount)}</span>
            </div>
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-green-700">
                <span>
                  Discount{invoice.couponCode ? ` (${invoice.couponCode})` : ''}
                </span>
                <span>− {fmt(sym, invoice.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-muted">
              <span>Tax (10%)</span>
              <span>{fmt(sym, invoice.taxAmount)}</span>
            </div>
            {invoice.refundedAmount > 0 && (
              <div className="flex justify-between text-purple-700">
                <span>Refunded</span>
                <span>− {fmt(sym, invoice.refundedAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-200 pt-3 text-base font-bold text-ink">
              <span>Total</span>
              <span>{fmt(sym, invoice.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-8 py-5 text-center text-xs text-muted print:border-gray-300">
          Thank you for booking with Wanderly. For questions, contact support@wanderly.com.
        </div>
      </div>
    </div>
  )
}
