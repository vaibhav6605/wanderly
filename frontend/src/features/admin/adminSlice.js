import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { adminApi } from '@/api/admin.api'

const msg = (err, fallback) => err?.response?.data?.error?.message ?? err?.message ?? fallback

export const fetchOverviewThunk = createAsyncThunk(
  'admin/fetchOverview',
  async (_, { rejectWithValue }) => {
    try {
      return (await adminApi.getOverview()).data
    } catch (e) {
      return rejectWithValue(msg(e, 'Failed to load overview'))
    }
  },
)

export const fetchTrendsThunk = createAsyncThunk(
  'admin/fetchTrends',
  async (days = 30, { rejectWithValue }) => {
    try {
      return (await adminApi.getTrends(days)).data.trends
    } catch (e) {
      return rejectWithValue(msg(e, 'Failed to load trends'))
    }
  },
)

export const fetchTopToursThunk = createAsyncThunk(
  'admin/fetchTopTours',
  async (limit = 5, { rejectWithValue }) => {
    try {
      return (await adminApi.getTopTours(limit)).data.tours
    } catch (e) {
      return rejectWithValue(msg(e, 'Failed to load top tours'))
    }
  },
)

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    overview: null,
    overviewStatus: 'idle',
    trends: [],
    trendsStatus: 'idle',
    topTours: [],
    topToursStatus: 'idle',
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOverviewThunk.pending, (s) => { s.overviewStatus = 'loading' })
      .addCase(fetchOverviewThunk.fulfilled, (s, { payload }) => {
        s.overviewStatus = 'succeeded'
        s.overview = payload
      })
      .addCase(fetchOverviewThunk.rejected, (s) => { s.overviewStatus = 'failed' })

      .addCase(fetchTrendsThunk.pending, (s) => { s.trendsStatus = 'loading' })
      .addCase(fetchTrendsThunk.fulfilled, (s, { payload }) => {
        s.trendsStatus = 'succeeded'
        s.trends = payload
      })
      .addCase(fetchTrendsThunk.rejected, (s) => { s.trendsStatus = 'failed' })

      .addCase(fetchTopToursThunk.pending, (s) => { s.topToursStatus = 'loading' })
      .addCase(fetchTopToursThunk.fulfilled, (s, { payload }) => {
        s.topToursStatus = 'succeeded'
        s.topTours = payload
      })
      .addCase(fetchTopToursThunk.rejected, (s) => { s.topToursStatus = 'failed' })
  },
})

export default adminSlice.reducer
