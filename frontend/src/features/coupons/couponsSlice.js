import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { couponsApi } from '@/api/coupons.api'

const msg = (err, fallback) => err?.response?.data?.error?.message ?? err?.message ?? fallback

export const fetchCouponsThunk = createAsyncThunk(
  'coupons/fetchList',
  async (params, { rejectWithValue }) => {
    try {
      const res = await couponsApi.listCoupons(params)
      return { coupons: res.data.coupons, meta: res.meta }
    } catch (e) {
      return rejectWithValue(msg(e, 'Failed to load coupons'))
    }
  },
)

export const createCouponThunk = createAsyncThunk(
  'coupons/create',
  async (data, { rejectWithValue }) => {
    try {
      return (await couponsApi.createCoupon(data)).data.coupon
    } catch (e) {
      return rejectWithValue(msg(e, 'Failed to create coupon'))
    }
  },
)

export const updateCouponThunk = createAsyncThunk(
  'coupons/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return (await couponsApi.updateCoupon(id, data)).data.coupon
    } catch (e) {
      return rejectWithValue(msg(e, 'Failed to update coupon'))
    }
  },
)

export const deleteCouponThunk = createAsyncThunk(
  'coupons/delete',
  async (id, { rejectWithValue }) => {
    try {
      await couponsApi.deleteCoupon(id)
      return id
    } catch (e) {
      return rejectWithValue(msg(e, 'Failed to delete coupon'))
    }
  },
)

const couponsSlice = createSlice({
  name: 'coupons',
  initialState: {
    items: [],
    meta: null,
    listStatus: 'idle',
    listError: null,
    actionStatus: 'idle',
    actionError: null,
  },
  reducers: {
    clearCouponAction(state) {
      state.actionStatus = 'idle'
      state.actionError = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCouponsThunk.pending, (s) => { s.listStatus = 'loading'; s.listError = null })
      .addCase(fetchCouponsThunk.fulfilled, (s, { payload }) => {
        s.listStatus = 'succeeded'
        s.items = payload.coupons
        s.meta = payload.meta
      })
      .addCase(fetchCouponsThunk.rejected, (s, { payload }) => {
        s.listStatus = 'failed'
        s.listError = payload
      })

      .addCase(createCouponThunk.pending, (s) => { s.actionStatus = 'loading' })
      .addCase(createCouponThunk.fulfilled, (s, { payload }) => {
        s.actionStatus = 'succeeded'
        s.items.unshift(payload)
      })
      .addCase(createCouponThunk.rejected, (s, { payload }) => {
        s.actionStatus = 'failed'
        s.actionError = payload
      })

      .addCase(updateCouponThunk.pending, (s) => { s.actionStatus = 'loading' })
      .addCase(updateCouponThunk.fulfilled, (s, { payload }) => {
        s.actionStatus = 'succeeded'
        const idx = s.items.findIndex((c) => c._id === payload._id)
        if (idx !== -1) s.items[idx] = payload
      })
      .addCase(updateCouponThunk.rejected, (s, { payload }) => {
        s.actionStatus = 'failed'
        s.actionError = payload
      })

      .addCase(deleteCouponThunk.pending, (s) => { s.actionStatus = 'loading' })
      .addCase(deleteCouponThunk.fulfilled, (s, { payload: id }) => {
        s.actionStatus = 'succeeded'
        s.items = s.items.filter((c) => c._id !== id)
      })
      .addCase(deleteCouponThunk.rejected, (s, { payload }) => {
        s.actionStatus = 'failed'
        s.actionError = payload
      })
  },
})

export const { clearCouponAction } = couponsSlice.actions
export default couponsSlice.reducer
