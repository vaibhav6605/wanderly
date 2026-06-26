import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { createPaymentIntentThunk, clearIntent } from '@/features/payments/paymentsSlice'
import { fetchBookingThunk } from '@/features/bookings/bookingsSlice'
import Spinner from '@/components/ui/Spinner'
import ErrorMessage from '@/components/ui/ErrorMessage'
import Button from '@/components/ui/Button'
import { TAX_LABEL } from '@/lib/constants'

// Initialised once at module level — never inside a component or render loop.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? '')

const currencySymbols = { USD: '$', INR: '₹', EUR: '€' }
function fmt(sym, n) {
  return `${sym}${Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function CheckoutPage() {
  const { bookingId } = useParams()
  const dispatch = useDispatch()
  const { clientSecret, intentStatus, intentError } = useSelector((s) => s.payments)
  const { items: bookings } = useSelector((s) => s.bookings)

  // Try to find the booking in list; otherwise fetch it
  const booking = bookings.find((b) => b._id === bookingId)

  useEffect(() => {
    if (!booking) dispatch(fetchBookingThunk(bookingId))
    dispatch(createPaymentIntentThunk(bookingId))
    return () => dispatch(clearIntent())
  }, [dispatch, bookingId, booking])

  if (intentStatus === 'loading' || intentStatus === 'idle') {
    return <Spinner center size="lg" />
  }

  if (intentStatus === 'failed') {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <ErrorMessage message={intentError ?? 'Could not initialize payment'} />
        <Link to="/bookings" className="mt-4 inline-block text-sm text-brand-600 hover:underline">
          ← Back to my bookings
        </Link>
      </div>
    )
  }

  const appearance = { theme: 'stripe', variables: { colorPrimary: '#ff5a5f' } }
  const options = { clientSecret, appearance }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        to="/bookings"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
      >
        ← My bookings
      </Link>
      <h1 className="mb-8 text-2xl font-bold text-ink">Complete your payment</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        {/* ── Stripe form ─────────────────────────────────────────────── */}
        <div className="lg:col-span-3">
          <Elements stripe={stripePromise} options={options}>
            <CheckoutForm bookingId={bookingId} />
          </Elements>
        </div>

        {/* ── Order summary ───────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <OrderSummary bookingId={bookingId} />
        </div>
      </div>
    </div>
  )
}

// ── Stripe form (must be rendered inside <Elements>) ───────────────────────

function CheckoutForm({ bookingId }) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!stripe || !elements) return

    setSubmitting(true)
    setError(null)

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Stripe redirects here after payment attempt (success or failure)
        return_url: `${window.location.origin}/payment/complete?booking_id=${bookingId}`,
      },
    })

    // Only reached when Stripe cannot redirect (immediate client-side error)
    if (stripeError) {
      setError(stripeError.message ?? 'Payment failed. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-gray-200 p-5">
        <PaymentElement />
      </div>

      {error && <ErrorMessage message={error} />}

      <Button
        type="submit"
        disabled={!stripe || !elements || submitting}
        loading={submitting}
        className="w-full"
      >
        Pay now
      </Button>

      <p className="text-center text-xs text-muted">
        Your payment is secured by Stripe. We never store your card details.
      </p>
    </form>
  )
}

// ── Order summary card ─────────────────────────────────────────────────────

function OrderSummary({ bookingId }) {
  const { items } = useSelector((s) => s.bookings)
  const booking = items.find((b) => b._id === bookingId)

  if (!booking) return null

  const sym = currencySymbols[booking.currency] ?? '$'
  const tour = booking.tour

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      {/* Tour */}
      <div className="mb-5 flex items-center gap-3">
        {tour?.images?.[0]?.url && (
          <img
            src={tour.images[0].url}
            alt=""
            className="h-14 w-20 shrink-0 rounded-lg object-cover"
          />
        )}
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{tour?.title}</p>
          <p className="text-xs text-muted">
            {tour?.duration?.days}D / {tour?.duration?.nights}N
          </p>
        </div>
      </div>

      <p className="mb-3 text-xs font-medium text-muted">
        Departure:{' '}
        {new Date(booking.tourStartDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </p>
      <p className="mb-5 text-xs text-muted">
        {booking.travelers.adults} adult{booking.travelers.adults !== 1 ? 's' : ''}
        {booking.travelers.children > 0 &&
          `, ${booking.travelers.children} child${booking.travelers.children !== 1 ? 'ren' : ''}`}
      </p>

      {/* Price breakdown */}
      <ul className="space-y-2 text-sm">
        <li className="flex justify-between">
          <span className="text-muted">Subtotal</span>
          <span>{fmt(sym, booking.baseAmount)}</span>
        </li>
        {booking.discountAmount > 0 && (
          <li className="flex justify-between text-green-700">
            <span>Discount</span>
            <span>− {fmt(sym, booking.discountAmount)}</span>
          </li>
        )}
        <li className="flex justify-between text-muted">
          <span>{TAX_LABEL}</span>
          <span>{fmt(sym, booking.taxAmount)}</span>
        </li>
      </ul>

      <div className="mt-4 flex justify-between border-t border-gray-200 pt-4 text-base font-bold text-ink">
        <span>Total</span>
        <span>{fmt(sym, booking.totalAmount)}</span>
      </div>
    </div>
  )
}
