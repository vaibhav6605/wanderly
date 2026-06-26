/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  fetchTourThunk,
  fetchCategoriesThunk,
  fetchDestinationsThunk,
  createTourThunk,
  updateTourThunk,
  clearMutate,
  clearDetail,
} from '@/features/tours/toursSlice'
import ImageUploader from '@/components/tours/ImageUploader'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import ErrorMessage from '@/components/ui/ErrorMessage'
import Spinner from '@/components/ui/Spinner'

const EMPTY = {
  title: '',
  summary: '',
  description: '',
  category: '',
  destinations: [],
  duration: { days: 1, nights: 0 },
  price: '',
  discountPrice: '',
  currency: 'USD',
  maxGroupSize: 10,
  difficulty: 'easy',
  images: [],
  itinerary: [],
  inclusions: [],
  exclusions: [],
  startDates: [],
  isActive: true,
}

function tourToForm(tour) {
  return {
    title: tour.title ?? '',
    summary: tour.summary ?? '',
    description: tour.description ?? '',
    category: typeof tour.category === 'object' ? tour.category._id : (tour.category ?? ''),
    destinations: (tour.destinations ?? []).map((d) =>
      typeof d === 'object' ? d._id : d,
    ),
    duration: {
      days: tour.duration?.days ?? 1,
      nights: tour.duration?.nights ?? 0,
    },
    price: tour.price != null ? String(tour.price) : '',
    discountPrice: tour.discountPrice != null ? String(tour.discountPrice) : '',
    currency: tour.currency ?? 'USD',
    maxGroupSize: tour.maxGroupSize ?? 10,
    difficulty: tour.difficulty ?? 'easy',
    images: tour.images ?? [],
    itinerary: tour.itinerary ?? [],
    inclusions: tour.inclusions ?? [],
    exclusions: tour.exclusions ?? [],
    startDates: (tour.startDates ?? []).map((sd) => ({
      _id: sd._id,
      date: sd.date ? new Date(sd.date).toISOString().slice(0, 10) : '',
      availableSeats: sd.availableSeats ?? 0,
      isCancelled: sd.isCancelled ?? false,
    })),
    isActive: tour.isActive ?? true,
  }
}

