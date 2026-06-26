import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { toursApi } from '@/api/tours.api'

const msg = (err, fallback) => err?.response?.data?.message ?? err?.message ?? fallback

// ── Thunks ────────────────────────────────────────────────────────────────

export const fetchToursThunk = createAsyncThunk(
  'tours/fetchList',
  async (params, { rejectWithValue }) => {
    try { return await toursApi.listTours(params) }
    catch (e) { return rejectWithValue(msg(e, 'Failed to load tours')) }
  },
)

export const fetchAdminToursThunk = createAsyncThunk(
  'tours/fetchAdminList',
  async (params, { rejectWithValue }) => {
    try { return await toursApi.listTours({ ...params, showAll: true }) }
    catch (e) { return rejectWithValue(msg(e, 'Failed to load tours')) }
  },
)

export const fetchTourThunk = createAsyncThunk(
  'tours/fetchOne',
  async (id, { rejectWithValue }) => {
    try { return await toursApi.getTour(id) }
    catch (e) { return rejectWithValue(msg(e, 'Tour not found')) }
  },
)

export const fetchRelatedThunk = createAsyncThunk(
  'tours/fetchRelated',
  async (id, { rejectWithValue }) => {
    try { return await toursApi.getRelatedTours(id) }
    catch (e) { return rejectWithValue([]) }
  },
)

export const fetchRecommendedThunk = createAsyncThunk(
  'tours/fetchRecommended',
  async (_, { rejectWithValue }) => {
    try { return await toursApi.getRecommended() }
    catch (e) { return rejectWithValue([]) }
  },
)

export const fetchCategoriesThunk = createAsyncThunk(
  'tours/fetchCategories',
  async (_, { rejectWithValue }) => {
    try { return await toursApi.getCategories() }
    catch (e) { return rejectWithValue([]) }
  },
  {
    // Prevent duplicate in-flight requests; API cache handles staleness
    condition: (_, { getState }) => getState().tours.categoriesStatus !== 'loading',
  },
)

export const fetchDestinationsThunk = createAsyncThunk(
  'tours/fetchDestinations',
  async (params, { rejectWithValue }) => {
    try { return await toursApi.getDestinations(params) }
    catch (e) { return rejectWithValue([]) }
  },
)

export const createTourThunk = createAsyncThunk(
  'tours/create',
  async (data, { rejectWithValue }) => {
    try { return await toursApi.createTour(data) }
    catch (e) { return rejectWithValue(msg(e, 'Failed to create tour')) }
  },
)

export const updateTourThunk = createAsyncThunk(
  'tours/update',
  async ({ id, data }, { rejectWithValue }) => {
    try { return await toursApi.updateTour(id, data) }
    catch (e) { return rejectWithValue(msg(e, 'Failed to update tour')) }
  },
)

export const deleteTourThunk = createAsyncThunk(
  'tours/delete',
  async (id, { rejectWithValue }) => {
    try { await toursApi.deleteTour(id); return id }
    catch (e) { return rejectWithValue(msg(e, 'Failed to delete tour')) }
  },
)

// ── Slice ──────────────────────────────────────────────────────────────────

