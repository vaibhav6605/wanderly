import { describe, it, expect, vi, beforeEach } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import toursReducer, { clearDetail, clearMutate } from '@/features/tours/toursSlice'
import {
  fetchToursThunk,
  fetchTourThunk,
  fetchCategoriesThunk,
  createTourThunk,
  deleteTourThunk,
} from '@/features/tours/toursSlice'

// ── Mock the API ──────────────────────────────────────────────────────────────

vi.mock('@/api/tours.api', () => ({
  toursApi: {
    listTours: vi.fn(),
    getTour: vi.fn(),
    getCategories: vi.fn(),
    getRelatedTours: vi.fn(),
    getRecommended: vi.fn(),
    getDestinations: vi.fn(),
    createTour: vi.fn(),
    updateTour: vi.fn(),
    deleteTour: vi.fn(),
  },
}))

// Also mock the apiCache so caching doesn't interfere with test assertions
vi.mock('@/api/apiCache', () => ({
  apiCache: {
    get: vi.fn().mockReturnValue(null),
    set: vi.fn(),
    delete: vi.fn(),
    invalidatePrefix: vi.fn(),
    clear: vi.fn(),
  },
}))

import { toursApi } from '@/api/tours.api'

// ── Helpers ──────────────────────────────────────────────────────────────────

const fakeTour = { _id: 't1', title: 'Sample Tour', slug: 'sample-tour', price: 500, isActive: true }
const fakeCategory = { _id: 'cat1', name: 'Adventure', slug: 'adventure' }
const fakeMeta = { page: 1, limit: 20, total: 1, totalPages: 1 }

function makeStore(preloadedState = {}) {
  return configureStore({ reducer: { tours: toursReducer }, preloadedState })
}

// ── Pure reducer tests ─────────────────────────────────────────────────────────

describe('toursSlice — reducers', () => {
  it('has the correct initial state', () => {
    const state = toursReducer(undefined, { type: '@@INIT' })
    expect(state.items).toEqual([])
    expect(state.listStatus).toBe('idle')
    expect(state.tour).toBeNull()
    expect(state.categories).toEqual([])
    expect(state.mutateStatus).toBe('idle')
  })

  it('clearDetail resets tour, detailStatus, detailError, and related', () => {
    const initial = {
      tour: fakeTour,
      detailStatus: 'succeeded',
      detailError: null,
      related: [fakeTour],
    }
    const next = toursReducer({ ...toursReducer(undefined, { type: '@@INIT' }), ...initial }, clearDetail())
    expect(next.tour).toBeNull()
    expect(next.detailStatus).toBe('idle')
    expect(next.related).toEqual([])
  })

  it('clearMutate resets mutateStatus and mutateError', () => {
    const state = { ...toursReducer(undefined, { type: '@@INIT' }), mutateStatus: 'failed', mutateError: 'Something went wrong' }
    const next = toursReducer(state, clearMutate())
    expect(next.mutateStatus).toBe('idle')
    expect(next.mutateError).toBeNull()
  })
})

// ── fetchToursThunk ───────────────────────────────────────────────────────────

describe('fetchToursThunk', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sets listStatus to loading while pending', () => {
    toursApi.listTours.mockReturnValue(new Promise(() => {}))
    const store = makeStore()
    store.dispatch(fetchToursThunk({}))
    expect(store.getState().tours.listStatus).toBe('loading')
  })

  it('stores tours and meta on fulfillment', async () => {
    toursApi.listTours.mockResolvedValue({ tours: [fakeTour], meta: fakeMeta })
    const store = makeStore()
    await store.dispatch(fetchToursThunk({}))

    const { listStatus, items, meta } = store.getState().tours
    expect(listStatus).toBe('succeeded')
    expect(items).toHaveLength(1)
    expect(items[0]._id).toBe('t1')
    expect(meta.total).toBe(1)
  })

  it('sets listStatus to failed and stores error on rejection', async () => {
    toursApi.listTours.mockRejectedValue(new Error('Network error'))
    const store = makeStore()
    await store.dispatch(fetchToursThunk({}))

    const { listStatus, listError } = store.getState().tours
    expect(listStatus).toBe('failed')
    expect(listError).toBe('Network error')
  })
})

