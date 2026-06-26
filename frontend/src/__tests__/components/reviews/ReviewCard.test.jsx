import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReviewCard from '@/components/reviews/ReviewCard'
import { renderWithProviders, createTestStore } from '../../helpers/renderWithProviders'

// ── Mock the reviews slice thunks ─────────────────────────────────────────────

vi.mock('@/features/reviews/reviewsSlice', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    updateReviewThunk: vi.fn(() => ({ type: 'reviews/update/fulfilled', payload: {} })),
    deleteReviewThunk: vi.fn(() => ({ type: 'reviews/delete/fulfilled', payload: 'r1' })),
  }
})

import { updateReviewThunk, deleteReviewThunk } from '@/features/reviews/reviewsSlice'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ownerId = 'user-owner-id'
const otherUserId = 'user-other-id'

const baseReview = {
  _id: 'r1',
  rating: 4,
  title: 'Great tour',
  comment: 'Really enjoyed the whole experience from start to finish.',
  createdAt: '2025-01-15T10:00:00Z',
  user: { _id: ownerId, name: 'Asha Rao' },
  booking: 'b1',
  isApproved: true,
}

function renderCard(review = baseReview, currentUserId = null, reviewsState = {}) {
  const preloadedState = {
    reviews: {
      items: [review],
      status: 'succeeded',
      actionStatus: 'idle',
      actionError: null,
      ...reviewsState,
    },
  }
  return renderWithProviders(
    <ReviewCard review={review} currentUserId={currentUserId} />,
    { preloadedState },
  )
}

// ── Display tests ─────────────────────────────────────────────────────────────

describe('ReviewCard — display', () => {
  it('renders the reviewer's name', () => {
    renderCard()
    expect(screen.getByText('Asha Rao')).toBeInTheDocument()
  })

  it('renders the review comment', () => {
    renderCard()
    expect(screen.getByText(/really enjoyed the whole experience/i)).toBeInTheDocument()
  })

  it('renders the review title when present', () => {
    renderCard({ ...baseReview, title: 'Outstanding!' })
    expect(screen.getByText('Outstanding!')).toBeInTheDocument()
  })

  it('shows the "Verified Booking" badge when booking is set', () => {
    renderCard()
    expect(screen.getByText(/verified booking/i)).toBeInTheDocument()
  })

  it('does not show the "Verified Booking" badge when booking is null', () => {
    renderCard({ ...baseReview, booking: null })
    expect(screen.queryByText(/verified booking/i)).not.toBeInTheDocument()
  })

  it('renders the formatted date', () => {
    renderCard()
    expect(screen.getByText(/january 2025/i)).toBeInTheDocument()
  })
})

// ── Ownership-based UI ────────────────────────────────────────────────────────

describe('ReviewCard — ownership', () => {
  it('shows Edit and Delete buttons for the review owner', () => {
    renderCard(baseReview, ownerId)
    expect(screen.getByRole('button', { name: /^edit$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument()
  })

  it('does not show Edit or Delete for a different user', () => {
    renderCard(baseReview, otherUserId)
    expect(screen.queryByRole('button', { name: /^edit$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^delete$/i })).not.toBeInTheDocument()
  })

  it('does not show Edit or Delete when currentUserId is null (unauthenticated)', () => {
    renderCard(baseReview, null)
    expect(screen.queryByRole('button', { name: /^edit$/i })).not.toBeInTheDocument()
  })
})

// ── Edit flow ─────────────────────────────────────────────────────────────────

describe('ReviewCard — edit flow', () => {
  beforeEach(() => vi.clearAllMocks())

  it('switches to edit mode when Edit is clicked', async () => {
    const user = userEvent.setup()
    renderCard(baseReview, ownerId)

    await user.click(screen.getByRole('button', { name: /^edit$/i }))

    expect(screen.getByText(/edit your review/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/your review/i)).toBeInTheDocument()
  })

  it('pre-fills the edit form with the current review values', async () => {
    const user = userEvent.setup()
    renderCard({ ...baseReview, title: 'Pre-filled title', comment: 'Pre-filled comment text here.' }, ownerId)

    await user.click(screen.getByRole('button', { name: /^edit$/i }))

    expect(screen.getByDisplayValue('Pre-filled title')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Pre-filled comment text here.')).toBeInTheDocument()
  })

  it('exits edit mode without dispatching when Cancel is clicked', async () => {
    const user = userEvent.setup()
    renderCard(baseReview, ownerId)

    await user.click(screen.getByRole('button', { name: /^edit$/i }))
    await user.click(screen.getByRole('button', { name: /^cancel$/i }))

    // Back to read mode
    expect(screen.queryByText(/edit your review/i)).not.toBeInTheDocument()
    expect(updateReviewThunk).not.toHaveBeenCalled()
  })

  it('dispatches updateReviewThunk with updated values when Save is clicked', async () => {
    // Make the mock return a fulfilled action so the component exits edit mode
    updateReviewThunk.mockReturnValue(({ type: 'reviews/update/fulfilled', payload: { _id: 'r1', rating: 5, comment: 'Updated!' } }))

    const user = userEvent.setup()
    renderCard(baseReview, ownerId)

    await user.click(screen.getByRole('button', { name: /^edit$/i }))

    const commentField = screen.getByPlaceholderText(/your review/i)
    await user.clear(commentField)
    await user.type(commentField, 'This tour was absolutely spectacular!')

    await user.click(screen.getByRole('button', { name: /^save$/i }))

    expect(updateReviewThunk).toHaveBeenCalled()
  })
})

// ── Delete flow ───────────────────────────────────────────────────────────────

describe('ReviewCard — delete flow', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows a confirmation prompt when Delete is clicked', async () => {
    const user = userEvent.setup()
    renderCard(baseReview, ownerId)

    await user.click(screen.getByRole('button', { name: /^delete$/i }))

    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^cancel$/i })).toBeInTheDocument()
  })

  it('dispatches deleteReviewThunk when Confirm is clicked', async () => {
    const user = userEvent.setup()
    renderCard(baseReview, ownerId)

    await user.click(screen.getByRole('button', { name: /^delete$/i }))
    await user.click(screen.getByRole('button', { name: /confirm/i }))

    expect(deleteReviewThunk).toHaveBeenCalledWith('r1')
  })

  it('hides the confirmation prompt when the second Cancel is clicked', async () => {
    const user = userEvent.setup()
    renderCard(baseReview, ownerId)

    await user.click(screen.getByRole('button', { name: /^delete$/i }))
    await user.click(screen.getByRole('button', { name: /^cancel$/i }))

    expect(screen.queryByRole('button', { name: /confirm/i })).not.toBeInTheDocument()
    // The original Delete button is back
    expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument()
  })
})