export default function TourFormPage() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const { tour, detailStatus, mutateStatus, mutateError, categories, destinations } =
    useSelector((s) => s.tours)

  const [form, setForm] = useState(EMPTY)
  const [destSearch, setDestSearch] = useState('')

  // Load reference data
  useEffect(() => {
    dispatch(fetchCategoriesThunk())
    dispatch(fetchDestinationsThunk())
    if (isEditing) dispatch(fetchTourThunk(id))
    return () => {
      dispatch(clearDetail())
      dispatch(clearMutate())
    }
  }, [dispatch, id, isEditing])

  // Populate form when editing and tour loads
  useEffect(() => {
    if (isEditing && tour && (tour._id === id || tour.slug)) {
      setForm(tourToForm(tour))
    }
  }, [tour, id, isEditing])

  // Clean up mutate status on unmount
  useEffect(() => () => { dispatch(clearMutate()) }, [dispatch])

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }))
  }

  function setNested(parent, key, val) {
    setForm((f) => ({ ...f, [parent]: { ...f[parent], [key]: val } }))
  }

  function toggleDestination(destId) {
    set(
      'destinations',
      form.destinations.includes(destId)
        ? form.destinations.filter((d) => d !== destId)
        : [...form.destinations, destId],
    )
  }

  // ── Itinerary ──────────────────────────────────────────────────────────────
  function addItineraryItem() {
    set('itinerary', [
      ...form.itinerary,
      { day: form.itinerary.length + 1, title: '', description: '' },
    ])
  }

  function updateItineraryItem(i, field, val) {
    const next = [...form.itinerary]
    next[i] = { ...next[i], [field]: val }
    set('itinerary', next)
  }

  function removeItineraryItem(i) {
    set(
      'itinerary',
      form.itinerary
        .filter((_, idx) => idx !== i)
        .map((item, idx) => ({ ...item, day: idx + 1 })),
    )
  }

  // ── Start dates ────────────────────────────────────────────────────────────
  function addStartDate() {
    set('startDates', [...form.startDates, { date: '', availableSeats: 10, isCancelled: false }])
  }

  function updateStartDate(i, field, val) {
    const next = [...form.startDates]
    next[i] = { ...next[i], [field]: val }
    set('startDates', next)
  }

  function removeStartDate(i) {
    set('startDates', form.startDates.filter((_, idx) => idx !== i))
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault()

    const payload = {
      ...form,
      price: Number(form.price),
      discountPrice: form.discountPrice !== '' ? Number(form.discountPrice) : null,
      maxGroupSize: Number(form.maxGroupSize),
      duration: {
        days: Number(form.duration.days),
        nights: Number(form.duration.nights),
      },
      startDates: form.startDates.filter((sd) => sd.date).map((sd) => ({
        date: sd.date,
        availableSeats: Number(sd.availableSeats),
        isCancelled: Boolean(sd.isCancelled),
      })),
    }

    const action = isEditing
      ? dispatch(updateTourThunk({ id, data: payload }))
      : dispatch(createTourThunk(payload))

    const result = await action
    if (!result.error) navigate('/admin/tours')
  }

  if (isEditing && detailStatus === 'loading') return <Spinner center size="lg" />

  const filteredDests = destinations.filter((d) => {
    if (!destSearch) return true
    const q = destSearch.toLowerCase()
    return d.name?.toLowerCase().includes(q) || d.country?.toLowerCase().includes(q) || d.city?.toLowerCase().includes(q)
  })

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-8 text-2xl font-bold text-ink">
        {isEditing ? 'Edit Tour' : 'Create New Tour'}
      </h1>

      {mutateError && <ErrorMessage message={mutateError} />}

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* ── Basic info ─────────────────────────────────────────────────────── */}
        <FormSection title="Basic information">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            required
            maxLength={120}
          />
          <Input
            label="Summary"
            value={form.summary}
            onChange={(e) => set('summary', e.target.value)}
            required
            maxLength={300}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              required
              rows={6}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Category</label>
              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Difficulty</label>
              <select
                value={form.difficulty}
                onChange={(e) => set('difficulty', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
              >
                {['easy', 'moderate', 'challenging', 'difficult'].map((d) => (
                  <option key={d} value={d} className="capitalize">{d}</option>
                ))}
              </select>
            </div>
          </div>
        </FormSection>

        {/* ── Details ────────────────────────────────────────────────────────── */}
        <FormSection title="Details">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Input
              label="Days"
              type="number"
              min={1}
              value={form.duration.days}
              onChange={(e) => setNested('duration', 'days', e.target.value)}
              required
            />
            <Input
              label="Nights"
              type="number"
              min={0}
              value={form.duration.nights}
              onChange={(e) => setNested('duration', 'nights', e.target.value)}
              required
            />
            <Input
              label="Max group size"
              type="number"
              min={1}
              value={form.maxGroupSize}
              onChange={(e) => set('maxGroupSize', e.target.value)}
              required
            />
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => set('currency', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
              >
                {['USD', 'INR', 'EUR'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Price"
              type="number"
              min={0}
              step="0.01"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              required
            />
            <Input
              label="Discount price (optional)"
              type="number"
              min={0}
              step="0.01"
              value={form.discountPrice}
              onChange={(e) => set('discountPrice', e.target.value)}
            />
          </div>
        </FormSection>

        {/* ── Destinations ───────────────────────────────────────────────────── */}
        <FormSection title="Destinations">
          <input
            type="text"
            placeholder="Search destinations…"
            value={destSearch}
            onChange={(e) => setDestSearch(e.target.value)}
            className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
          {form.destinations.length === 0 && (
            <p className="mb-2 text-xs text-red-500">Select at least one destination</p>
          )}
          <div className="max-h-56 overflow-y-auto rounded-lg border border-gray-200 p-3">
            {filteredDests.length === 0 ? (
              <p className="text-xs text-muted">No destinations found</p>
            ) : (
              <div className="space-y-1.5">
                {filteredDests.map((d) => (
                  <label key={d._id} className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={form.destinations.includes(d._id)}
                      onChange={() => toggleDestination(d._id)}
                      className="h-4 w-4 rounded border-gray-300 accent-brand-500"
                    />
                    {d.city ? `${d.city}, ${d.country}` : `${d.name} (${d.country})`}
                  </label>
                ))}
              </div>
            )}
          </div>
        </FormSection>

        {/* ── Images ─────────────────────────────────────────────────────────── */}
        <FormSection title="Images">
          <ImageUploader value={form.images} onChange={(imgs) => set('images', imgs)} />
        </FormSection>

        {/* ── Itinerary ──────────────────────────────────────────────────────── */}
        <FormSection title="Itinerary" action={
          <button type="button" onClick={addItineraryItem} className="text-xs font-medium text-brand-600 hover:underline">
            + Add day
          </button>
        }>
          {form.itinerary.length === 0 && (
            <p className="text-sm text-muted">No itinerary added yet.</p>
          )}
          <div className="space-y-4">
            {form.itinerary.map((item, i) => (
              <div key={i} className="rounded-lg border border-gray-200 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-brand-600">Day {item.day}</span>
                  <button
                    type="button"
                    onClick={() => removeItineraryItem(i)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
                <div className="space-y-3">
                  <Input
                    label="Title"
                    value={item.title}
                    onChange={(e) => updateItineraryItem(i, 'title', e.target.value)}
                    required
                  />
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink">Description (optional)</label>
                    <textarea
                      value={item.description ?? ''}
                      onChange={(e) => updateItineraryItem(i, 'description', e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </FormSection>

        {/* ── Inclusions / Exclusions ─────────────────────────────────────────── */}
        <FormSection title="Inclusions &amp; exclusions">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <StringListEditor
              label="Inclusions"
              items={form.inclusions}
              onChange={(v) => set('inclusions', v)}
            />
            <StringListEditor
              label="Exclusions"
              items={form.exclusions}
              onChange={(v) => set('exclusions', v)}
            />
          </div>
        </FormSection>

        {/* ── Start dates ─────────────────────────────────────────────────────── */}
        <FormSection title="Departure dates" action={
          <button type="button" onClick={addStartDate} className="text-xs font-medium text-brand-600 hover:underline">
            + Add date
          </button>
        }>
          {form.startDates.length === 0 && (
            <p className="text-sm text-muted">No departure dates added.</p>
          )}
          <div className="space-y-3">
            {form.startDates.map((sd, i) => (
              <div key={i} className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 p-3">
                <div className="flex-1 min-w-32">
                  <label className="mb-1.5 block text-xs font-medium text-ink">Date</label>
                  <input
                    type="date"
                    value={sd.date}
                    onChange={(e) => updateStartDate(i, 'date', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
                  />
                </div>
                <div className="w-28">
                  <label className="mb-1.5 block text-xs font-medium text-ink">Available seats</label>
                  <input
                    type="number"
                    min={0}
                    value={sd.availableSeats}
                    onChange={(e) => updateStartDate(i, 'availableSeats', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={sd.isCancelled}
                    onChange={(e) => updateStartDate(i, 'isCancelled', e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 accent-brand-500"
                  />
                  Cancelled
                </label>
                <button
                  type="button"
                  onClick={() => removeStartDate(i)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </FormSection>

        {/* ── Status ─────────────────────────────────────────────────────────── */}
        <FormSection title="Publishing">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => set('isActive', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 accent-brand-500"
            />
            <div>
              <p className="text-sm font-medium text-ink">Active (publicly visible)</p>
              <p className="text-xs text-muted">Uncheck to hide this tour from public listings</p>
            </div>
          </label>
        </FormSection>

        {/* ── Actions ────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 border-t border-gray-200 pt-6">
          <Button
            type="submit"
            loading={mutateStatus === 'loading'}
            disabled={!form.title || !form.category || form.destinations.length === 0 || !form.price}
          >
            {isEditing ? 'Save changes' : 'Create tour'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/admin/tours')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}

function FormSection({ title, children, action }) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-2">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {action}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function StringListEditor({ label, items, onChange }) {
  const [draft, setDraft] = useState('')

  function add() {
    const trimmed = draft.trim()
    if (!trimmed || items.includes(trimmed)) return
    onChange([...items, trimmed])
    setDraft('')
  }

  function remove(i) {
    onChange(items.filter((_, idx) => idx !== i))
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      add()
    }
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-ink">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type and press Enter"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
        />
        <button
          type="button"
          onClick={add}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
        >
          Add
        </button>
      </div>
      {items.length > 0 && (
        <ul className="mt-2 space-y-1">
          {items.map((item, i) => (
            <li key={i} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5 text-sm">
              <span className="text-ink">{item}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="ml-2 text-xs text-red-500 hover:underline"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