// ── fetchTourThunk ────────────────────────────────────────────────────────────

describe('fetchTourThunk', () => {
  beforeEach(() => vi.clearAllMocks())

  it('stores the fetched tour on success', async () => {
    toursApi.getTour.mockResolvedValue(fakeTour)
    const store = makeStore()
    await store.dispatch(fetchTourThunk('sample-tour'))

    const { detailStatus, tour } = store.getState().tours
    expect(detailStatus).toBe('succeeded')
    expect(tour.title).toBe('Sample Tour')
  })

  it('sets detailStatus to failed on 404', async () => {
    toursApi.getTour.mockRejectedValue({ response: { data: { message: 'Tour not found' } } })
    const store = makeStore()
    await store.dispatch(fetchTourThunk('nonexistent'))

    const { detailStatus, detailError } = store.getState().tours
    expect(detailStatus).toBe('failed')
    expect(detailError).toBe('Tour not found')
  })
})

// ── fetchCategoriesThunk — dedup guard ────────────────────────────────────────

describe('fetchCategoriesThunk', () => {
  beforeEach(() => vi.clearAllMocks())

  it('stores categories on success', async () => {
    toursApi.getCategories.mockResolvedValue([fakeCategory])
    const store = makeStore()
    await store.dispatch(fetchCategoriesThunk())

    const { categoriesStatus, categories } = store.getState().tours
    expect(categoriesStatus).toBe('succeeded')
    expect(categories).toHaveLength(1)
    expect(categories[0].name).toBe('Adventure')
  })

  it('skips the API call when a fetch is already in flight', async () => {
    toursApi.getCategories.mockReturnValue(new Promise(() => {}))
    const store = makeStore({
      tours: { ...toursReducer(undefined, { type: '@@INIT' }), categoriesStatus: 'loading' },
    })

    await store.dispatch(fetchCategoriesThunk())
    expect(toursApi.getCategories).not.toHaveBeenCalled()
  })
})

// ── createTourThunk ───────────────────────────────────────────────────────────

describe('createTourThunk', () => {
  beforeEach(() => vi.clearAllMocks())

  it('prepends the new tour to adminItems and sets mutateStatus to succeeded', async () => {
    toursApi.createTour.mockResolvedValue(fakeTour)
    const store = makeStore()
    await store.dispatch(createTourThunk({ title: 'Sample Tour' }))

    const { mutateStatus, adminItems } = store.getState().tours
    expect(mutateStatus).toBe('succeeded')
    expect(adminItems[0]._id).toBe('t1')
  })

  it('stores error and sets mutateStatus to failed on rejection', async () => {
    toursApi.createTour.mockRejectedValue({ response: { data: { message: 'Validation failed' } } })
    const store = makeStore()
    await store.dispatch(createTourThunk({}))

    expect(store.getState().tours.mutateStatus).toBe('failed')
    expect(store.getState().tours.mutateError).toBe('Validation failed')
  })
})

// ── deleteTourThunk ───────────────────────────────────────────────────────────

describe('deleteTourThunk', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deactivates the tour in adminItems and removes it from public items', async () => {
    toursApi.deleteTour.mockResolvedValue({ success: true })
    const preloaded = {
      tours: {
        ...toursReducer(undefined, { type: '@@INIT' }),
        items: [fakeTour],
        adminItems: [fakeTour],
        mutateStatus: 'idle',
      },
    }
    const store = makeStore(preloaded)
    await store.dispatch(deleteTourThunk('t1'))

    const { adminItems, items, mutateStatus } = store.getState().tours
    expect(mutateStatus).toBe('succeeded')
    expect(items).toHaveLength(0) // removed from public list
    expect(adminItems[0].isActive).toBe(false) // soft-deleted in admin list
  })
})