const toursSlice = createSlice({
  name: 'tours',
  initialState: {
    // Public listing
    items: [],
    meta: null,
    listStatus: 'idle',
    listError: null,

    // Admin listing (all tours incl. inactive)
    adminItems: [],
    adminMeta: null,
    adminListStatus: 'idle',

    // Single detail
    tour: null,
    detailStatus: 'idle',
    detailError: null,

    // Related + recommended
    related: [],
    relatedStatus: 'idle',
    recommended: [],
    recommendedStatus: 'idle',

    // Reference data
    categories: [],
    categoriesStatus: 'idle',
    destinations: [],
    destinationsStatus: 'idle',

    // Admin mutations (create / update / delete)
    mutateStatus: 'idle',
    mutateError: null,
  },
  reducers: {
    clearMutate(state) {
      state.mutateStatus = 'idle'
      state.mutateError = null
    },
    clearDetail(state) {
      state.tour = null
      state.detailStatus = 'idle'
      state.detailError = null
      state.related = []
    },
  },
  extraReducers: (builder) => {
    builder
      // ── public list ──────────────────────────────────────────────────
      .addCase(fetchToursThunk.pending, (s) => { s.listStatus = 'loading'; s.listError = null })
      .addCase(fetchToursThunk.fulfilled, (s, { payload }) => {
        s.listStatus = 'succeeded'
        s.items = payload.tours
        s.meta = payload.meta
      })
      .addCase(fetchToursThunk.rejected, (s, { payload }) => {
        s.listStatus = 'failed'; s.listError = payload
      })

      // ── admin list ───────────────────────────────────────────────────
      .addCase(fetchAdminToursThunk.pending, (s) => { s.adminListStatus = 'loading' })
      .addCase(fetchAdminToursThunk.fulfilled, (s, { payload }) => {
        s.adminListStatus = 'succeeded'
        s.adminItems = payload.tours
        s.adminMeta = payload.meta
      })
      .addCase(fetchAdminToursThunk.rejected, (s) => { s.adminListStatus = 'failed' })

      // ── detail ───────────────────────────────────────────────────────
      .addCase(fetchTourThunk.pending, (s) => { s.detailStatus = 'loading'; s.detailError = null })
      .addCase(fetchTourThunk.fulfilled, (s, { payload }) => {
        s.detailStatus = 'succeeded'; s.tour = payload
      })
      .addCase(fetchTourThunk.rejected, (s, { payload }) => {
        s.detailStatus = 'failed'; s.detailError = payload
      })

      // ── related ──────────────────────────────────────────────────────
      .addCase(fetchRelatedThunk.pending, (s) => { s.relatedStatus = 'loading' })
      .addCase(fetchRelatedThunk.fulfilled, (s, { payload }) => {
        s.relatedStatus = 'succeeded'; s.related = payload ?? []
      })

      // ── recommended ──────────────────────────────────────────────────
      .addCase(fetchRecommendedThunk.pending, (s) => { s.recommendedStatus = 'loading' })
      .addCase(fetchRecommendedThunk.fulfilled, (s, { payload }) => {
        s.recommendedStatus = 'succeeded'; s.recommended = payload ?? []
      })

      // ── categories ───────────────────────────────────────────────────
      .addCase(fetchCategoriesThunk.pending, (s) => { s.categoriesStatus = 'loading' })
      .addCase(fetchCategoriesThunk.fulfilled, (s, { payload }) => {
        s.categoriesStatus = 'succeeded'; s.categories = payload ?? []
      })

      // ── destinations ─────────────────────────────────────────────────
      .addCase(fetchDestinationsThunk.pending, (s) => { s.destinationsStatus = 'loading' })
      .addCase(fetchDestinationsThunk.fulfilled, (s, { payload }) => {
        s.destinationsStatus = 'succeeded'; s.destinations = payload ?? []
      })

      // ── create ───────────────────────────────────────────────────────
      .addCase(createTourThunk.pending, (s) => { s.mutateStatus = 'loading'; s.mutateError = null })
      .addCase(createTourThunk.fulfilled, (s, { payload }) => {
        s.mutateStatus = 'succeeded'
        s.adminItems.unshift(payload)
      })
      .addCase(createTourThunk.rejected, (s, { payload }) => {
        s.mutateStatus = 'failed'; s.mutateError = payload
      })

      // ── update ───────────────────────────────────────────────────────
      .addCase(updateTourThunk.pending, (s) => { s.mutateStatus = 'loading'; s.mutateError = null })
      .addCase(updateTourThunk.fulfilled, (s, { payload }) => {
        s.mutateStatus = 'succeeded'
        const replace = (arr) => arr.map((t) => (t._id === payload._id ? payload : t))
        s.adminItems = replace(s.adminItems)
        s.items = replace(s.items)
        if (s.tour?._id === payload._id) s.tour = payload
      })
      .addCase(updateTourThunk.rejected, (s, { payload }) => {
        s.mutateStatus = 'failed'; s.mutateError = payload
      })

      // ── delete ───────────────────────────────────────────────────────
      .addCase(deleteTourThunk.pending, (s) => { s.mutateStatus = 'loading'; s.mutateError = null })
      .addCase(deleteTourThunk.fulfilled, (s, { payload: id }) => {
        s.mutateStatus = 'succeeded'
        // Soft-deleted — mark inactive rather than remove, so admin sees the change
        const deactivate = (arr) => arr.map((t) => (t._id === id ? { ...t, isActive: false } : t))
        s.adminItems = deactivate(s.adminItems)
        s.items = s.items.filter((t) => t._id !== id)
      })
      .addCase(deleteTourThunk.rejected, (s, { payload }) => {
        s.mutateStatus = 'failed'; s.mutateError = payload
      })
  },
})

export const { clearMutate, clearDetail } = toursSlice.actions
export default toursSlice.reducer
