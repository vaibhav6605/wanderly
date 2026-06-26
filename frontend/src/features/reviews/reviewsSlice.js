import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { reviewsApi } from '@/api/reviews.api'

const msg = (err, fallback) => err?.response?.data?.error?.message ?? err?.message ?? fallback

export const fetchReviewsThunk = createAsyncThunk(
  'reviews/fetchList',
  async (params, { rejectWithValue }) => {
    try {
      const res = await reviewsApi.listReviews(params)
      return { reviews: res.data.reviews, ratingDistribution: res.data.ratingDistribution, meta: res.meta }
    } catch (e) {
      return rejectWithValue(msg(e, 'Failed to load reviews'))
    }
  },
)

export const fetchMyStatusThunk = createAsyncThunk(
  'reviews/fetchMyStatus',
  async (tourId, { rejectWithValue }) => {
    try {
      return (await reviewsApi.getMyStatus(tourId)).data
    } catch (e) {
      return rejectWithValue(msg(e, 'Failed to load review status'))
    }
  },
)

export const createReviewThunk = createAsyncThunk(
  'reviews/create',
  async (data, { rejectWithValue }) => {
    try {
      return (await reviewsApi.createReview(data)).data.review
    } catch (e) {
      return rejectWithValue(msg(e, 'Failed to submit review'))
    }
  },
)

export const updateReviewThunk = createAsyncThunk(
  'reviews/update',
  async ({ id, ...data }, { rejectWithValue }) => {
    try {
      return (await reviewsApi.updateReview(id, data)).data.review
    } catch (e) {
      return rejectWithValue(msg(e, 'Failed to update review'))
    }
  },
)

export const approveReviewThunk = createAsyncThunk(
  'reviews/approve',
  async ({ id, isApproved }, { rejectWithValue }) => {
    try {
      return (await reviewsApi.approveReview(id, isApproved)).data.review
    } catch (e) {
      return rejectWithValue(msg(e, 'Failed to update review'))
    }
  },
)

export const deleteReviewThunk = createAsyncThunk(
  'reviews/delete',
  async (id, { rejectWithValue }) => {
    try {
      await reviewsApi.deleteReview(id)
      return id
    } catch (e) {
      return rejectWithValue(msg(e, 'Failed to delete review'))
    }
  },
)

const reviewsSlice = createSlice({
  name: 'reviews',
  initialState: {
    items: [],
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    meta: null,
    listStatus: 'idle',
    listError: null,
    myStatus: null,
    myStatusStatus: 'idle',
    actionStatus: 'idle',
    actionError: null,
  },
  reducers: {
    clearActionStatus(state) {
      state.actionStatus = 'idle'
      state.actionError = null
    },
    clearMyStatus(state) {
      state.myStatus = null
      state.myStatusStatus = 'idle'
    },
    clearReviews(state) {
      state.items = []
      state.ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      state.meta = null
      state.listStatus = 'idle'
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReviewsThunk.pending, (s) => { s.listStatus = 'loading'; s.listError = null })
      .addCase(fetchReviewsThunk.fulfilled, (s, { payload }) => {
        s.listStatus = 'succeeded'
        s.items = payload.reviews
        s.ratingDistribution = payload.ratingDistribution ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        s.meta = payload.meta
      })
      .addCase(fetchReviewsThunk.rejected, (s, { payload }) => {
        s.listStatus = 'failed'
        s.listError = payload
      })

      .addCase(fetchMyStatusThunk.pending, (s) => { s.myStatusStatus = 'loading' })
      .addCase(fetchMyStatusThunk.fulfilled, (s, { payload }) => {
        s.myStatusStatus = 'succeeded'
        s.myStatus = payload
      })
      .addCase(fetchMyStatusThunk.rejected, (s) => { s.myStatusStatus = 'failed' })

      .addCase(createReviewThunk.pending, (s) => { s.actionStatus = 'loading'; s.actionError = null })
      .addCase(createReviewThunk.fulfilled, (s, { payload }) => {
        s.actionStatus = 'succeeded'
        s.items.unshift(payload)
        s.myStatus = { ...s.myStatus, myReview: payload, canReview: false }
      })
      .addCase(createReviewThunk.rejected, (s, { payload }) => {
        s.actionStatus = 'failed'
        s.actionError = payload
      })

      .addCase(updateReviewThunk.pending, (s) => { s.actionStatus = 'loading'; s.actionError = null })
      .addCase(updateReviewThunk.fulfilled, (s, { payload }) => {
        s.actionStatus = 'succeeded'
        const idx = s.items.findIndex((r) => r._id === payload._id)
        if (idx !== -1) s.items[idx] = payload
        if (s.myStatus?.myReview?._id === payload._id) s.myStatus.myReview = payload
      })
      .addCase(updateReviewThunk.rejected, (s, { payload }) => {
        s.actionStatus = 'failed'
        s.actionError = payload
      })

      .addCase(approveReviewThunk.pending, (s) => { s.actionStatus = 'loading' })
      .addCase(approveReviewThunk.fulfilled, (s, { payload }) => {
        s.actionStatus = 'succeeded'
        const idx = s.items.findIndex((r) => r._id === payload._id)
        if (idx !== -1) s.items[idx] = payload
      })
      .addCase(approveReviewThunk.rejected, (s, { payload }) => {
        s.actionStatus = 'failed'
        s.actionError = payload
      })

      .addCase(deleteReviewThunk.pending, (s) => { s.actionStatus = 'loading' })
      .addCase(deleteReviewThunk.fulfilled, (s, { payload: id }) => {
        s.actionStatus = 'succeeded'
        s.items = s.items.filter((r) => r._id !== id)
        if (s.myStatus?.myReview?._id === id) {
          s.myStatus = { ...s.myStatus, myReview: null, canReview: true }
        }
      })
      .addCase(deleteReviewThunk.rejected, (s, { payload }) => {
        s.actionStatus = 'failed'
        s.actionError = payload
      })
  },
})

export const { clearActionStatus, clearMyStatus, clearReviews } = reviewsSlice.actions
export default reviewsSlice.reducer
