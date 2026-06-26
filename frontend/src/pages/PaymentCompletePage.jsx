import { useSearchParams, Link } from 'react-router-dom'
import Button from '@/components/ui/Button'

export default function PaymentCompletePage() {
  const [searchParams] = useSearchParams()
  const redirectStatus = searchParams.get('redirect_status')
  const bookingId = searchParams.get('booking_id')

  const succeeded = redirectStatus === 'succeeded'

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      {succeeded ? <SuccessView bookingId={bookingId} /> : <FailureView bookingId={bookingId} />}
    </div>
  )
}

function SuccessView({ bookingId }) {
  return (
    <div className="space-y-6">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-green-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-ink">Payment successful!</h1>
        <p className="mt-2 text-sm text-muted">
          Your booking is confirmed. A confirmation email will be sent shortly.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Link to="/bookings">
          <Button className="w-full">View my bookings</Button>
        </Link>
        {bookingId && (
          <Link to={`/invoice/${bookingId}`}>
            <Button variant="outline" className="w-full">
              Download invoice
            </Button>
          </Link>
        )}
        <Link to="/tours" className="text-sm text-muted hover:text-ink">
          Continue browsing tours
        </Link>
      </div>
    </div>
  )
}

function FailureView({ bookingId }) {
  return (
    <div className="space-y-6">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-ink">Payment failed</h1>
        <p className="mt-2 text-sm text-muted">
          Your card was not charged. Please check your card details and try again.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {bookingId && (
          <Link to={`/checkout/${bookingId}`}>
            <Button className="w-full">Try again</Button>
          </Link>
        )}
        <Link to="/bookings">
          <Button variant="outline" className="w-full">
            My bookings
          </Button>
        </Link>
        <Link to="/tours" className="text-sm text-muted hover:text-ink">
          Browse other tours
        </Link>
      </div>
    </div>
  )
}
