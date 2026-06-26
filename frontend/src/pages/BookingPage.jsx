import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchTourThunk, clearDetail } from '@/features/tours/toursSlice'
import {
  createBookingThunk,
  validateCouponThunk,
  clearCreate,
  clearCoupon,
} from '@/features/bookings/bookingsSlice'
import Spinner from '@/components/ui/Spinner'
import ErrorMessage from '@/components/ui/ErrorMessage'
import Button from '@/components/ui/Button'
import { TAX_RATE, TAX_LABEL } from '@/lib/constants'

const currencySymbols = { USD: '$', INR: '₹', EUR: '€' }

function fmt(sym, n) {
  return `${sym}${Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function BookingPage() {
  const { tourId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const { tour, detailStatus } = useSelector((s) => s.tours)
  const { createStatus, createError, createdBooking, coupon, couponStatus, couponError } =
    useSelector((s) => s.bookings)

  // ── Form state ─────────────────────────────────────────────────────────────
  const [selectedDateId, setSelectedDateId] = useState('')
  const [adults, setAdults] = useState(1)
  const [children, setChildren] = useState(0)
  const [travelerDetails, setTravelerDetails] = useState([])
  const [showTravelerDetails, setShowTravelerDetails] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [appliedCouponCode, setAppliedCouponCode] = useState('')

  // ── Load tour ──────────────────────────────────────────────────────────────
  useEffect(() => {
    dispatch(fetchTourThunk(tourId))
    return () => {
      dispatch(clearDetail())
      dispatch(clearCreate())
      dispatch(clearCoupon())
    }
  }, [dispatch, tourId])

  // ── Navigate to checkout on success ───────────────────────────────────────
  useEffect(() => {
    if (createStatus === 'succeeded' && createdBooking) {
      navigate(`/checkout/${createdBooking._id}`)
    }
  }, [createStatus, createdBooking, navigate])

  // ── Keep travelerDetails array sized to total travelers ───────────────────
  const totalTravelers = adults + children
  useEffect(() => {
    setTravelerDetails((prev) => {
      if (prev.length === totalTravelers) return prev
      if (prev.length < totalTravelers) {
        return [
          ...prev,
          ...Array.from({ length: totalTravelers - prev.length }, () => ({
            name: '',
            age: '',
            passportNumber: '',
          })),
        ]
      }
      return prev.slice(0, totalTravelers)
    })
  }, [totalTravelers])

  if (detailStatus === 'loading') return <Spinner center size="lg" />
  if (!tour && detailStatus === 'failed') {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <ErrorMessage message="Tour not found" />
        <Link to="/tours" className="mt-4 inline-block text-sm text-brand-600 hover:underline">← Browse tours</Link>
      </div>
    )
  }
  if (!tour) return null

  const sym = currencySymbols[tour.currency] ?? '$'

  // Available departures (not cancelled, has seats)
  const departures = (tour.startDates ?? [])
    .filter((d) => !d.isCancelled && new Date(d.date) > new Date())
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  const selectedDeparture = departures.find((d) => d._id === selectedDateId)
  const seatsLeft = selectedDeparture?.availableSeats ?? null
  const enoughSeats = seatsLeft === null ? false : seatsLeft >= totalTravelers

  // Price calculation (mirrors backend)
  const baseAmount = tour.price * totalTravelers
  const discountAmount = coupon?.discountAmount ?? 0
  const taxable = baseAmount - discountAmount
  const taxAmount = taxable * TAX_RATE
  const totalAmount = taxable + taxAmount

  // ── Handlers ───────────────────────────────────────────────────────────────
  function handleAdultChange(delta) {
    setAdults((v) => Math.max(1, v + delta))
  }

  function handleChildChange(delta) {
    setChildren((v) => Math.max(0, v + delta))
  }

  function updateTraveler(i, field, val) {
    setTravelerDetails((prev) => {
      const next = [...prev]
      next[i] = { ...next[i], [field]: val }
      return next
    })
  }

  function handleApplyCoupon() {
    if (!couponCode.trim()) return
    dispatch(clearCoupon())
    dispatch(
      validateCouponThunk({
        code: couponCode.trim().toUpperCase(),
        tourId: tour._id,
        baseAmount,
      }),
    )
    setAppliedCouponCode(couponCode.trim().toUpperCase())
  }

  function handleRemoveCoupon() {
    dispatch(clearCoupon())
    setCouponCode('')
    setAppliedCouponCode('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedDateId || !enoughSeats) return

    dispatch(
      createBookingThunk({
        tourId: tour._id,
        tourStartDateId: selectedDateId,
        travelers: { adults, children },
        travelerDetails: showTravelerDetails
          ? travelerDetails.map((t) => ({
              name: t.name,
              age: Number(t.age),
              passportNumber: t.passportNumber || null,
            }))
          : [],
        couponCode: coupon ? appliedCouponCode : undefined,
      }),
    )
  }

  const canSubmit =
    selectedDateId &&
    enoughSeats &&
    createStatus !== 'loading' &&
    (!showTravelerDetails || travelerDetails.every((t) => t.name && t.age))

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to={`/tours/${tour.slug}`} className="mb-6 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        ← Back to tour
      </Link>

      <h1 className="mb-8 text-2xl font-bold text-ink">Book your trip</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* ── Form ──────────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="space-y-8 lg:col-span-2">
          {createError && <ErrorMessage message={createError} />}

          {/* Tour summary */}
          <div className="flex items-center gap-4 rounded-xl border border-gray-200 p-4">
            {tour.images?.[0]?.url && (
              <img
                src={tour.images[0].url}
                alt={tour.title}
                className="h-16 w-24 shrink-0 rounded-lg object-cover"
              />
            )}
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{tour.title}</p>
              <p className="text-sm text-muted">{tour.duration?.days}D / {tour.duration?.nights}N · {sym}{tour.price?.toLocaleString()} per person</p>
            </div>
          </div>

          {/* Select departure */}
          <BookingSection title="Select departure date" step={1}>
            {departures.length === 0 ? (
              <p className="text-sm text-muted">No upcoming departures available for this tour.</p>
            ) : (
              <div className="space-y-2">
                {departures.map((d) => {
                  const seats = d.availableSeats
                  const full = seats === 0
                  return (
                    <label
                      key={d._id}
                      className={`flex cursor-pointer items-center justify-between rounded-xl border p-3.5 transition-colors ${
                        selectedDateId === d._id
                          ? 'border-brand-500 bg-brand-50'
                          : full
                          ? 'cursor-not-allowed border-gray-200 opacity-60'
                          : 'border-gray-200 hover:border-brand-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="startDate"
                          value={d._id}
                          disabled={full}
                          checked={selectedDateId === d._id}
                          onChange={() => setSelectedDateId(d._id)}
                          className="h-4 w-4 accent-brand-500"
                        />
                        <span className="text-sm font-medium text-ink">
                          {new Date(d.date).toLocaleDateString('en-US', {
                            weekday: 'short', year: 'numeric', month: 'long', day: 'numeric',
                          })}
                        </span>
                      </div>
                      <span className={`text-xs font-medium ${full ? 'text-red-500' : seats <= 5 ? 'text-orange-500' : 'text-green-600'}`}>
                        {full ? 'Sold out' : `${seats} seat${seats !== 1 ? 's' : ''} left`}
                      </span>
                    </label>
                  )
                })}
              </div>
            )}
          </BookingSection>

          {/* Traveler count */}
          <BookingSection title="Travelers" step={2}>
            <div className="space-y-4">
              <TravelerCounter
                label="Adults"
                sublabel="Age 18+"
                value={adults}
                onDecrement={() => handleAdultChange(-1)}
                onIncrement={() => handleAdultChange(1)}
                min={1}
              />
              <TravelerCounter
                label="Children"
                sublabel="Age 0–17"
                value={children}
                onDecrement={() => handleChildChange(-1)}
                onIncrement={() => handleChildChange(1)}
                min={0}
              />
            </div>

            {/* Seat availability indicator */}
            {selectedDeparture && (
              <div className={`mt-3 rounded-lg px-3 py-2 text-sm ${enoughSeats ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {enoughSeats
                  ? `✓ ${seatsLeft} seat${seatsLeft !== 1 ? 's' : ''} available — ${totalTravelers} requested`
                  : `✗ Not enough seats — ${seatsLeft} available, ${totalTravelers} requested`}
              </div>
            )}
          </BookingSection>

          {/* Traveler details (optional) */}
          <BookingSection
            title="Traveler details"
            step={3}
            headerRight={
              <button
                type="button"
                onClick={() => setShowTravelerDetails((v) => !v)}
                className="text-xs font-medium text-brand-600 hover:underline"
              >
                {showTravelerDetails ? 'Hide' : 'Add traveler details'}
              </button>
            }
          >
            {showTravelerDetails ? (
              <div className="space-y-5">
                {travelerDetails.map((t, i) => (
                  <div key={i} className="rounded-lg border border-gray-200 p-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
                      Traveler {i + 1} {i < adults ? '(Adult)' : '(Child)'}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-ink">Full name *</label>
                        <input
                          type="text"
                          value={t.name}
                          onChange={(e) => updateTraveler(i, 'name', e.target.value)}
                          required={showTravelerDetails}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-ink">Age *</label>
                        <input
                          type="number"
                          min={0}
                          max={120}
                          value={t.age}
                          onChange={(e) => updateTraveler(i, 'age', e.target.value)}
                          required={showTravelerDetails}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="mb-1 block text-xs font-medium text-ink">Passport number <span className="text-muted">(optional)</span></label>
                        <input
                          type="text"
                          value={t.passportNumber}
                          onChange={(e) => updateTraveler(i, 'passportNumber', e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">Traveler details are optional and can be added later.</p>
            )}
          </BookingSection>

          {/* Coupon */}
          <BookingSection title="Coupon code" step={4}>
            {coupon ? (
              <div className="flex items-center justify-between rounded-lg bg-green-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-green-700">
                    {appliedCouponCode} — {fmt(sym, coupon.discountAmount)} off
                  </p>
                  <p className="text-xs text-green-600">
                    {coupon.coupon?.discountType === 'percentage'
                      ? `${coupon.coupon.discountValue}% discount`
                      : `${sym}${coupon.coupon?.discountValue} fixed discount`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase outline-none focus:border-brand-500"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  loading={couponStatus === 'loading'}
                  onClick={handleApplyCoupon}
                  disabled={!couponCode.trim() || !selectedDateId}
                >
                  Apply
                </Button>
              </div>
            )}
            {couponError && (
              <p className="mt-1.5 text-xs text-red-600">{couponError}</p>
            )}
            {!selectedDateId && !coupon && (
              <p className="mt-1 text-xs text-muted">Select a departure date first</p>
            )}
          </BookingSection>

          <Button
            type="submit"
            loading={createStatus === 'loading'}
            disabled={!canSubmit}
            className="w-full"
          >
            Proceed to payment — {fmt(sym, totalAmount)}
          </Button>
        </form>

        {/* ── Price breakdown sidebar ────────────────────────────────────── */}
        <div className="lg:sticky lg:top-6">
          <PriceBreakdown
            sym={sym}
            pricePerPerson={tour.price}
            totalTravelers={totalTravelers}
            adults={adults}
            children={children}
            baseAmount={baseAmount}
            discountAmount={discountAmount}
            taxAmount={taxAmount}
            totalAmount={totalAmount}
            currency={tour.currency}
          />
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function BookingSection({ title, step, children, headerRight }) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
            {step}
          </span>
          <h2 className="text-base font-semibold text-ink">{title}</h2>
        </div>
        {headerRight}
      </div>
      {children}
    </section>
  )
}

function TravelerCounter({ label, sublabel, value, onDecrement, onIncrement, min = 0 }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="text-xs text-muted">{sublabel}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onDecrement}
          disabled={value <= min}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-lg font-light text-ink transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          −
        </button>
        <span className="w-6 text-center text-sm font-semibold text-ink">{value}</span>
        <button
          type="button"
          onClick={onIncrement}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 text-lg font-light text-ink transition-colors hover:bg-gray-100"
        >
          +
        </button>
      </div>
    </div>
  )
}

function PriceBreakdown({
  sym,
  pricePerPerson,
  totalTravelers,
  adults,
  children,
  baseAmount,
  discountAmount,
  taxAmount,
  totalAmount,
}) {
  const rows = [
    {
      label: `${sym}${pricePerPerson?.toLocaleString()} × ${adults} adult${adults !== 1 ? 's' : ''}`,
      value: pricePerPerson * adults,
    },
    children > 0 && {
      label: `${sym}${pricePerPerson?.toLocaleString()} × ${children} child${children !== 1 ? 'ren' : ''}`,
      value: pricePerPerson * children,
    },
  ].filter(Boolean)

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold text-ink">Price breakdown</h3>

      <ul className="space-y-2.5 text-sm">
        {rows.map((r, i) => (
          <li key={i} className="flex justify-between text-ink">
            <span className="text-muted">{r.label}</span>
            <span>{fmt(sym, r.value)}</span>
          </li>
        ))}

        {totalTravelers > 1 && (
          <li className="flex justify-between border-t border-gray-100 pt-2.5 font-medium text-ink">
            <span>Subtotal ({totalTravelers} travelers)</span>
            <span>{fmt(sym, baseAmount)}</span>
          </li>
        )}

        {discountAmount > 0 && (
          <li className="flex justify-between text-green-700">
            <span>Coupon discount</span>
            <span>− {fmt(sym, discountAmount)}</span>
          </li>
        )}

        <li className="flex justify-between text-muted">
          <span>{TAX_LABEL}</span>
          <span>{fmt(sym, taxAmount)}</span>
        </li>
      </ul>

      <div className="mt-4 flex justify-between border-t border-gray-200 pt-4 text-base font-bold text-ink">
        <span>Total</span>
        <span>{fmt(sym, totalAmount)}</span>
      </div>

      <p className="mt-2 text-center text-xs text-muted">You won't be charged yet</p>
    </div>
  )
}
